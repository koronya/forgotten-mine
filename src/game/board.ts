import { BOARD_SIZE, ROW_LABELS, STARTS, TREASURES } from './constants'
import type { CellId, Coord, PlayerId } from './types'

export function toId({ row, col }: Coord): CellId {
  return `${ROW_LABELS[row]}${col + 1}`
}

export function fromId(id: CellId): Coord {
  const rowChar = id[0]
  const colStr = id.slice(1)
  const row = ROW_LABELS.indexOf(rowChar)
  const col = Number(colStr) - 1
  if (row < 0 || Number.isNaN(col)) {
    throw new Error(`Invalid cell id: ${id}`)
  }
  return { row, col }
}

export function isInsideBoard({ row, col }: Coord): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE
}

export function chebyshev(a: Coord, b: Coord): number {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col))
}

export function neighbors8(coord: Coord): Coord[] {
  const result: Coord[] = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const n = { row: coord.row + dr, col: coord.col + dc }
      if (isInsideBoard(n)) result.push(n)
    }
  }
  return result
}

export function isTreasureCell(coord: Coord): boolean {
  return TREASURES.some((t) => t.row === coord.row && t.col === coord.col)
}

export function isStartCell(coord: Coord): PlayerId | null {
  if (STARTS.p1.row === coord.row && STARTS.p1.col === coord.col) return 'p1'
  if (STARTS.p2.row === coord.row && STARTS.p2.col === coord.col) return 'p2'
  return null
}

export function allCells(): Coord[] {
  const cells: Coord[] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      cells.push({ row: r, col: c })
    }
  }
  return cells
}
