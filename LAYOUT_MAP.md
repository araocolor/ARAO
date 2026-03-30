# LAYOUT_MAP.md

레이아웃 수정 요청 시 사용하는 **구역 선언 용어 → 파일/클래스 매핑** 문서.
사용자가 구역명으로 요청하면 Claude는 이 문서를 기준으로 즉시 해당 파일을 참조한다.

---

## 사용 방법

> "**[구역명]** 을 수정해주세요"

예시:
- "헤더 > 로고 위치를 왼쪽으로"
- "히어로 > 제목 폰트 크기 키워주세요"
- "계정 > 하단탭 아이콘 색상 변경"

---

## 구역 선언 용어 목록

### 1. 헤더 (모든 페이지 공통)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 헤더 | `.header` `.header-full` `.header-inner` | `app/styles/header.css` |
| 헤더 > 로고 | `.brand` | `app/styles/header.css` / `components/site-header.tsx` |
| 헤더 > 메뉴링크 | `.nav` `.nav a` | `app/styles/header.css` / `components/landing-page-header.tsx` |
| 헤더 > 프로필아이콘 | `.header-profile-link` `.header-profile-avatar` | `app/styles/header.css` / `components/header-profile-link.tsx` |
| 헤더 > 알림배지 | `.header-profile-badge` | `app/styles/header.css` |
| 헤더 > 햄버거버튼 | `.header-menu-toggle` | `app/styles/header.css` / `components/site-header.tsx` |
| 헤더 > 팝업메뉴 | `.header-menu-sheet` `.header-menu-list` `.header-menu-link` | `app/styles/header.css` (미디어쿼리 내) |
| 헤더 > 팝업메뉴 > 구분선 | `.header-menu-divider` | `app/styles/header.css` |
| 헤더 > 팝업메뉴 > 타이틀 | `.header-menu-label` | `app/styles/header.css` |
| 헤더 > 로그인버튼 | `components/header-logout-button.tsx` | `components/header-logout-button.tsx` |

**참조 파일:**
- `components/site-header.tsx` — 헤더 구조 전체
- `components/landing-page-header.tsx` — 메뉴 링크 목록, 메뉴명

---

### 2. 랜딩 페이지 (홈 `/`)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 랜딩 > 전체컨테이너 | `.landing-page` `.landing-shell` | `app/styles/landing.css` |
| 랜딩 > 히어로 | `.landing-hero` | `app/styles/landing.css` / `app/page.tsx` |
| 랜딩 > 히어로 > 제목 | `.landing-hero-title` | `app/styles/landing.css` |
| 랜딩 > 히어로 > 본문 | `.landing-hero-body` | `app/styles/landing.css` |
| 랜딩 > 히어로 > 버튼 | `.landing-button` `.landing-button-primary` | `app/styles/landing.css` |
| 랜딩 > 섹션라벨 | `.landing-section-label` | `app/styles/landing.css` |
| 랜딩 > 비교섹션 | `.landing-comparison` `.landing-comparison-item` | `app/styles/landing.css` |
| 랜딩 > 리뷰섹션 | `.landing-reviews` `.landing-card` `.landing-card-review` | `app/styles/landing.css` |
| 랜딩 > 비디오 | `.landing-video-wrap` `.landing-video-thumb` `.landing-video-play` | `app/styles/landing.css` |
| 랜딩 > 기능그리드 | `.landing-feature-grid` `.landing-feature-card` | `app/styles/landing.css` |

**참조 파일:**
- `app/page.tsx` — 홈 페이지 콘텐츠 전체

---

### 3. 갤러리 페이지 (`/gallery`)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 갤러리 > 히어로이미지 | `.gallery-hero-image-wrap` `.gallery-hero-image` | `app/styles/gallery.css` |
| 갤러리 > 섹션 | `.gallery-section` `.gallery-section-title` | `app/styles/gallery.css` |
| 갤러리 > 이미지블록 | `.gallery-image-block` `.gallery-caption` | `app/styles/gallery.css` |
| 갤러리 > 그리드 | `.landing-gallery-grid` | `app/styles/landing.css` (미디어쿼리) |
| 갤러리 > 인터랙션바 | `.gallery-action-bar` `.gallery-action-btn` `.gallery-like-label` | `app/styles/gallery.css` |
| 갤러리 > 댓글시트 | `.gallery-sheet-*` `.gallery-comment-*` | `app/styles/gallery.css` |

**참조 파일:**
- `app/gallery/page.tsx`
- `components/gallery-hero-item.tsx`

---

### 4. 가격 페이지 (`/pricing`)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 가격 > 그리드 | `.pricing-grid` | `app/styles/landing.css` |
| 가격 > 카드 | `.pricing-card` `.pricing-card-featured` | `app/styles/landing.css` |
| 가격 > 금액표시 | `.pricing-price` `.pricing-price-row` | `app/styles/landing.css` |
| 가격 > 기능목록 | `.pricing-feature-list` `.pricing-feature-item` | `app/styles/landing.css` |

**참조 파일:**
- `app/pricing/page.tsx`

---

### 5. 푸터 (공개 페이지 공통)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 푸터 | `.landing-footer` | `app/styles/landing.css` |
| 푸터 > 로고 | `.landing-footer-brand` | `app/styles/landing.css` |
| 푸터 > 소셜링크 | `.landing-footer-socials` `.landing-footer-social` | `app/styles/landing.css` |
| 푸터 > 링크목록 | `.landing-footer-links` `.landing-footer-link` | `app/styles/landing.css` |
| 푸터 > 회사정보 | `.landing-footer-company` `.landing-footer-text` | `app/styles/landing.css` |

**참조 파일:**
- `components/landing-page-footer.tsx`

---

### 6. 계정 페이지 (`/account/*`)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 계정 > 전체레이아웃 | `.account-page` `.account-content` | `app/styles/account.css` / `app/account/layout.tsx` |
| 계정 > 하단탭 | `.account-footer-nav` `.account-footer-menu` `.account-footer-item` | `app/styles/account.css` |
| 계정 > 하단탭 > 아이콘 | `.account-menu-icon` `.account-menu-icon-*` | `app/styles/account.css` |
| 계정 > 하단탭 > 라벨 | `.account-footer-label` | `app/styles/account.css` |
| 계정 > 설정행 | `.account-settings` `.account-settings-row` | `app/styles/account.css` |
| 계정 > 아바타 | `.account-avatar-column` `.account-username-avatar` | `components/general-settings-form.tsx` |
| 계정 > 아이디섹션 | `.account-username-section` `.account-username-info` | `components/general-settings-form.tsx` |
| 계정 > 비밀번호섹션 | `.account-password-line` `.account-password-input-wrap` | `app/styles/account.css` |
| 계정 > 인라인폼 | `.account-inline-form` `.account-inline-row` | `app/styles/account.css` |

**참조 파일:**
- `app/account/layout.tsx` — 계정 레이아웃
- `app/account/general/page.tsx` — 일반설정
- `components/general-settings-form.tsx` — 아바타/아이디/비밀번호 폼
- `components/account-nav-links.tsx` — 하단탭 메뉴 데이터

---

### 7. 알림 드로어

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 알림드로어 | `.notif-drawer` `.notif-backdrop` | `app/styles/notification.css` / `components/notification-drawer.tsx` |
| 알림드로어 > 헤더 | `.notif-header` `.notif-header-username` | `app/styles/notification.css` |
| 알림드로어 > 아이템 | `.notif-item` `.notif-item.is-unread` | `app/styles/notification.css` |

**참조 파일:**
- `components/notification-drawer.tsx`

---

### 8. 관리자 페이지 (`/admin`, `/article`)

| 구역명 | CSS 클래스 | 파일 |
|--------|-----------|------|
| 관리자 > 레이아웃 | `.admin-layout` `.admin-layout-root` | `app/styles/admin.css` |
| 관리자 > 사이드바 | `.admin-sidebar` `.admin-sidebar-root` | `app/styles/admin.css` |
| 관리자 > 패널 | `.admin-panel` `.admin-panel-card` | `app/styles/admin.css` |
| 관리자 > 메뉴 | `.admin-menu-list` `.admin-menu-item` | `app/styles/admin.css` |
| 상담내역 (사용자) | `.consulting-*` | `app/styles/consulting.css` |
| 상담내역 (관리자) | `.admin-consulting-*` | `app/styles/consulting.css` |

**참조 파일:**
- `components/admin-dashboard.tsx`

---

## 글로벌 유틸리티 클래스

| 구역명 | CSS 클래스 | 설명 |
|--------|-----------|------|
| 섹션박스 | `.section` | 흰색 배경 박스 |
| 세로스택 | `.stack` | 세로 flex, gap 16px |
| 보조텍스트 | `.muted` | 회색 보조 텍스트 |
| 페이지컨테이너 | `.page` | 최대 너비 컨테이너 |

---

## 브레이크포인트

| 구분 | 값 | 적용 |
|------|-----|------|
| 모바일 기준 | 480px | `.landing-page`, `.header-inner` |
| 태블릿 | 820px | `--tablet-width` |
| 미디어쿼리 | 1024px | `@media (min-width: 1024px)` |
