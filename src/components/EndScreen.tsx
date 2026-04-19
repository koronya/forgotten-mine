import styles from '../styles/app.module.css'
import { PLAYER_LABEL } from '../game/constants'
import { useGameStore } from '../store/gameStore'

export function EndScreen() {
  const scores = useGameStore((s) => s.scores)
  const reset = useGameStore((s) => s.resetGame)

  const winner =
    scores.p1 === scores.p2
      ? null
      : scores.p1 > scores.p2
        ? 'p1'
        : 'p2'

  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBox}>
        <h2 style={{ margin: 0 }}>게임 종료</h2>
        <div>
          <p style={{ margin: 4 }}>
            {PLAYER_LABEL.p1}: <strong>{scores.p1}</strong>점
          </p>
          <p style={{ margin: 4 }}>
            {PLAYER_LABEL.p2}: <strong>{scores.p2}</strong>점
          </p>
        </div>
        <p style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
          {winner === null ? '무승부!' : `${PLAYER_LABEL[winner]} 승리 🎉`}
        </p>
        <button type="button" className={styles.primaryBtn} onClick={reset}>
          새 게임
        </button>
      </div>
    </div>
  )
}
