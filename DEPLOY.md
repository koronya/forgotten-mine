# 배포 가이드 (Deploy)

이 문서는 `forgotten-mine` 을 **GitHub Pages** 와 **Synology NAS Web Station** 두 경로로 공개 배포하는 절차를 정리한 가이드입니다. 앱은 Vite + React 로 만든 **순수 클라이언트 SPA** 라서 백엔드 없이 정적 호스팅만으로 플레이 가능합니다.

---

## 0. 공통 준비

### 0-1. 빌드
```bash
npm install
npm run build
```
결과물은 `dist/` 폴더에 정적 파일(HTML/CSS/JS) 로 생성됩니다.

### 0-2. 모드별 `base` (vite.config.ts)
GitHub Pages 는 `https://<user>.github.io/forgotten-mine/` 처럼 **서브 경로**에서 서빙하므로 asset base 를 `/forgotten-mine/` 로 맞춰야 합니다. 반면 NAS Web Station 의 포트 기반 포털은 루트(`/`) 에서 서빙되므로 상대 경로(`./`) 가 맞습니다. 이를 위해 **빌드 모드에 따라 base 를 분기**해 두었습니다.

```ts
// vite.config.ts
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === 'gh-pages' ? '/forgotten-mine/' : './',
}))
```

그리고 `package.json` 에 두 스크립트가 있습니다.
- `npm run build` → `base: './'` (NAS / 로컬 preview 용)
- `npm run build:gh-pages` → `base: '/forgotten-mine/'` (GitHub Pages 용)

> 📝 저장소 이름을 바꾸면 `vite.config.ts` 의 `/forgotten-mine/` 부분도 같은 이름으로 수정하세요.

### 0-3. `public/.nojekyll`
GitHub Pages 는 기본적으로 Jekyll 로 사이트를 렌더링하면서 `_`로 시작하는 파일/폴더를 무시합니다. Vite 는 해시가 들어간 `assets/` 만 생성하지만, 안전을 위해 `public/.nojekyll` 빈 파일을 두어 Jekyll 파싱을 비활성화합니다. `public/` 은 빌드 시 그대로 `dist/` 로 복사됩니다.

### 0-4. 로컬 미리보기
```bash
npm run preview
```
기본 포트 `http://localhost:4173/` 에서 빌드된 결과를 확인할 수 있습니다. 실제 배포 전에 `dist/index.html` 내부의 asset 경로가 `./assets/...` 로 시작하는지 확인하세요.

---

## 1. GitHub Pages 배포

### 1-1. 저장소 생성 (아직 없을 때)
GitHub 웹 UI에서 **New repository → 이름 `forgotten-mine` (Public)** 로 생성하거나, [GitHub CLI](https://cli.github.com/) 로:

```bash
gh repo create forgotten-mine --public --source=. --remote=origin --push
```

웹 UI 로 만들었다면 아래 명령으로 원격을 연결하고 푸시:

```bash
git remote add origin https://github.com/<YOUR_GITHUB_ID>/forgotten-mine.git
git branch -M main
git push -u origin main
```

### 1-2. GitHub Actions 워크플로우
`.github/workflows/deploy.yml` 이 이미 포함되어 있습니다. `main` 브랜치에 push 될 때마다 자동으로:

1. Node 20 설치 → `npm ci` → `npm run build:gh-pages` (`base: '/forgotten-mine/'` 로 빌드)
2. `dist/` 를 Pages 아티팩트로 업로드
3. `actions/deploy-pages@v4` 로 Pages 환경에 배포

수동 실행도 가능합니다 (Actions 탭 → `Deploy to GitHub Pages` → **Run workflow**).

### 1-3. Pages 설정
1. GitHub 저장소 → **Settings → Pages**
2. **Build and deployment → Source** 를 `GitHub Actions` 로 선택
   (`Deploy from a branch` 가 아니라 반드시 **GitHub Actions** 여야 합니다.)
3. 최초 push 후 Actions 가 성공하면 `https://<YOUR_GITHUB_ID>.github.io/forgotten-mine/` 에서 접속 가능합니다.

### 1-4. 업데이트 워크플로우
- 코드를 수정 → 커밋 → `git push origin main`
- Actions 가 자동 배포. 약 1–2분 뒤 새 버전이 라이브.

---

## 2. Synology NAS (Web Station) 배포

### 2-0. 사전 조건: QuickConnect 활성화
외부에서 별도 도메인/포트포워딩 없이 접속하려면 QuickConnect 가 켜져 있어야 합니다.
**DSM → 제어판 → 외부 액세스 → QuickConnect** 탭에서 활성화 및 QuickConnect ID 설정을 확인하세요.

### 2-1. Web Station 설치
**패키지 센터 → "Web Station" 검색 → 설치**. 설치 시 `Apache`, `Nginx` 등 백엔드 서버도 함께 설치 여부를 묻는데, 정적 파일만 서빙하므로 **Nginx** 하나면 충분합니다.

### 2-2. 웹 서비스 (Web Service) 생성
1. Web Station → **웹 서비스 → 생성 → 정적 웹사이트 (Static Website)**
2. 이름: 예) `forgotten-mine`
3. 문서 루트(Document Root):
   - File Station 에서 `web` 공유 폴더 아래에 `forgotten-mine` 폴더를 미리 만들고 (`/web/forgotten-mine`) 이 경로를 지정합니다.
   - DSM 버전에 따라 `/volume1/web/forgotten-mine` 형태로 표시될 수도 있습니다.
4. 스크립트 언어: **없음 (None)**.

### 2-3. 웹 포털 (Web Portal) 생성
1. Web Station → **웹 포털 → 생성**
2. 서비스: 방금 만든 `forgotten-mine` 선택
3. 포털 타입: 가장 단순한 **포트 기반 (Port-based)** 추천. 예) `8080`.
   - 이름 기반 가상 호스트를 쓰려면 NAS 에 연결된 도메인이 필요합니다.
4. 저장.

### 2-4. `dist` 업로드
1. 로컬에서 `npm run build`
2. File Station 을 열어 `/web/forgotten-mine/` 로 이동
3. `dist/` 안의 **내용물 전체** (`index.html`, `assets/`, `.nojekyll` 포함) 를 **폴더 자체가 아니라 내부 파일들**을 업로드
   - 즉 `/web/forgotten-mine/index.html` 이 되도록 업로드합니다.

### 2-5. 접속 확인
- LAN: `http://<NAS내부IP>:8080/`
- 외부: `https://<YOUR_QUICKCONNECT_ID>.quickconnect.to:8080/`
  - QuickConnect 는 포털 포트를 그대로 노출하므로, 포트가 방화벽에 막혀 있지 않은지 확인하세요.
  - 필요 시 DSM → 제어판 → 보안 → 방화벽 에서 해당 포트를 허용합니다.

### 2-6. 업데이트 워크플로우
- 로컬에서 `npm run build` 재실행
- `dist/` 내용물을 다시 `/web/forgotten-mine/` 에 덮어쓰기 업로드
- 브라우저 캐시 이슈가 있으면 Ctrl+F5 로 강제 새로고침

---

## 3. 트러블슈팅

| 증상 | 원인 / 해결 |
| --- | --- |
| 배포 후 페이지 흰 화면, 콘솔에 asset 404 | GitHub Pages 라면 `/forgotten-mine/` base 로 빌드(`npm run build:gh-pages`) 한 결과가 올라갔는지, NAS 라면 `./` base 로 빌드(`npm run build`) 한 결과인지 확인. 저장소 이름과 `vite.config.ts` 의 GH Pages base 값이 일치해야 함. |
| GitHub Actions 실패: `Permission denied` | Settings → Pages 의 Source 가 `GitHub Actions` 인지 확인. 워크플로우 `permissions:` 블록에 `pages: write`, `id-token: write` 가 있는지 확인. |
| Pages 는 200 인데 assets 404 (경로에 `_`) | `public/.nojekyll` 누락. 파일이 `dist/.nojekyll` 로 복사되었는지 확인. |
| NAS 포털 접속 시 "연결 실패" | Web Station → 포털 목록에서 상태 확인. 방화벽(Control Panel → Security → Firewall) 에서 해당 포트 허용. |
| NAS 에서 `index.html` 다운로드됨 | Web Station 의 웹 서비스 타입이 "정적 웹사이트" 로 설정되어 있는지 확인. |

---

## 4. 참고 — 앱 특성

- 서버/DB 없음, **브라우저 로컬 상태로만** 게임 진행 (zustand).
- 라우팅 없음 → SPA fallback 설정이 필요하지 않음.
- 빌드 산출물 크기: 약 160KB (gzip ≈ 53KB). 정적 호스팅에 부담 없음.
