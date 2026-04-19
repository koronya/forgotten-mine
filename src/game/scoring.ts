import { fromId, isTreasureCell } from './board'
import { MINE_PENALTY, TREASURE_SCORES } from './constants'
import { countMinesAround } from './placement'
import type { CellId } from './types'

export type MoveOutcome =
  | { kind: 'treasure'; delta: number }
  | { kind: 'mine'; delta: number; mineCountOnCell: number }
  | { kind: 'empty'; delta: number; alreadyClaimed: boolean }

export function evaluateMove(
  targetId: CellId,
  mines: { p1: Set<CellId>; p2: Set<CellId> },
  treasuresTaken: CellId[],
  claimedCells: Set<CellId>,
): MoveOutcome {
  const coord = fromId(targetId)

  if (isTreasureCell(coord) && !treasuresTaken.includes(targetId)) {
    const delta = TREASURE_SCORES[treasuresTaken.length] ?? 0
    return { kind: 'treasure', delta }
  }

  const mineCountOnCell =
    (mines.p1.has(targetId) ? 1 : 0) + (mines.p2.has(targetId) ? 1 : 0)
  if (mineCountOnCell > 0) {
    return { kind: 'mine', delta: MINE_PENALTY, mineCountOnCell }
  }

  const alreadyClaimed = claimedCells.has(targetId)
  const delta = alreadyClaimed ? 0 : countMinesAround(coord, mines)
  return { kind: 'empty', delta, alreadyClaimed }
}
