import { useState } from 'react'
import styles from '../styles/app.module.css'

export function RulesModal() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        className={styles.secondaryBtn}
        onClick={() => setOpen(true)}
      >
        규칙 보기
      </button>
      {open && (
        <div className={styles.overlay} onClick={() => setOpen(false)}>
          <div
            className={styles.overlayBox}
            style={{ maxWidth: 560, textAlign: 'left' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 style={{ margin: 0 }}>망각의 지뢰 규칙 요약</h2>
            <ul style={{ lineHeight: 1.6, paddingLeft: 18, margin: 0 }}>
              <li>11×11 보드. 보물은 a1, f6, k11. 시작점은 a11(P1), k1(P2).</li>
              <li>각 플레이어는 지뢰 15개를 비공개로 배치. 양쪽 시작점 2×2 영역(a10·a11·b10·b11 / j1·j2·k1·k2)과 보물 칸은 금지.</li>
              <li>배치가 끝나면 지뢰는 화면에서 사라집니다. 암기 플레이.</li>
              <li>자기 차례엔 8방 인접 칸 중 상대 말이 없는 곳으로 1칸 이동.</li>
              <li>빈 칸 이동: 주변 8칸 지뢰 개수만큼 득점. 같은 칸 재득점 불가.</li>
              <li>지뢰: -5점, 해당 칸 지뢰 모두 제거, 자기 시작점 인접 3칸 중 선택해 강제 이동.</li>
              <li>보물: 순서대로 +10 / +15 / +20. 3개 모두 획득되면 즉시 종료.</li>
            </ul>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => setOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}
