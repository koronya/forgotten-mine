export type PlayerId = 'p1' | 'p2'

export interface Coord {
  row: number
  col: number
}

export type CellId = string

export type Phase =
  | 'SETUP_P1'
  | 'HANDOFF_TO_P2'
  | 'SETUP_P2'
  | 'HANDOFF_TO_PLAY'
  | 'PLAYING'
  | 'FORCED_MOVE'
  | 'ENDED'

export interface MoveEvent {
  seq: number
  player: PlayerId
  from: CellId
  to: CellId
  kind: 'empty' | 'mine' | 'treasure' | 'forced'
  delta: number
  alreadyClaimed?: boolean
  note?: string
}
