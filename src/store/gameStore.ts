import { create } from 'zustand'
import { toId } from '../game/board'
import {
  MINE_COUNT,
  PLAYER_LABEL,
  SETUP_SECONDS,
  STARTS,
  TREASURES,
} from '../game/constants'
import { canPlaceMine } from '../game/placement'
import { forcedMoveCandidates, isLegalMove } from '../game/moves'
import { evaluateMove } from '../game/scoring'
import type { CellId, MoveEvent, Phase, PlayerId } from '../game/types'

interface GameState {
  phase: Phase
  turn: PlayerId
  names: { p1: string; p2: string }
  mines: { p1: Set<CellId>; p2: Set<CellId> }
  initialMines: { p1: Set<CellId>; p2: Set<CellId> }
  pawns: { p1: CellId; p2: CellId }
  scores: { p1: number; p2: number }
  claimedCells: Set<CellId>
  treasuresTaken: CellId[]
  moveLog: MoveEvent[]
  setupDeadline: number | null
  forcedMoveFor: PlayerId | null
  pendingMove: CellId | null
  logSeq: number
  setPlayerNames: (p1Name: string, p2Name: string) => void
  togglePlacementMine: (player: PlayerId, cellId: CellId) => void
  submitMines: (player: PlayerId) => boolean
  skipHandoff: () => void
  proposeMove: (to: CellId) => void
  confirmPendingMove: () => void
  cancelPendingMove: () => void
  resetGame: () => void
  autoFillAndSubmit: (player: PlayerId) => void
}

function initialPawns(): { p1: CellId; p2: CellId } {
  return { p1: toId(STARTS.p1), p2: toId(STARTS.p2) }
}

function createInitial(): Omit<
  GameState,
  | 'setPlayerNames'
  | 'togglePlacementMine'
  | 'submitMines'
  | 'skipHandoff'
  | 'proposeMove'
  | 'confirmPendingMove'
  | 'cancelPendingMove'
  | 'resetGame'
  | 'autoFillAndSubmit'
> {
  return {
    phase: 'NAME_ENTRY',
    turn: 'p1',
    names: { p1: '', p2: '' },
    mines: { p1: new Set(), p2: new Set() },
    initialMines: { p1: new Set(), p2: new Set() },
    pawns: initialPawns(),
    scores: { p1: 0, p2: 0 },
    claimedCells: new Set(),
    treasuresTaken: [],
    moveLog: [],
    setupDeadline: null,
    forcedMoveFor: null,
    pendingMove: null,
    logSeq: 0,
  }
}

function appendLog(
  state: Pick<GameState, 'moveLog' | 'logSeq'>,
  event: Omit<MoveEvent, 'seq'>,
): { moveLog: MoveEvent[]; logSeq: number } {
  const seq = state.logSeq + 1
  return {
    moveLog: [...state.moveLog, { ...event, seq }],
    logSeq: seq,
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitial(),

  setPlayerNames: (p1Name, p2Name) => {
    const state = get()
    if (state.phase !== 'NAME_ENTRY') return
    const p1 = p1Name.trim() || PLAYER_LABEL.p1
    const p2 = p2Name.trim() || PLAYER_LABEL.p2
    set({
      names: { p1, p2 },
      phase: 'SETUP_P1',
      setupDeadline: Date.now() + SETUP_SECONDS * 1000,
    })
  },

  togglePlacementMine: (player, cellId) => {
    const state = get()
    if (
      (player === 'p1' && state.phase !== 'SETUP_P1') ||
      (player === 'p2' && state.phase !== 'SETUP_P2')
    ) {
      return
    }
    const current = state.mines[player]
    const next = new Set(current)
    if (next.has(cellId)) {
      next.delete(cellId)
    } else {
      if (next.size >= MINE_COUNT) return
      if (!canPlaceMine(next, cellId)) return
      next.add(cellId)
    }
    set({ mines: { ...state.mines, [player]: next } })
  },

  submitMines: (player) => {
    const state = get()
    if (state.mines[player].size !== MINE_COUNT) return false
    if (player === 'p1' && state.phase === 'SETUP_P1') {
      set({ phase: 'HANDOFF_TO_P2', setupDeadline: null })
      return true
    }
    if (player === 'p2' && state.phase === 'SETUP_P2') {
      set({ phase: 'HANDOFF_TO_PLAY', setupDeadline: null })
      return true
    }
    return false
  },

  autoFillAndSubmit: (player) => {
    const state = get()
    const existing = new Set(state.mines[player])
    if (existing.size < MINE_COUNT) {
      const candidates: CellId[] = []
      for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
          const id = toId({ row: r, col: c })
          if (canPlaceMine(existing, id)) candidates.push(id)
        }
      }
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
      }
      for (const id of candidates) {
        if (existing.size >= MINE_COUNT) break
        existing.add(id)
      }
    }
    set({ mines: { ...state.mines, [player]: existing } })
    get().submitMines(player)
  },

  skipHandoff: () => {
    const state = get()
    if (state.phase === 'HANDOFF_TO_P2') {
      set({
        phase: 'SETUP_P2',
        setupDeadline: Date.now() + SETUP_SECONDS * 1000,
      })
    } else if (state.phase === 'HANDOFF_TO_PLAY') {
      set({
        phase: 'PLAYING',
        turn: 'p1',
        initialMines: {
          p1: new Set(state.mines.p1),
          p2: new Set(state.mines.p2),
        },
      })
    }
  },

  proposeMove: (to) => {
    const state = get()
    if (state.phase === 'PLAYING') {
      const player = state.turn
      const opponent: PlayerId = player === 'p1' ? 'p2' : 'p1'
      if (!isLegalMove(state.pawns[player], to, state.pawns[opponent])) return
      set({ pendingMove: to })
      return
    }
    if (state.phase === 'FORCED_MOVE' && state.forcedMoveFor) {
      const player = state.forcedMoveFor
      const opponent: PlayerId = player === 'p1' ? 'p2' : 'p1'
      const candidates = forcedMoveCandidates(player, state.pawns[opponent])
      if (!candidates.includes(to)) return
      set({ pendingMove: to })
      return
    }
  },

  cancelPendingMove: () => set({ pendingMove: null }),

  confirmPendingMove: () => {
    const state = get()
    const to = state.pendingMove
    if (!to) return

    if (state.phase === 'PLAYING') {
      const player = state.turn
      const from = state.pawns[player]
      const opponent: PlayerId = player === 'p1' ? 'p2' : 'p1'
      const opponentPawn = state.pawns[opponent]
      if (!isLegalMove(from, to, opponentPawn)) {
        set({ pendingMove: null })
        return
      }

      const outcome = evaluateMove(
        to,
        state.mines,
        state.treasuresTaken,
        state.claimedCells,
      )

      if (outcome.kind === 'treasure') {
        const nextTaken = [...state.treasuresTaken, to]
        const pawns = { ...state.pawns, [player]: to }
        const scores = {
          ...state.scores,
          [player]: state.scores[player] + outcome.delta,
        }
        const logged = appendLog(state, {
          player,
          from,
          to,
          kind: 'treasure',
          delta: outcome.delta,
          note: `보물 획득 (+${outcome.delta})`,
        })
        const allTaken = nextTaken.length >= TREASURES.length
        set({
          pawns,
          scores,
          treasuresTaken: nextTaken,
          ...logged,
          phase: allTaken ? 'ENDED' : 'PLAYING',
          turn: allTaken ? player : opponent,
          pendingMove: null,
        })
        return
      }

      if (outcome.kind === 'mine') {
        const nextMines = {
          p1: new Set(state.mines.p1),
          p2: new Set(state.mines.p2),
        }
        nextMines.p1.delete(to)
        nextMines.p2.delete(to)
        const scores = {
          ...state.scores,
          [player]: state.scores[player] + outcome.delta,
        }
        const logged = appendLog(state, {
          player,
          from,
          to,
          kind: 'mine',
          delta: outcome.delta,
          note: `지뢰 밟음 (${outcome.delta}) — 강제 이동`,
        })
        set({
          mines: nextMines,
          scores,
          ...logged,
          phase: 'FORCED_MOVE',
          forcedMoveFor: player,
          pawns: { ...state.pawns, [player]: to },
          pendingMove: null,
        })
        return
      }

      const pawns = { ...state.pawns, [player]: to }
      const claimedCells = outcome.alreadyClaimed
        ? state.claimedCells
        : new Set(state.claimedCells).add(to)
      const scores = {
        ...state.scores,
        [player]: state.scores[player] + outcome.delta,
      }
      const note = outcome.alreadyClaimed
        ? '기획득 칸 (+0)'
        : outcome.delta > 0
          ? `주변 지뢰 ${outcome.delta}개 (+${outcome.delta})`
          : '빈 칸 (+0)'
      const logged = appendLog(state, {
        player,
        from,
        to,
        kind: 'empty',
        delta: outcome.delta,
        alreadyClaimed: outcome.alreadyClaimed,
        note,
      })
      set({
        pawns,
        scores,
        claimedCells,
        ...logged,
        turn: opponent,
        pendingMove: null,
      })
      return
    }

    if (state.phase === 'FORCED_MOVE' && state.forcedMoveFor) {
      const player = state.forcedMoveFor
      const opponent: PlayerId = player === 'p1' ? 'p2' : 'p1'
      const candidates = forcedMoveCandidates(player, state.pawns[opponent])
      if (!candidates.includes(to)) {
        set({ pendingMove: null })
        return
      }
      const from = state.pawns[player]
      const logged = appendLog(state, {
        player,
        from,
        to,
        kind: 'forced',
        delta: 0,
        note: '강제 이동 완료',
      })
      set({
        pawns: { ...state.pawns, [player]: to },
        forcedMoveFor: null,
        phase: 'PLAYING',
        turn: opponent,
        pendingMove: null,
        ...logged,
      })
    }
  },

  resetGame: () => {
    const previousNames = get().names
    set({ ...createInitial(), names: previousNames })
  },
}))
