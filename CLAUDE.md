# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

보드게임 "망각의 지뢰"를 React + TypeScript + Vite로 구현한 **로컬 2인 핫시트 웹게임**. 서버/DB 없이 브라우저 로컬 상태(zustand)만으로 동작하는 순수 클라이언트 SPA. 한 기기를 번갈아 쓰는 방식이라 `HANDOFF_*` phase에서 이전 플레이어의 지뢰 배치가 화면에서 사라져야 한다는 점이 UI의 핵심 제약.

## 자주 쓰는 명령어

```bash
npm run dev              # 개발 서버 (http://localhost:5173)
npm run build            # NAS/로컬 preview용 빌드 (base: './')
npm run build:gh-pages   # GitHub Pages용 빌드 (base: '/forgotten-mine/')
npm run preview          # 빌드 결과 로컬 확인 (http://localhost:4173)
npm run lint             # tsc --noEmit 타입 체크
```

테스트 러너는 아직 구성되어 있지 않다 (PLAN.md에 Vitest가 선택사항으로 언급됨).

## 아키텍처 핵심

### 레이어 분리

- `src/game/` — **React 의존성 0인 순수 도메인 로직.** `types.ts`, `constants.ts`, `board.ts`(좌표 ↔ `a1`~`k11` 변환), `placement.ts`(지뢰 배치 검증), `moves.ts`(8방 이동/강제이동 후보), `scoring.ts`(이동 결과 해석). 여기에 React/zustand를 섞지 말 것.
- `src/store/gameStore.ts` — zustand 스토어. phase 전이와 모든 액션이 여기 모여 있음. 게임 규칙 변경은 `src/game/`에서, phase 흐름 변경은 여기서.
- `src/components/` — UI만. 규칙 판정은 store와 game 레이어에 위임.

### Phase 기계

```
NAME_ENTRY → SETUP_P1 → HANDOFF_TO_P2 → SETUP_P2 → HANDOFF_TO_PLAY → PLAYING ⇄ FORCED_MOVE → ENDED
```

- `NAME_ENTRY`에서 양 플레이어 이름을 입력받아 `names: { p1, p2 }` 스토어에 저장. 빈 입력은 `PLAYER_LABEL` 기본값으로 치환. 이후 모든 UI 텍스트(스코어 뱃지, Setup/Play/End/Handoff)에서는 `names[player] || PLAYER_LABEL[player]` 패턴으로 표시.
- `resetGame`은 이름을 보존한 채 `NAME_ENTRY`로 돌아가 재대결 시 재입력 부담을 줄인다.

- `PLAYING`에서 셀 클릭은 **즉시 이동하지 않고** `pendingMove`에 설정 → `PlayPanel`의 예/아니오 버튼으로 `confirmPendingMove()` / `cancelPendingMove()`. 오클릭 방어용이므로 이 2단계 확정 흐름을 건너뛰지 말 것.
- `FORCED_MOVE`도 같은 pending/confirm 흐름을 탄다.

### 보드 좌표와 상수

- 내부 표현은 `{row: 0..10, col: 0..10}`, 표시용은 `a..k × 1..11` (row 0 = `a`, col 0 = `1`). 변환은 반드시 `board.ts`의 `toId`/`fromId` 사용.
- `constants.ts`에 `BOARD_SIZE=11`, `MINE_COUNT=15`, `TREASURES`(a1/f6/k11), `STARTS`(P1=a11, P2=k1), `TREASURE_SCORES=[10,15,20]`, `MINE_PENALTY=-5`, `SETUP_SECONDS=600`.
- 지뢰 배치 금지 구역은 **체비쇼프 거리 ≤ 1** (시작점 포함 2×2) + 보물 칸 3개. 규칙 수정 시 `placement.ts`에서 이 두 조건을 함께 유지.

### 이동 결과 평가 순서 (`scoring.ts`)

이 순서가 규칙이다 — 바꾸지 말 것:
1. 대상이 보물 → `TREASURE_SCORES[treasuresTaken.length]` 획득, 3개 모두 모이면 `ENDED`.
2. 대상에 양 플레이어 지뢰 합계 ≥ 1 → -5, 해당 칸의 지뢰 전부 제거, `FORCED_MOVE` 진입.
3. 빈 칸 → `claimedCells`에 없을 때만 주변 8칸 지뢰 수(중복 포함)만큼 득점, `claimedCells`에 추가.

지뢰 밟은 칸은 `claimedCells`에 추가되지 않으므로 "이후 재방문 시 첫 방문 empty로 평가"되는 동작이 자연스럽게 성립한다. 이 특성을 깨뜨리는 변경은 규칙 위반.

### UI 불변식 (중요)

- **본 게임 중 보드에는 방문 이력/득점 숫자를 일절 표시하지 않는다.** `claimedCells`는 store에서 점수 계산 용도로만 유지되고 Cell에 렌더하지 않는다. 이 게임은 암기가 핵심이라 UI에 힌트를 남기면 규칙 자체가 깨진다.
- 배치 중(`SETUP_*`)에만 **자기** 지뢰가 보이고, `HANDOFF_*` 이후로는 사라져야 한다.
- `PlayPanel`은 최신 `MoveEvent` 하나만 "이번 이동 결과"로 보여준다. 누적 이동 로그는 UI에 노출하지 않는다 (`moveLog`는 최신 이벤트 참조용으로만 store에 유지).
- 지뢰가 설치된 칸 수는 공개한다(규칙). 양 플레이어 지뢰 Set 합집합 크기로 계산.

## 관련 문서

- **`RULES.md`** — 게임 규칙의 **단일 출처(SSOT)**. 보드 크기·지뢰 개수·점수·금지 구역·이동/강제이동·공개 정보 등. 규칙 관련 작업을 할 때는 항상 먼저 이 파일을 확인할 것. 규칙이 바뀌면 RULES.md → `src/game/constants.ts` 및 관련 로직 순으로 동기화.
- **`PLAN.md`** — 초기 설계 스냅샷. 아키텍처/레이어/파일 구조 배경. 규칙 수치는 여기 남아 있더라도 RULES.md 가 우선.
- **`DEPLOY.md`** — GitHub Pages / NAS Web Station 배포 절차.

## 배포

`main` push 시 `.github/workflows/deploy.yml`이 `npm run build:gh-pages`로 GitHub Pages에 자동 배포. NAS(Web Station)는 `npm run build` 결과(`dist/`)를 수동 업로드. 저장소 이름을 바꾸면 `vite.config.ts`의 `/forgotten-mine/` 값도 함께 수정해야 한다.
