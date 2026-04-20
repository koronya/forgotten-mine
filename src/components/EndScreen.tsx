import styles from '../styles/app.module.css'
import { PLAYER_LABEL } from '../game/constants'
import { useGameStore } from '../store/gameStore'

export function EndScreen() {
  const scores = useGameStore((s) => s.scores)
  const names = useGameStore((s) => s.names)
  const initialMines = useGameStore((s) => s.initialMines)
  const reset = useGameStore((s) => s.resetGame)

  const winner =
    scores.p1 === scores.p2
      ? null
      : scores.p1 > scores.p2
        ? 'p1'
        : 'p2'

  const p1Label = names.p1 || PLAYER_LABEL.p1
  const p2Label = names.p2 || PLAYER_LABEL.p2

  const overlapCount = [...initialMines.p1].filter((id) =>
    initialMines.p2.has(id),
  ).length

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>게임 종료</h2>
      <div style={{ fontSize: 14, lineHeight: 1.7 }}>
        <p style={{ margin: 0 }}>
          {p1Label}: <strong>{scores.p1}</strong>점
        </p>
        <p style={{ margin: 0 }}>
          {p2Label}: <strong>{scores.p2}</strong>점
        </p>
      </div>
      <p
        style={{
          margin: '10px 0 12px',
          fontSize: 16,
          fontWeight: 700,
          color: '#ffd36b',
        }}
      >
        {winner === null
          ? '무승부!'
          : `${winner === 'p1' ? p1Label : p2Label} 승리 🎉`}
      </p>

      <div
        style={{
          marginTop: 4,
          padding: '10px 12px',
          borderRadius: 8,
          background: '#1a1d24',
          border: '1px solid #30353f',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 11,
            color: '#7b8190',
            letterSpacing: '0.05em',
          }}
        >
          최종 지뢰 배치
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              background: '#1f2f55',
              border: '1px solid #4a6fb5',
            }}
          />
          <span>{p1Label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: 3,
              background: '#4a2a1f',
              border: '1px solid #b5714a',
            }}
          />
          <span>{p2Label}</span>
        </div>
        {overlapCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 12,
                height: 12,
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, #1f2f55 0%, #1f2f55 48%, #4a2a1f 52%, #4a2a1f 100%)',
                border: '1px solid #8a5b9a',
              }}
            />
            <span>양쪽 겹침 ({overlapCount}칸)</span>
          </div>
        )}
      </div>

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={reset}
        style={{ marginTop: 14, width: '100%' }}
      >
        새 게임
      </button>
    </div>
  )
}
