# Start Checklist

`test_codex`를 VS Code에서 새 작업 폴더로 연 뒤, 아래 순서대로 진행합니다.

## 1. 작업 폴더 확인

- [ ] VS Code에서 `test_codex` 폴더를 새로 열었다
- [ ] 현재 작업 기준이 정적 랜딩 폴더가 아니라 `test_codex`인지 확인했다

## 2. 패키지 설치

- [ ] 터미널 위치가 `test_codex`인지 확인
- [ ] `npm install` 실행
- [ ] 설치 에러가 없는지 확인

## 3. 환경변수 준비

- [ ] `.env.example` 파일 확인
- [ ] `.env.local` 파일 생성
- [ ] 아래 키 이름들을 먼저 맞춰 넣기

필수 키 목록:

- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- [ ] `CLERK_SECRET_KEY`
- [ ] `PORTONE_API_SECRET`
- [ ] `PORTONE_STORE_ID`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`

## 4. 개발 서버 확인

- [ ] `npm run dev` 실행
- [ ] 브라우저에서 로컬 페이지 확인
- [ ] 기본 홈 화면이 뜨는지 확인
- [ ] `/admin` 경로 진입 확인
- [ ] `/api/health` 응답 확인

## 5. Supabase 준비

- [ ] Supabase 프로젝트 생성
- [ ] 프로젝트 URL / anon key / service role key 확보
- [ ] `.env.local`에 반영
- [ ] `supabase/schema.sql` 내용 확인
- [ ] Supabase SQL Editor에서 스키마 생성 준비

추천 순서:

1. `profiles`
2. `products`
3. `orders`
4. `order_items`
5. `payments`

## 6. Clerk 준비

- [ ] Clerk 프로젝트 생성
- [ ] Publishable key / Secret key 확보
- [ ] `.env.local`에 반영
- [ ] 로그인 화면(`/sign-in`) 동작 확인
- [ ] 로그인 전 `/admin` 접근 시 로그인 페이지로 이동하는지 확인

## 7. 인증/권한 기본 설계

- [ ] 사용자 역할 구분 방식 결정
- [ ] 최소 역할 정의

추천 역할:

- [ ] `admin`
- [ ] `manager`
- [ ] `customer`

- [ ] Clerk 사용자와 Supabase `profiles` 연결 방식 정리

## 8. 결제 전략 정리

- [ ] 한국 결제: `PortOne`
- [ ] 글로벌 결제: `Stripe`
- [ ] 국가/통화 기준 분기 규칙 정의

예시:

- [ ] 한국 사용자 + KRW 중심 → PortOne
- [ ] 해외 사용자 + USD 중심 → Stripe

## 9. 첫 구현 우선순위

- [ ] 로그인
- [ ] 사용자 프로필 저장
- [ ] 관리자 보호 라우트
- [ ] 상품 테이블
- [ ] 주문 생성
- [ ] 결제 요청
- [ ] 결제 완료 후 주문 상태 업데이트

## 10. 운영 전 체크

- [ ] 에러 페이지 전략 정리
- [ ] 로그 수집 방식 정리
- [ ] 결제 실패/취소 처리 정의
- [ ] 주문 상태값 정의
- [ ] 환불 처리 흐름 정의

## 권장 다음 작업

우선순위는 아래 순서가 가장 안전합니다.

1. Clerk 로그인 실제 연결
2. Supabase 연결 확인
3. `profiles` 생성 및 사용자 동기화
4. `/admin` 보호
5. 상품 / 주문 구조 연결
6. PortOne 테스트 결제
7. Stripe 테스트 결제

## 메모

- 현재 `test_codex`는 참고용 스캐폴드입니다.
- 아직 실제 의존성 설치나 외부 서비스 연결은 하지 않은 상태입니다.
- 본격 개발은 이 체크리스트를 기준으로 하나씩 연결하면서 진행하면 됩니다.
