# Start Checklist

현재까지 완료된 항목과 앞으로 할 작업을 정리한 체크리스트입니다.

---

## 완료된 항목

### 환경 설정
- [x] `npm install` 완료
- [x] `.env.local` 작성 완료
- [x] Vercel 환경변수 입력 완료

### 인증 (Clerk)
- [x] Clerk 프로젝트 생성 및 키 연결
- [x] `ClerkProvider` 루트 레이아웃 적용
- [x] `/sign-in`, `/sign-up` 페이지 구성
- [x] 로그인 전 `/admin` 접근 시 로그인 페이지로 이동
- [x] 로그인 사용자 헤더에 이메일/로그아웃 버튼 표시

### 데이터베이스 (Supabase)
- [x] Supabase 프로젝트 생성 및 키 연결
- [x] `profiles`, `products`, `orders`, `order_items`, `payments` 테이블 생성
- [x] `landing_contents` 테이블 생성
- [x] Supabase Storage 버킷 `landing-assets` 생성
- [x] Clerk 로그인 시 `profiles` 자동 동기화
- [x] `profiles.role = admin` 기준 관리자 접근 제어

### 랜딩 페이지
- [x] 홈(`/`), 소개(`/arao`), 갤러리(`/gallery`), 가격(`/pricing`), 매뉴얼(`/manual`) 구성
- [x] 공통 랜딩 헤더/푸터 컴포넌트 분리
- [x] 모바일 햄버거 메뉴 적용

### 관리자 페이지 (`/admin`)
- [x] 좌측 사이드바 + 우측 콘텐츠 레이아웃
- [x] 콘텐츠 관리 (Hero, Before/After, 리뷰, 푸터 → Supabase 저장)
- [x] 이미지 업로드 → Supabase Storage 연결
- [x] 상품가격 관리 (pricing 페이지 내용 수정)

### 사용자 계정 (`/account`)
- [x] 사용자 아이디(username) 등록
- [x] 연락처(phone) 등록/수정
- [x] 비밀번호 설정/수정 (scrypt 해시)
- [x] 회원탈퇴 페이지 (UI만, 로직 미연결)

### 배포
- [x] GitHub 레포 생성 및 push (`araocolor/arao_test`)
- [x] Vercel 배포 완료 (https://arao-test-7gxt.vercel.app)
- [x] Vercel 커스텀 도메인 추가 가능 상태

---

## 앞으로 할 작업

### 우선순위 높음
- [ ] `landing_contents` 테이블 SQL 실제 실행 확인
- [ ] Supabase Storage public URL 반영 최종 점검
- [ ] `schema.sql` 중복 컬럼 선언 정리 (`alter table` 중복 제거)

### 결제 연결
- [ ] PortOne 테스트 결제 연결
- [ ] Stripe 테스트 결제 연결
- [ ] 국가/통화 기준 분기 규칙 정의 (KRW → PortOne, USD → Stripe)
- [ ] 결제 완료 후 주문 상태 업데이트 로직
- [ ] 결제 실패/취소 처리 정의
- [ ] 환불 처리 흐름 정의

### 관리자 페이지 확장
- [ ] 회원 관리 UI (Clerk 사용자 조회, role 변경)
- [ ] 주문 관리 UI (주문 목록, 상태 변경)
- [ ] 매출 관리 UI (집계, 기간별 리포트)
- [ ] 인증 관리 UI

### 사용자 기능 확장
- [ ] 회원탈퇴 실제 처리 로직 (데이터 보존 정책 결정 후)
- [ ] 주문내역 페이지 연결
- [ ] 상담내역 페이지 연결
- [ ] 후기 작성/관리 연결

### 운영 준비
- [ ] 운영용 Clerk 프로젝트/키로 전환 (현재 test 키)
- [ ] 에러 페이지 전략 (`not-found.tsx`, `error.tsx`)
- [ ] 로그 수집 방식 정리
- [ ] 주문 상태값 정의 (pending / paid / cancelled / refunded)

---

## 주요 파일 위치

| 파일 | 역할 |
|------|------|
| `app/page.tsx` | 랜딩 홈 |
| `app/admin/page.tsx` | 관리자 페이지 |
| `app/account/page.tsx` | 사용자 계정 |
| `lib/landing-content.ts` | 랜딩 콘텐츠 조회/저장 |
| `lib/profiles.ts` | Clerk-Supabase 프로필 동기화 |
| `lib/password.ts` | 비밀번호 해시 |
| `supabase/schema.sql` | DB 스키마 |
| `components/admin-dashboard.tsx` | 관리자 대시보드 |
| `components/user-dashboard.tsx` | 사용자 계정 대시보드 |
