import styles from '../styles/app.module.css'
import { useGameStore } from '../store/gameStore'

interface Props {
  title: string
  description: string
  buttonLabel: string
}

export function HandoffScreen({ title, description, buttonLabel }: Props) {
  const skip = useGameStore((s) => s.skipHandoff)
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayBox}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ margin: 0, lineHeight: 1.5 }}>{description}</p>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={skip}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
