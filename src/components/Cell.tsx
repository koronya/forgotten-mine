import type { ReactNode } from 'react'
import styles from '../styles/board.module.css'
import type { CellId, PlayerId } from '../game/types'

export type MineReveal = 'own' | 'p1' | 'p2' | 'both' | null

interface Props {
  id: CellId
  isTreasure: boolean
  isTreasureTaken: boolean
  pawn: PlayerId | null
  mineReveal: MineReveal
  isForbidden: boolean
  isMoveTarget: boolean
  isPendingMove: boolean
  disabled: boolean
  onClick: (id: CellId) => void
}

const PAWN_LABEL: Record<PlayerId, string> = { p1: '①', p2: '②' }

export function Cell({
  id,
  isTreasure,
  isTreasureTaken,
  pawn,
  mineReveal,
  isForbidden,
  isMoveTarget,
  isPendingMove,
  disabled,
  onClick,
}: Props) {
  const classNames = [styles.cell]
  if (isForbidden && !pawn && !isTreasure) classNames.push(styles.cellForbidden)
  if (isTreasure && !isTreasureTaken) classNames.push(styles.cellTreasure)
  if (isTreasure && isTreasureTaken) classNames.push(styles.cellTreasureTaken)
  if (mineReveal === 'own') classNames.push(styles.cellMineOwn)
  else if (mineReveal === 'p1') classNames.push(styles.cellMineP1)
  else if (mineReveal === 'p2') classNames.push(styles.cellMineP2)
  else if (mineReveal === 'both') classNames.push(styles.cellMineBoth)
  if (pawn === 'p1') classNames.push(styles.cellPawnP1)
  if (pawn === 'p2') classNames.push(styles.cellPawnP2)
  if (isMoveTarget) classNames.push(styles.cellMoveTarget)
  if (isPendingMove) classNames.push(styles.cellMovePending)

  let content: ReactNode = null
  if (pawn) content = PAWN_LABEL[pawn]
  else if (isTreasure && !isTreasureTaken) content = '◆'
  else if (mineReveal === 'both') content = '◉'
  else if (mineReveal) content = '●'

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      onClick={() => onClick(id)}
      disabled={disabled}
      aria-label={id}
      title={id}
    >
      <span className={styles.cellCoord}>{id}</span>
      {content}
    </button>
  )
}
