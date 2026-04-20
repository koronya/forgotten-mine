import { useMemo } from 'react'
import styles from '../styles/board.module.css'
import {
  fromId,
  isStartCell,
  isTreasureCell,
  toId,
} from '../game/board'
import { BOARD_SIZE, ROW_LABELS } from '../game/constants'
import { legalMoves, forcedMoveCandidates } from '../game/moves'
import { isForbiddenForMine } from '../game/placement'
import { useGameStore } from '../store/gameStore'
import type { CellId, PlayerId } from '../game/types'
import { Cell } from './Cell'

function useSetupPlayer(): PlayerId | null {
  const phase = useGameStore((s) => s.phase)
  if (phase === 'SETUP_P1') return 'p1'
  if (phase === 'SETUP_P2') return 'p2'
  return null
}

export function Board() {
  const phase = useGameStore((s) => s.phase)
  const turn = useGameStore((s) => s.turn)
  const mines = useGameStore((s) => s.mines)
  const pawns = useGameStore((s) => s.pawns)
  const treasuresTaken = useGameStore((s) => s.treasuresTaken)
  const forcedMoveFor = useGameStore((s) => s.forcedMoveFor)
  const pendingMove = useGameStore((s) => s.pendingMove)
  const togglePlacementMine = useGameStore((s) => s.togglePlacementMine)
  const proposeMove = useGameStore((s) => s.proposeMove)

  const setupPlayer = useSetupPlayer()

  const moveTargets = useMemo<Set<CellId>>(() => {
    if (phase === 'PLAYING') {
      const me = turn
      const opponent: PlayerId = me === 'p1' ? 'p2' : 'p1'
      return new Set(legalMoves(pawns[me], pawns[opponent]))
    }
    if (phase === 'FORCED_MOVE' && forcedMoveFor) {
      const me = forcedMoveFor
      const opponent: PlayerId = me === 'p1' ? 'p2' : 'p1'
      return new Set(forcedMoveCandidates(me, pawns[opponent]))
    }
    return new Set()
  }, [phase, turn, pawns, forcedMoveFor])

  const handleClick = (id: CellId) => {
    if (setupPlayer) {
      togglePlacementMine(setupPlayer, id)
      return
    }
    if (phase === 'PLAYING' || phase === 'FORCED_MOVE') {
      proposeMove(id)
      return
    }
  }

  const cellDisabled = (id: CellId): boolean => {
    if (setupPlayer) {
      const forbidden = isForbiddenForMine(fromId(id))
      const alreadyOwn = mines[setupPlayer].has(id)
      if (alreadyOwn) return false
      return forbidden
    }
    if (phase === 'PLAYING') {
      return !moveTargets.has(id)
    }
    if (phase === 'FORCED_MOVE') {
      return !moveTargets.has(id)
    }
    return true
  }

  const colHeader = []
  colHeader.push(
    <div key="corner" className={styles.corner}>
      {' '}
    </div>,
  )
  for (let c = 0; c < BOARD_SIZE; c++) {
    colHeader.push(
      <div key={`col-${c}`} className={styles.colLabel}>
        {c + 1}
      </div>,
    )
  }

  const rows = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    rows.push(
      <div key={`rowlabel-${r}`} className={styles.rowLabel}>
        {ROW_LABELS[r]}
      </div>,
    )
    for (let c = 0; c < BOARD_SIZE; c++) {
      const id = toId({ row: r, col: c })
      const coord = { row: r, col: c }
      const pawn: PlayerId | null =
        pawns.p1 === id ? 'p1' : pawns.p2 === id ? 'p2' : null
      const isTreasure = isTreasureCell(coord)
      const isTreasureTaken = treasuresTaken.includes(id)
      const isOwnMine =
        setupPlayer !== null && mines[setupPlayer].has(id)
      const isForbidden = isForbiddenForMine(coord) && !isStartCell(coord)
      const isMoveTarget = moveTargets.has(id)
      const isPendingMove = pendingMove === id
      rows.push(
        <Cell
          key={id}
          id={id}
          isTreasure={isTreasure}
          isTreasureTaken={isTreasureTaken}
          pawn={pawn}
          isOwnMine={isOwnMine}
          isForbidden={isForbidden}
          isMoveTarget={isMoveTarget}
          isPendingMove={isPendingMove}
          disabled={cellDisabled(id)}
          onClick={handleClick}
        />,
      )
    }
  }

  return (
    <div className={styles.boardWrap}>
      <div className={styles.grid}>
        {colHeader}
        {rows}
      </div>
    </div>
  )
}
