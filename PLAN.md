# 망각의 지뢰 — 웹게임 구현 계획

## Context

`forgotten-mine/` 폴더에 보드게임 "망각의 지뢰"를 React + TypeScript + Vite 기반 **로컬 2인 핫시트** 웹게임으로 신규 구축한다. 첫 릴리즈 범위는 **본 게임(11×11 보드, 플레이어당 지뢰 15개)**로 한정한다.

핵심 의사결정:
- 플레이 방식: 한 화면을 번갈아 쓰는 핫시트(서버 없음)
- 보드/지뢰: 11×11, 플레이어당 15개
- 지뢰 표시: 원작 규칙대로 **자기 지뢰도 배치 완료 후엔 숨김** (암기 게임)
- 보물 위치: **a1, f6(중앙), k11** — 플레이어 시작 위치: **a11(P1), k1(P2)**
- **지뢰 배치 금지 구역(시작점 기준)**: 각 시작점을 포함한 **2×2** 영역
  - P1(a11) 주변: a10, a11, b10, b11
  - P2(k1) 주변: j1, j2, k1, k2
  - 보물 칸(a1, f6, k11)

## 아키텍처 개요

### 기술 스택
- **빌드**: Vite 5 + React 18 + TypeScript (strict)
- **상태 관리**: `zustand` — 상태가 여러 컴포넌트에 걸쳐 있고 불변 업데이트가 잦으므로 Redux보다 가볍고 Context+useReducer보다 보일러플레이트가 적다.
- **스타일링**: CSS Modules — 외부 의존성 없이 컴포넌트 스코프 스타일. 보드/셀처럼 그리드 중심 레이아웃에 충분.
- **테스트(선택)**: Vitest + @testing-library/react — 게임 규칙(순수 함수)은 단위 테스트 가능.
- **린트/포맷**: ESLint + Prettier.

### 디렉터리 구조

```
forgotten-mine/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── vite-env.d.ts
    ├── game/                  # 순수 도메인 로직 (React 의존성 0)
    │   ├── types.ts           # Cell, GameState, Phase, PlayerId 등 타입
    │   ├── constants.ts       # BOARD_SIZE, MINE_COUNT, TREASURES, STARTS, TREASURE_SCORES
    │   ├── board.ts           # 좌표 ↔ id 변환, 인접셀, 거리 계산
    │   ├── placement.ts       # 지뢰 배치 가능 여부 검증 (금지 구역 포함)
    │   ├── moves.ts           # 이동 가능 여부, 8방 이웃, 강제이동 후보
    │   └── scoring.ts         # 이동 결과 해석(지뢰/보물/일반) + 점수 계산
    ├── store/
    │   └── gameStore.ts       # zustand store — phase 전이, 액션 정의
    ├── components/
    │   ├── Board.tsx          # 11×11 그리드 렌더, 셀 클릭 라우팅
    │   ├── Cell.tsx           # 좌표, 보물/말/점수/클릭 가능 상태 표시
    │   ├── SetupPanel.tsx     # 지뢰 배치 UI (남은 지뢰 수, 제출 버튼, 10분 타이머)
    │   ├── HandoffScreen.tsx  # "다음 플레이어에게 넘겨주세요" 전환 화면
    │   ├── PlayPanel.tsx      # 현재 턴, 점수판, 최근 이동 로그
    │   ├── EndScreen.tsx      # 승자/최종 점수/재시작
    │   └── RulesModal.tsx     # 규칙 요약 (도움말)
    ├── styles/
    │   ├── global.css
    │   ├── board.module.css
    │   └── app.module.css
    └── hooks/
        └── useCountdown.ts    # 10분 타이머 훅
```

## 핵심 도메인 모델

### 좌표 체계
- 내부 표현: `{ row: 0..10, col: 0..10 }` — 0-based 정수.
- 표시용: `a..k` × `1..11` (예: row 0 col 10 → `a11`).
- `board.ts`에 `toId({row,col}) ↔ fromId(string)` 헬퍼.

### 상수 (`constants.ts`)
```ts
BOARD_SIZE = 11
MINE_COUNT = 15
TREASURES = [{row:5,col:5}, {row:0,col:0}, {row:10,col:10}]   // f6, a1, k11
STARTS = { p1: {row:0,col:10}, p2: {row:10,col:0} }           // a11, k1
TREASURE_SCORES = [10, 15, 20]
MINE_PENALTY = -5
SETUP_SECONDS = 600
START_FORBIDDEN_RADIUS = 1   // 체비쇼프 ≤ 1 → 시작점 포함 2×2
```

### 지뢰 배치 금지 구역 (`placement.ts`)
**체비쇼프 거리 ≤ 1** (시작점 포함 2×2 영역)로 해석.
- P1(a11) 금지: **a10, a11, b10, b11**
- P2(k1) 금지: **j1, j2, k1, k2**
- 보물 칸(a1, f6, k11) 금지
- 위 조건 외에도 같은 플레이어의 지뢰는 한 칸에 1개만(규칙 명시). 상대와 겹치는 건 허용.

### GameState (zustand)
```ts
type Phase =
  | 'SETUP_P1'        // P1 배치
  | 'HANDOFF_TO_P2'   // P2에게 넘기기
  | 'SETUP_P2'        // P2 배치
  | 'HANDOFF_TO_PLAY' // 게임 시작 안내
  | 'PLAYING'
  | 'FORCED_MOVE'     // 지뢰 밟은 직후 강제 이동 선택 중
  | 'ENDED'

interface MoveEvent {
  seq: number
  player: PlayerId
  from: CellId
  to: CellId
  kind: 'empty' | 'mine' | 'treasure' | 'forced'
  delta: number
  alreadyClaimed?: boolean   // kind='empty'에서 재방문 여부 구분
  note?: string
}

interface GameState {
  phase: Phase
  turn: 'p1' | 'p2'             // PLAYING 중 현재 턴
  mines: { p1: Set<CellId>; p2: Set<CellId> }   // 아직 살아있는 지뢰
  pawns: { p1: CellId; p2: CellId }
  scores: { p1: number; p2: number }
  claimedCells: Set<CellId>     // 점수 획득된 비지뢰 칸 (재득점 방지)
  treasuresTaken: CellId[]      // 순서대로 (배열 길이로 +10/15/20 결정)
  moveLog: MoveEvent[]          // "P1이 f7로 이동 → +3점" 등 딜러 공지용
  setupDeadline: number | null  // epoch ms (10분 타이머)
  forcedMoveFor: PlayerId | null
}
```

### 핵심 액션
- `togglePlacementMine(player, cellId)` — SETUP 중만 허용, 규칙 검증 후 토글
- `submitMines(player)` — 15개 채웠을 때만 통과. 이후 HANDOFF 단계로 전이.
- `autoFillAndSubmit(player)` — 타이머 만료 시 허용 구역에서 부족분 랜덤 배치 후 제출.
- `skipHandoff()` — HANDOFF_TO_P2 / HANDOFF_TO_PLAY → 다음 단계 진입.
- `movePawn(to)` — PLAYING에서만. 검증 → 결과 해석 → 점수/강제이동/턴 교대 → 종료 체크.
- `resolveForcedMove(to)` — FORCED_MOVE에서만. 후보 칸 중 하나로 이동 후 턴 교대.
- `resetGame()` — 전체 초기화.

### 이동 결과 해석 (`scoring.ts`)
순서대로 평가:
1. 대상 칸이 보물이면: `TREASURE_SCORES[treasuresTaken.length]` 획득, 보물 제거. 3개 모두 수집 시 `phase = 'ENDED'`.
2. 대상 칸에 **양 플레이어 지뢰 합계 ≥ 1**이면: -5, 해당 칸의 모든 지뢰 제거, `phase = 'FORCED_MOVE'`. 플레이어가 자기 출발지 인접 칸(보드 내, 상대 말 없는 곳) 중 선택해 이동.
3. 그 외(빈 칸): `claimedCells`에 없을 때만 주변 8칸 지뢰 개수(중복 포함) 만큼 득점, `claimedCells`에 추가.

### 이동 규칙 (`moves.ts`)
- 현재 말 기준 8방 인접 중 **상대 말이 아닌 칸**만 허용.
- 보드 밖 금지.
- 강제이동 시: 자기 출발지 기준 8방 중 보드 내·상대 말이 없는 칸만 후보 (코너라서 최대 3칸).

## UI / 컴포넌트 동작

### `Board.tsx`
- CSS Grid `grid-template-columns: 26px repeat(11, 44px)` — 좌측에 a~k 레이블, 상단에 1~11 레이블.
- 각 `Cell`은 현재 phase와 말/보물/점수 상태에 따라 클래스 조건부 부여.
- 셀 클릭 시 phase 분기:
  - SETUP_*: `togglePlacementMine`
  - PLAYING: `movePawn` (인접 칸일 때만 하이라이트/허용)
  - FORCED_MOVE: `resolveForcedMove` (강제이동 후보만 하이라이트)

### `Cell.tsx`
- 기본: 좌표 텍스트(예: `f6`).
- 보물 칸: 보물 아이콘 (미수집 시). 수집 후엔 회색.
- 말 칸: P1/P2 아이콘.
- SETUP 중: **자기 배치한 칸**은 표시 (확인용). 배치 완료(HANDOFF 이후) 후엔 표시 제거.
- 획득 완료된 일반 칸: 녹색 강조 + 획득 점수 숫자 (로그 역할).
- 이동 가능 칸: 테두리 강조.

### `SetupPanel.tsx`
- 상단: "플레이어 N 지뢰 배치 — N / 15"
- 10분 카운트다운(`useCountdown`). 만료 시 `autoFillAndSubmit`으로 남은 지뢰를 허용 구역에 랜덤 배치 후 자동 제출.
- "배치 완료" 버튼: 15개 다 놓였을 때만 활성화.

### `HandoffScreen.tsx`
- 전체 화면 오버레이: "다음 플레이어에게 기기를 넘기고 [시작] 버튼을 누르세요".
- 이 단계에서 이전 플레이어의 지뢰 배치가 렌더에서 제거되어 보이지 않음.

### `PlayPanel.tsx`
- **상단: 지뢰가 설치된 칸 수 공개** (규칙: "지뢰가 설치된 칸의 개수는 공개된다"). 양 플레이어 지뢰 Set의 합집합 크기로 계산하며, 지뢰가 밟혀 제거될 때마다 자동 감소.
- 현재 턴(또는 강제이동 중 플레이어) 표시.
- 수집된 보물 개수 / 3.
- `moveLog` 역순 표시 — "P1이 f7로 이동 → +2점", "P2가 지뢰를 밟음 (-5), 강제 이동" 등 딜러 공지 역할.
- **로그 하단 "이번 이동 결과" 메시지 패널** — 가장 최근 `MoveEvent` 하나를 사람이 읽기 좋은 문장 + 큰 점수 변화로 표시. `describeEvent` 분기:
  - `mine`: "당신은 지뢰를 밟았습니다!" + `-5`
  - `treasure`: "보물을 획득했습니다!" + `+10/15/20`
  - `empty && alreadyClaimed`: "이 칸은 이미 방문한 적이 있는 곳입니다." + `0`
  - `empty && !alreadyClaimed && delta > 0`: "현재 칸 주위에 N개의 지뢰가 있습니다." + `+N`
  - `empty && !alreadyClaimed && delta === 0`: "현재 칸 주위에 지뢰가 없습니다." + `+0`
  - `forced`: "강제 이동이 완료되었습니다." (숫자 미표시)
- **지뢰 밟음 → 다음 방문 규칙**: 지뢰 밟은 칸은 `claimedCells`에 추가되지 않으므로, 이후 누가 다시 방문하면 "첫 방문 empty"로 평가되어 주변 지뢰 수만큼 점수 획득. 그 이후 방문은 `alreadyClaimed` 경로로 흐름. 별도 특수 처리 불필요 (기존 로직이 자연스럽게 충족).

### `EndScreen.tsx`
- 최종 점수, 승자, "새 게임" 버튼.

## 변경/생성 대상 파일

- `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`
- `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`
- `src/game/{types,constants,board,placement,moves,scoring}.ts`
- `src/store/gameStore.ts`
- `src/components/{Board,Cell,SetupPanel,HandoffScreen,PlayPanel,EndScreen,RulesModal}.tsx`
- `src/hooks/useCountdown.ts`
- `src/styles/{global.css, app.module.css, board.module.css}`

## 검증 방법 (end-to-end)

1. `npm install && npm run dev` 후 브라우저에서 `http://localhost:5173`.
2. **배치 검증**:
   - P1 배치 중 **a10, a11, b10, b11** 클릭 시 지뢰가 놓이지 않는지.
   - **j1, j2, k1, k2**도 동일.
   - 보물 칸(**a1, f6, k11**)도 금지.
   - 그 외 칸(예: c9, c11 등)은 정상 배치 가능.
3. **핸드오프**: P1 제출 후 오버레이 표시, 넘어가면 P1 지뢰가 보드에서 사라지는지 확인.
4. **이동/점수**: 일반 칸 이동 시 주변 지뢰 수만큼 점수 증가, 기획득 칸 재이동 시 점수 증가 없음.
5. **지뢰 밟기**: 지뢰 칸 이동 시 -5, 해당 칸 지뢰 모두 제거, FORCED_MOVE 단계에서 자기 출발지 인접 3칸 중 선택해 강제 이동.
6. **보물/종료**: 3개째 보물 획득 시 즉시 ENDED로 전이, 최종 점수로 승자 판정.
7. **빌드 확인**: `npm run build` 성공.
