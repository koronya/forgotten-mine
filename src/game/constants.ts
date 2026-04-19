import type { Coord, PlayerId } from './types'

export const BOARD_SIZE = 11
export const MINE_COUNT = 15
export const SETUP_SECONDS = 600
export const MINE_PENALTY = -5
export const TREASURE_SCORES = [10, 15, 20] as const
export const START_FORBIDDEN_RADIUS = 2

export const TREASURES: Coord[] = [
  { row: 5, col: 5 },
  { row: 0, col: 0 },
  { row: 10, col: 10 },
]

export const STARTS: Record<PlayerId, Coord> = {
  p1: { row: 0, col: 10 },
  p2: { row: 10, col: 0 },
}

export const PLAYER_LABEL: Record<PlayerId, string> = {
  p1: '플레이어 1',
  p2: '플레이어 2',
}

export const ROW_LABELS = 'abcdefghijk'
