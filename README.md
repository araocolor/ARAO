# Arao — Next.js Expansion Architecture

정적 랜딩을 확장형 서비스 구조로 전환한 풀스택 프로젝트입니다.

## 배포

- **Production:** https://arao-test-7gxt.vercel.app
- **GitHub:** https://github.com/araocolor/arao_test
- **플랫폼:** Vercel (GitHub 연동 자동 배포)

## 기술 스택

| 역할 | 기술 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 인증 | Clerk |
| 데이터베이스 | Supabase (PostgreSQL) |
| 파일 저장 | Supabase Storage |
| 국내 결제 | PortOne (스텁 상태) |
| 글로벌 결제 | Stripe (스텁 상태) |
| 배포 | Vercel |

## 페이지 구조

### 랜딩 (공개)
- `/` — 홈 (Hero, Before/After, 리뷰, 가격)
- `/arao` — 소개 페이지
- `/gallery` — 갤러리
- `/pricing` — 가격 안내
- `/manual` — 사용 가이드

### 인증
- `/sign-in` — Clerk 로그인
- `/sign-up` — Clerk 회원가입

### 사용자 (로그인 필요)
- `/account` — 프로필 설정 (아이디·연락처·비밀번호 수정)
- `/account/withdraw` — 회원탈퇴 (UI만, 미연결)

### 관리자 (role = admin 필요)
- `/admin` — 관리자 대시보드
  - 콘텐츠 관리 (랜딩 텍스트·이미지 수정 → Supabase 저장)
  - 상품가격 관리 (pricing 페이지 내용 수정)
  - 회원·주문·매출·인증 관리 (UI 스텁, 미연결)

## API Routes

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/health` | GET | 서버 상태 확인 |
| `/api/admin/landing-content` | GET, PUT | 랜딩 콘텐츠 조회/저장 (admin only) |
| `/api/account/general` | POST | 사용자 정보 수정 (username, phone, password) |

## Supabase 테이블

```
profiles         — 사용자 프로필 (Clerk 연동, role 기반 권한)
products         — 상품
orders           — 주문
order_items      — 주문 상세
payments         — 결제
landing_contents — 랜딩 페이지 콘텐츠 (id = 'main')
```

Supabase Storage 버킷: `landing-assets` (Before/After 이미지)

## 환경변수

`.env.example` 참고. 실제 값은 `.env.local`(로컬) 또는 Vercel 환경변수에 설정.

```
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
PORTONE_API_SECRET
PORTONE_STORE_ID
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

## 관리자 계정 설정 방법

Supabase → profiles 테이블에서 해당 계정의 `role` 값을 `admin`으로 변경.

## 현재 미연결 항목

- PortOne 실결제
- Stripe 실결제
- 주문/매출 관리 UI
- 회원탈퇴 처리 로직
- 주문·상담·후기 데이터 연결
