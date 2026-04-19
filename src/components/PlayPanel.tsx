import styles from '../styles/app.module.css'
import { PLAYER_LABEL } from '../game/constants'
import { useGameStore } from '../store/gameStore'

export function PlayPanel() {
  const phase = useGameStore((s) => s.phase)
  const turn = useGameStore((s) => s.turn)
  const forcedMoveFor = useGameStore((s) => s.forcedMoveFor)
  const moveLog = useGameStore((s) => s.moveLog)
  const treasuresTaken = useGameStore((s) => s.treasuresTaken)

  const activePlayer =
    phase === 'FORCED_MOVE' && forcedMoveFor ? forcedMoveFor : turn
  const headline =
    phase === 'FORCED_MOVE'
      ? `${PLAYER_LABEL[activePlayer]} — 강제 이동할 칸을 선택하세요`
      : `${PLAYER_LABEL[activePlayer]} 차례`

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{headline}</h2>
      <p style={{ margin: '4px 0', fontSize: 13 }}>
        수집된 보물 {treasuresTaken.length} / 3
      </p>
      <div className={styles.log} aria-live="polite">
        {moveLog.length === 0 && (
          <p className={styles.logLine} style={{ opacity: 0.6 }}>
            아직 이동 기록이 없습니다.
          </p>
        )}
        {[...moveLog].reverse().map((event) => (
          <p key={event.seq} className={styles.logLine}>
            <strong>{PLAYER_LABEL[event.player]}</strong>{' '}
            {event.from} → {event.to} · {event.note}
          </p>
        ))}
      </div>
    </div>
  )
}
