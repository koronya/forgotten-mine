import { useEffect } from 'react'
import styles from '../styles/app.module.css'
import { MINE_COUNT, PLAYER_LABEL } from '../game/constants'
import { formatMs, useCountdown } from '../hooks/useCountdown'
import { useGameStore } from '../store/gameStore'
import type { PlayerId } from '../game/types'

interface Props {
  player: PlayerId
}

export function SetupPanel({ player }: Props) {
  const minesSize = useGameStore((s) => s.mines[player].size)
  const deadline = useGameStore((s) => s.setupDeadline)
  const submit = useGameStore((s) => s.submitMines)
  const autoFill = useGameStore((s) => s.autoFillAndSubmit)

  const remaining = useCountdown(deadline)

  useEffect(() => {
    if (remaining === 0) {
      autoFill(player)
    }
  }, [remaining, autoFill, player])

  const canSubmit = minesSize === MINE_COUNT

  return (
    <div className={styles.panel}>
      <h2 className={styles.panelTitle}>{PLAYER_LABEL[player]} 지뢰 배치</h2>
      <p style={{ margin: '4px 0' }}>
        배치 {minesSize} / {MINE_COUNT}
      </p>
      <p style={{ margin: '4px 0' }}>
        남은 시간:{' '}
        <span className={styles.timer}>
          {remaining === null ? '—' : formatMs(remaining)}
        </span>
      </p>
      <p style={{ margin: '8px 0', fontSize: 12, color: '#9aa0ad' }}>
        회색 칸은 배치 금지 구역(양쪽 시작점 주변 5×5, 보물 칸)입니다. 클릭해서 지뢰를 토글하세요.
      </p>
      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => submit(player)}
        disabled={!canSubmit}
      >
        {canSubmit ? '배치 완료' : `${MINE_COUNT - minesSize}개 더 놓아주세요`}
      </button>
    </div>
  )
}
