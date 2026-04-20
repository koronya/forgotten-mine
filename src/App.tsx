import styles from './styles/app.module.css'
import { Board } from './components/Board'
import { SetupPanel } from './components/SetupPanel'
import { HandoffScreen } from './components/HandoffScreen'
import { PlayPanel } from './components/PlayPanel'
import { EndScreen } from './components/EndScreen'
import { RulesModal } from './components/RulesModal'
import { NameEntryScreen } from './components/NameEntryScreen'
import { PLAYER_LABEL } from './game/constants'
import { useGameStore } from './store/gameStore'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const turn = useGameStore((s) => s.turn)
  const scores = useGameStore((s) => s.scores)
  const names = useGameStore((s) => s.names)

  const activeForScore =
    phase === 'PLAYING' ? turn : phase === 'FORCED_MOVE' ? turn : null

  const p1Label = names.p1 || PLAYER_LABEL.p1
  const p2Label = names.p2 || PLAYER_LABEL.p2

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.title}>망각의 지뢰</div>
        <div className={styles.scoreRow}>
          <div
            className={`${styles.scoreBadge} ${
              activeForScore === 'p1' ? styles.scoreBadgeActive : ''
            }`}
          >
            {p1Label} {scores.p1}점
          </div>
          <div
            className={`${styles.scoreBadge} ${
              activeForScore === 'p2' ? styles.scoreBadgeActive : ''
            }`}
          >
            {p2Label} {scores.p2}점
          </div>
          <RulesModal />
        </div>
      </div>

      <div className={styles.layout}>
        <Board />
        <div>
          {phase === 'SETUP_P1' && <SetupPanel player="p1" />}
          {phase === 'SETUP_P2' && <SetupPanel player="p2" />}
          {(phase === 'PLAYING' || phase === 'FORCED_MOVE') && <PlayPanel />}
        </div>
      </div>

      {phase === 'NAME_ENTRY' && <NameEntryScreen />}

      {phase === 'HANDOFF_TO_P2' && (
        <HandoffScreen
          title={`${p2Label}에게 넘겨주세요`}
          description={`${p1Label}의 지뢰 배치가 완료되었습니다. 이제 ${p2Label}가 지뢰를 배치할 차례입니다. 화면을 전달한 뒤 [시작] 버튼을 눌러주세요.`}
          buttonLabel={`${p2Label} 배치 시작`}
        />
      )}

      {phase === 'HANDOFF_TO_PLAY' && (
        <HandoffScreen
          title="배치 완료 — 본 게임 시작"
          description="양 플레이어 지뢰 배치가 끝났습니다. 이제부터 번갈아 이동하며, 지뢰 위치는 표시되지 않습니다. 암기로 승부하세요."
          buttonLabel="게임 시작"
        />
      )}

      {phase === 'ENDED' && <EndScreen />}
    </div>
  )
}
