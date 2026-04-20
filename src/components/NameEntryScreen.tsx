import { useState } from 'react'
import styles from '../styles/app.module.css'
import { PLAYER_LABEL } from '../game/constants'
import { useGameStore } from '../store/gameStore'

const NAME_MAX_LENGTH = 20

export function NameEntryScreen() {
  const names = useGameStore((s) => s.names)
  const setPlayerNames = useGameStore((s) => s.setPlayerNames)
  const [p1Name, setP1Name] = useState(names.p1)
  const [p2Name, setP2Name] = useState(names.p2)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setPlayerNames(p1Name, p2Name)
  }

  return (
    <div className={styles.overlay}>
      <form
        className={styles.overlayBox}
        style={{ textAlign: 'left', maxWidth: 420 }}
        onSubmit={handleSubmit}
      >
        <h2 style={{ margin: 0, textAlign: 'center' }}>플레이어 이름 입력</h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: '#9aa0ad',
            lineHeight: 1.5,
            textAlign: 'center',
          }}
        >
          게임 화면에 표시될 이름을 입력해주세요. 비워두면 기본 이름이 사용됩니다.
        </p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#ffd36b', fontWeight: 700 }}>
            {PLAYER_LABEL.p1} 이름
          </span>
          <input
            type="text"
            value={p1Name}
            onChange={(event) => setP1Name(event.target.value)}
            placeholder={PLAYER_LABEL.p1}
            maxLength={NAME_MAX_LENGTH}
            autoFocus
            className={styles.input}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 13, color: '#ffd36b', fontWeight: 700 }}>
            {PLAYER_LABEL.p2} 이름
          </span>
          <input
            type="text"
            value={p2Name}
            onChange={(event) => setP2Name(event.target.value)}
            placeholder={PLAYER_LABEL.p2}
            maxLength={NAME_MAX_LENGTH}
            className={styles.input}
          />
        </label>

        <button type="submit" className={styles.primaryBtn}>
          게임 시작
        </button>
      </form>
    </div>
  )
}
