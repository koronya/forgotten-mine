import { fromId, neighbors8, toId } from './board'
import { STARTS } from './constants'
import type { CellId, PlayerId } from './types'

export function legalMoves(
  from: CellId,
  opponentPawn: CellId,
): CellId[] {
  const current = fromId(from)
  return neighbors8(current)
    .map(toId)
    .filter((id) => id !== opponentPawn)
}

export function isLegalMove(
  from: CellId,
  to: CellId,
  opponentPawn: CellId,
): boolean {
  return legalMoves(from, opponentPawn).includes(to)
}

export function forcedMoveCandidates(
  player: PlayerId,
  opponentPawn: CellId,
): CellId[] {
  const start = STARTS[player]
  return neighbors8(start)
    .map(toId)
    .filter((id) => id !== opponentPawn)
}
