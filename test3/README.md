# Landing Page Notes

이 문서는 현재 프로젝트 상태를 빠르게 파악하고, 나중에 수정할 때 참고할 수 있도록 정리한 메모입니다.

## 프로젝트 개요

- 정적 HTML/CSS/JS 기반 랜딩페이지 프로젝트
- 메인 페이지: `index.html`
- 관리자 페이지: `manage.html`
- 공통 데이터 저장: `localStorage`
- 공통 헤더 컴포넌트: `header.js`
- 공통 콘텐츠 데이터: `content.js`
- 확장형 아키텍처 백업: `test_codex/`

## 현재 구현된 기능

### 1. 랜딩페이지

- iOS 스타일의 심플한 모바일 랜딩 UI
- 밝은 회색 배경 `#f5f5f7`
- Hero / Before-After / 리뷰 / 푸터 섹션 구성
- `before.jpg`, `after.jpg` 실제 이미지 연결
- 태블릿 구간까지 반응형 유지
- 데스크톱 전용 확장은 제거하고 태블릿 레이아웃까지만 유지

### 2. 헤더

- `header.js`에서 공통 헤더를 생성
- 로고는 `logo.svg` 사용
- 랜딩페이지 메뉴:
  - 소개
  - 갤러리
  - 가격
  - 도움말
- 헤더는 스크롤 시 상단 고정
- 헤더 배경은 전체 폭
- 로고 시작점과 메뉴 끝점은 본문 컨테이너 폭에 맞춤
- 헤더 하단 선은 제거된 상태

### 3. 관리자 페이지

- `manage.html`에서 접근
- 임시 로그인 방식 사용
- 아이디: `admin`
- 비밀번호: `admin`
- 로그인 후 랜딩페이지 텍스트 수정 가능
- Before / After 이미지 업로드 가능
- 저장 시 `localStorage`에 반영
- 랜딩페이지와 동일한 태블릿 기준 폭으로 정렬

## 파일 역할 정리

### `index.html`

- 메인 랜딩페이지 진입 파일
- `content.js`, `header.js`, `main.js`를 불러옴

### `manage.html`

- 관리자 페이지 진입 파일
- `content.js`, `header.js`, `manage.js`를 불러옴

### `main.js`

- 랜딩페이지 UI 렌더링 담당
- `content.js`의 저장 데이터를 읽어서 각 섹션 생성
- 현재 섹션 앵커:
  - `#intro`
  - `#gallery`
  - `#pricing`
  - `#help`

### `manage.js`

- 관리자 로그인 처리
- 각 섹션 텍스트 편집 폼 생성
- Before / After 이미지 업로드 처리
- 저장 / 초기화 / 로그아웃 처리

### `content.js`

- 기본 랜딩 데이터 보관
- `localStorage` 읽기/쓰기 담당
- 인증 상태 저장도 여기서 처리

주요 키:

- 콘텐츠 저장 키: `landing-page-content-v1`
- 로그인 상태 키: `landing-page-manage-auth`

### `header.js`

- 공통 헤더 생성 함수 `createSiteHeader()` 제공
- 로고 + 메뉴 구조 생성
- 랜딩과 관리자 페이지에서 공통 사용

### `main.css`

- 전체 스타일 파일
- 랜딩 / 헤더 / 관리자 페이지 스타일 모두 포함
- 반응형 기준과 컨테이너 정렬 규칙 포함

## 이미지 관련

- 기본 비교 이미지:
  - `images/before.jpg`
  - `images/after.jpg`
- 관리자 페이지에서 업로드한 이미지는 파일 자체를 덮어쓰지 않고 `localStorage`에 Data URL 형태로 저장

주의:

- 브라우저 저장소를 지우면 관리자에서 저장한 내용도 함께 초기화됨

## 반응형 기준

- 모바일 우선 구조
- 모바일 기본 폭: `var(--max-width)` = `480px`
- 태블릿 기준 폭: `var(--tablet-width)` = `820px`
- 현재는 데스크톱 전용 별도 확장 없이 태블릿 레이아웃 유지

## 헤더 관련 메모

- 헤더 배경은 화면 전체 폭으로 펼쳐짐
- 헤더 내부 정렬은 본문 컨테이너와 동일
- 현재 `position: sticky`로 상단 고정
- 섹션 이동 시 헤더에 가려지지 않도록 `scroll-padding-top`, `scroll-margin-top` 적용

## 자주 수정할 포인트

### 메뉴 이름 또는 링크 변경

- 파일: `main.js`
- 헤더 메뉴 배열 수정

### 로고 변경

- 파일: `logo.svg`
- 필요 시 `header.js`의 `logoSrc` 경로 확인

### 랜딩 기본 문구 변경

- 파일: `content.js`
- `DEFAULT_CONTENT` 수정

### 관리자 로그인 방식 변경

- 현재: `manage.js` + `content.js`의 간단한 `localStorage` 인증
- 나중에 Firebase 이메일 인증으로 변경 가능
- 교체 시 주로 바꿀 부분:
  - `manage.js` 로그인 처리
  - `content.js` 인증 상태 저장 로직

### 디자인 수정

- 파일: `main.css`
- 헤더, 섹션 간격, 반응형 폭, 관리자 페이지 정렬 모두 여기서 조정

## 나중에 확장하기 좋은 항목

- Firebase Authentication 연동
- Firestore 또는 Realtime Database에 랜딩 데이터 저장
- 리뷰 카드 추가/삭제 기능
- 가격 섹션 별도 신설
- 메뉴 모바일 햄버거 전환
- 업로드 이미지 서버 저장 방식으로 변경

## 빠른 확인 방법

### 랜딩페이지

- `index.html` 열기

### 관리자 페이지

- `manage.html` 열기
- 로그인: `admin / admin`

## 참고

현재 프로젝트는 빌드 도구 없이 바로 열어서 확인하는 단순 정적 구조입니다.  
즉, 작은 수정은 `main.js`, `manage.js`, `content.js`, `main.css` 중심으로 바로 작업하면 됩니다.

## 확장형 백업 메모

향후 회원관리, 결제, 주문관리, 매출관리까지 확장하기 위한 별도 백업 구조를 아래 폴더에 추가했습니다.

- `test_codex/`

이 백업 폴더는 다음 방향을 기준으로 작성되어 있습니다.

- `Next.js`
- `Supabase`
- `Clerk`
- `PortOne`
- `Stripe`

현재 정적 프로젝트는 그대로 유지하고, 나중에 서비스형 구조로 넘어갈 때 이 폴더를 참고해서 이전하는 방식으로 사용하면 됩니다.
