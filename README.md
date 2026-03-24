# Expansion Architecture Backup

이 폴더는 현재 정적 랜딩 프로젝트를 나중에 확장형 서비스 구조로 옮길 때 참고할 수 있도록 만든 백업 스캐폴드입니다.

## 목표 스택

- `Next.js`
- `Vercel`
- `Supabase`
- `Clerk`
- `PortOne`
- `Stripe`

## 용도

- 회원관리
- 인증관리
- 주문관리
- 결제
- 매출관리
- 관리자 페이지 확장
- 글로벌 시장 대응

## 현재 포함된 내용

- Next.js 기본 폴더 구조
- Supabase 클라이언트/서버 유틸
- Clerk 기반 레이아웃 예시
- PortOne / Stripe 결제 모듈 스텁
- 환경변수 예시
- Supabase용 기본 테이블 스키마 예시

## 주의

- 이 폴더는 백업/참고용 구조입니다.
- 아직 의존성을 설치하지 않았습니다.
- 현재 정적 프로젝트와는 별개입니다.

## 시작 순서

1. 이 폴더로 이동
2. 패키지 설치
3. `.env.example`를 복사해 `.env.local` 작성
4. Supabase 프로젝트 생성
5. Clerk 프로젝트 생성
6. PortOne / Stripe 키 연결
7. 페이지와 비즈니스 로직 확장
