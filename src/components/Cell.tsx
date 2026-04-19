import type { ReactNode } from 'react'
import styles from '../styles/board.module.css'
import type { CellId, PlayerId } from '../game/types'

interface Props {
  id: CellId
  isTreasure: boolean
  isTreasureTaken: boolean
  pawn: PlayerId | null
  isOwnMine: boolean
  isForbidden: boolean
  isClaimed: boolean
  claimValue: number | null
  isMoveTarget: boolean
  disabled: boolean
  onClick: (id: CellId) => void
}

const PAWN_LABEL: Record<PlayerId, string> = { p1: '①', p2: '②' }

export function Cell({
  id,
  isTreasure,
  isTreasureTaken,
  pawn,
  isOwnMine,
  isForbidden,
  isClaimed,
  claimValue,
  isMoveTarget,
  disabled,
  onClick,
}: Props) {
  const classNames = [styles.cell]
  if (isForbidden && !pawn && !isTreasure) classNames.push(styles.cellForbidden)
  if (isTreasure && !isTreasureTaken) classNames.push(styles.cellTreasure)
  if (isTreasure && isTreasureTaken) classNames.push(styles.cellTreasureTaken)
  if (isOwnMine) classNames.push(styles.cellMineOwn)
  if (isClaimed && !pawn) classNames.push(styles.cellClaimed)
  if (pawn === 'p1') classNames.push(styles.cellPawnP1)
  if (pawn === 'p2') classNames.push(styles.cellPawnP2)
  if (isMoveTarget) classNames.push(styles.cellMoveTarget)

  let content: ReactNode = null
  if (pawn) content = PAWN_LABEL[pawn]
  else if (isTreasure && !isTreasureTaken) content = '◆'
  else if (isOwnMine) content = '●'
  else if (isClaimed && claimValue !== null)
    content = <span className={styles.cellValue}>{claimValue}</span>

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
