import styles from '../styles/app.module.css'
import { PLAYER_LABEL } from '../game/constants'
import { useGameStore } from '../store/gameStore'
import type { MoveEvent } from '../game/types'

interface EventMessage {
  text: string
  delta: number | null
  tone: 'good' | 'bad' | 'neutral'
}

function describeEvent(event: MoveEvent): EventMessage {
  switch (event.kind) {
    case 'mine':
      return {
        text: '당신은 지뢰를 밟았습니다!',
        delta: event.delta,
        tone: 'bad',
      }
    case 'treasure':
      return {
        text: '보물을 획득했습니다!',
        delta: event.delta,
        tone: 'good',
      }
    case 'forced':
      return {
        text: '강제 이동이 완료되었습니다.',
        delta: null,
        tone: 'neutral',
      }
    case 'empty':
      if (event.alreadyClaimed) {
        return {
          text: '이 칸은 이미 방문한 적이 있는 곳입니다.',
          delta: 0,
          tone: 'neutral',
        }
      }
      if (event.delta > 0) {
        return {
          text: `현재 칸 주위에 ${event.delta}개의 지뢰가 있습니다.`,
          delta: event.delta,
          tone: 'good',
        }
      }
      return {
        text: '현재 칸 주위에 지뢰가 없습니다.',
        delta: 0,
        tone: 'neutral',
      }
  }
}

function formatDelta(delta: number | null): string {
  if (delta === null) return ''
  if (delta > 0) return `+${delta}`
  return `${delta}`
}

export function PlayPanel() {
  const phase = useGameStore((s) => s.phase)
  const turn = useGameStore((s) => s.turn)
  const forcedMoveFor = useGameStore((s) => s.forcedMoveFor)
  const moveLog = useGameStore((s) => s.moveLog)
  const treasuresTaken = useGameStore((s) => s.treasuresTaken)
  const mines = useGameStore((s) => s.mines)
  const pendingMove = useGameStore((s) => s.pendingMove)
  const confirmPendingMove = useGameStore((s) => s.confirmPendingMove)
  const cancelPendingMove = useGameStore((s) => s.cancelPendingMove)

  const mineCellCount = new Set([...mines.p1, ...mines.p2]).size

  const activePlayer =
    phase === 'FORCED_MOVE' && forcedMoveFor ? forcedMoveFor : turn
  const headline =
    phase === 'FORCED_MOVE'
      ? `${PLAYER_LABEL[activePlayer]} — 강제 이동할 칸을 선택하세요`
      : `${PLAYER_LABEL[activePlayer]} 차례`

  const lastEvent = moveLog[moveLog.length - 1]
  const eventMessage = lastEvent ? describeEvent(lastEvent) : null
  const deltaColor =
    eventMessage?.tone === 'bad'
      ? '#ff9eb2'
      : eventMessage?.tone === 'good'
        ? '#7ee28a'
        : '#9aa0ad'

  return (
    <div className={styles.panel}>
      <p
        style={{
          margin: '0 0 8px',
          fontSize: 13,
          color: '#9aa0ad',
        }}
      >
        지뢰가 설치된 칸:{' '}
        <strong style={{ color: '#ffd36b' }}>{mineCellCount}</strong>개
      </p>
      <h2 className={styles.panelTitle}>{headline}</h2>
      <p style={{ margin: '4px 0', fontSize: 13 }}>
        수집된 보물 {treasuresTaken.length} / 3
      </p>

      {pendingMove && (
        <div
          style={{
            marginTop: 10,
            padding: '12px 14px',
            borderRadius: 8,
            background: '#2a3a2f',
            border: '1px solid #7ee28a',
          }}
          aria-live="polite"
        >
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
            <strong style={{ color: '#7ee28a' }}>{pendingMove}</strong>
            으로 이동하시겠습니까?
          </p>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
            }}
          >
            <button
              type="button"
              className={styles.primaryBtn}
              style={{ flex: 1 }}
              onClick={confirmPendingMove}
            >
              예
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ flex: 1 }}
              onClick={cancelPendingMove}
            >
              아니오
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          marginTop: 10,
          padding: '12px 14px',
          borderRadius: 8,
          background: '#1a1d24',
          border: '1px solid #30353f',
          minHeight: 64,
        }}
        aria-live="polite"
      >
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: '#7b8190',
            letterSpacing: '0.05em',
          }}
        >
          이번 이동 결과
        </p>
        {eventMessage ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 14, lineHeight: 1.4 }}>
              {eventMessage.text}
            </span>
            {eventMessage.delta !== null && (
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: deltaColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatDelta(eventMessage.delta)}
              </span>
            )}
          </div>
        ) : (
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7b8190' }}>
            첫 이동을 기다리는 중...
          </p>
        )}
      </div>
    </div>
  )
}
