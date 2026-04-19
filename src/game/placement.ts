import { chebyshev, fromId, isTreasureCell, neighbors8, toId } from './board'
import { START_FORBIDDEN_RADIUS, STARTS } from './constants'
import type { CellId, Coord } from './types'

export function isForbiddenForMine(coord: Coord): boolean {
  if (isTreasureCell(coord)) return true
  if (chebyshev(coord, STARTS.p1) <= START_FORBIDDEN_RADIUS) return true
  if (chebyshev(coord, STARTS.p2) <= START_FORBIDDEN_RADIUS) return true
  return false
}

export function canPlaceMine(existing: Set<CellId>, cellId: CellId): boolean {
  if (existing.has(cellId)) return false
  return !isForbiddenForMine(fromId(cellId))
}

export function countMinesAround(
  coord: Coord,
  minesByPlayer: { p1: Set<CellId>; p2: Set<CellId> },
): number {
  let count = 0
  for (const n of neighbors8(coord)) {
    const id = toId(n)
    if (minesByPlayer.p1.has(id)) count++
    if (minesByPlayer.p2.has(id)) count++
  }
  return count
}
