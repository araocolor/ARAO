# 회원탈퇴 작업 인계서 (Part 2 - 댓글 작성자 표시)

## 작업 배경

회원탈퇴 기능 1차 구현 완료(커밋 `4944a93`). 남은 작업은 탈퇴 회원이 작성한 댓글에서 작성자명을 익명 처리하는 것.

## 1차에서 완료된 것

- DB: `profiles`에 `deleted_at`, `delete_scheduled_at`, `previous_username` 컬럼 추가됨
- DB: `account_delete_codes` 테이블(인증번호 임시 저장) 생성됨
- API:
  - `POST /api/account/delete/send-code` — 6자리 코드 메일 발송 (Resend)
  - `POST /api/account/delete/confirm` — 코드 검증 + Supabase 익명화 + Clerk 사용자 삭제 + 본인 게시글(`colors`, `user_reviews`, `reviews`) 즉시 삭제
  - `POST /api/account/delete/restore` — 7일 이내 복구
  - `GET /api/cron/account-purge` — 7일 후 영구 삭제 (Vercel Cron `0 3 * * *`)
- UI:
  - `components/account-delete-modal.tsx` — 슬라이드 모달
  - `components/account-deleted-view.tsx` — 탈퇴 진행 중 사용자 화면
  - `app/account/layout.tsx` — `profile.deleted_at` 감지 시 자동으로 deleted-view 노출
  - 일반 페이지 하단에 회원탈퇴 섹션 추가됨
- 메일: `lib/mail/send-delete-code.ts` (Resend SDK)
- 환경변수: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 사용 (`.env.local` 입력 완료)
- 도메인: arao.kr Resend 등록 완료, DNS 검증 진행 중 (가비아). 검증 완료 시 `RESEND_FROM_EMAIL`을 `noreply@arao.kr`로 변경 예정

## 사양 결정 사항 (사용자 승인 완료)

| 항목 | 결정 |
|------|------|
| 본인 확인 | Resend 메일로 6자리 인증번호 |
| 유예 기간 | 7일 |
| 게시글 처리 | 본인 작성 게시글(`colors`, `user_reviews`, `reviews`) 탈퇴 즉시 삭제 |
| 좋아요 | 그대로 둠 (삭제하지 않음) |
| 댓글 | 그대로 두되 작성자명 익명 표시 ← **이 작업** |
| 주문/상담 | 1년간 보관 |
| 7일 이내 재가입 시도 | 자연 차단 (이메일 UNIQUE + 기존 deleted profile로 syncProfile됨) → deleted-view에서 복구 가능 |
| 7일 후 영구 삭제 | profiles 행 자체 삭제 (cron) |
| 탈퇴 시 username 처리 | `previous_username`으로 이동, `username`은 NULL |
| 7일 후 같은 username 재사용 | 재사용 불가 (정책 수립됨, 실제 검증 로직은 Part 2 범위 밖이지만 필요시 함께 추가 가능) |

## Part 2 작업 사양

### 목표

탈퇴한 회원이 작성한 댓글이 일반 사용자에게 노출될 때:
- 아바타 자리: 사람 아이콘(`UserRound` 또는 유사 lucide 아이콘)
- 아이디 표시: 기존 username 그대로 유지하되 **회색**으로 표시
- 작성자 영역 클릭 시: "탈퇴회원입니다" 안내 (모달 또는 토스트)
- 일반 프로필 모달은 열리지 않게 분기

### 분할 — Part 2를 3개로 나눔

#### 파트 A — 공통 인프라 (가장 큼)

1. **API 응답에 `author_deleted` 필드 노출**
   - 댓글 조회 API들에서 `profile:profile_id(...)` 조인할 때 `deleted_at`을 함께 select
   - 응답 매핑 시 `author_deleted: profile?.deleted_at !== null` 형태로 boolean 추가

   **수정 대상 API (확인된 것):**
   - `app/api/main/user-review/[id]/comments/route.ts`
   - `app/api/main/user-review/batch-interactions/route.ts`
   - `lib/gallery-interactions.ts` (gallery_comments 조회 부분)
   - `lib/reviews.ts` (review_replies 조회 부분)

   **각 파일에서 select 문에 `deleted_at` 추가 + 응답 맵에 `author_deleted` 추가**

2. **공통 컴포넌트 신규 작성**
   - `components/comment-author.tsx`
     - props: `username`, `iconImage`, `tier`, `isDeleted`, `onClickProfile?`
     - `isDeleted=true`이면 사람 아이콘 + 회색 username + 클릭 시 안내 모달
     - `isDeleted=false`이면 기존 아바타 + username + 프로필 모달 트리거

   - `components/deleted-user-notice-modal.tsx`
     - 단순 안내 모달: "탈퇴회원입니다."
     - 닫기 버튼

3. **타입 정의**
   - 댓글 타입에 `author_deleted?: boolean` 또는 `authorDeleted?: boolean` 필드 추가
   - 어느 명명 규칙(snake/camel) 쓸지는 기존 응답 형식 따라가기

#### 파트 B — 갤러리 댓글 적용

수정 대상 컴포넌트 (확인된 것):
- `components/gallery-comment-sheet.tsx`
- 갤러리 댓글이 표시되는 다른 곳 (검색 필요)

작업: 기존 작성자 표시 부분을 `<CommentAuthor ... />` 로 교체

#### 파트 C — 사용자 리뷰 / 리뷰 댓글 적용

수정 대상 컴포넌트 (확인 필요):
- `components/user-content-page.tsx`, `components/user-content-interactions.tsx`
- 리뷰 페이지 댓글
- review_replies 표시되는 곳

작업: 동일하게 교체

## 핵심 참고 정보

### Profile 타입 (`lib/profiles.ts`)
```ts
export type Profile = {
  id: string;
  email: string;
  role: string;
  tier: string;
  notification_enabled: boolean;
  full_name: string | null;
  phone: string | null;
  username: string | null;
  password_hash: string | null;
  icon_image: string | null;
  created_at: string;
  username_registered_at: string | null;
  username_change_count: number;
  deleted_at: string | null;          // ← 1차에서 추가됨
  delete_scheduled_at: string | null; // ← 1차에서 추가됨
  previous_username: string | null;   // ← 1차에서 추가됨
};
```

`PROFILE_SELECT_COLUMNS`에 위 3개 컬럼 이미 포함됨.

### TierBadge 컴포넌트
- `components/tier-badge.tsx` — `tier === "pro" || "premium"`일 때만 뱃지 노출
- 탈퇴 회원은 tier 무관하게 뱃지 숨겨야 함 (`isDeleted=true`이면 TierBadge 자체를 안 그림)

### 사람 아이콘
- 기존 코드에서 `UserRound` from "lucide-react" 사용 중
- `general-settings-form.tsx`에서 빈 아바타에 같은 아이콘 사용

### 작성자명 회색 처리
- `color: var(--muted)` 또는 `color: #9ca3af` 정도

## 1차 작업에서 추가된 파일/디렉토리

```
app/api/account/delete/
  send-code/route.ts
  confirm/route.ts
  restore/route.ts
app/api/cron/account-purge/route.ts
components/account-delete-modal.tsx
components/account-deleted-view.tsx
lib/mail/send-delete-code.ts
vercel.json
```

## 도메인 검증 상태 (참고)

- arao.kr 도메인 Resend 등록 후 가비아에서 DNS 입력 진행 중
- 검증 완료 전에는 `araocolor@gmail.com`으로만 메일 발송 가능
- `araocolor@gmail.com`은 관리자 메일이므로 절대 탈퇴 테스트 금지
- 검증 완료 후 새 테스트 계정 생성하여 검증 권장

## 새 세션 시작 시 권장 흐름

1. 이 문서를 처음 읽는다고 사용자에게 보고
2. **파트 A부터 시작 권장** (인프라 먼저 깔끔히)
3. 파트 A 완료 후 파트 B, C는 같은 패턴 반복이라 빠름
4. 작업 후 타입 체크: `npx tsc --noEmit`
5. 커밋은 사용자 명시 요청 시에만

## 사용자 협업 규칙 (메모리 기반 — 새 세션에서 자동 적용됨)

- 작업 전 승인 필수 (모든 작업은 설명 → 승인 → 실행)
- 30초 이상 연속 작업 시 보고 후 대기
- 토큰 90% 초과 시 작업 중단
- 자동 커밋 금지, 사용자 명시 요청 시만
- 답변은 5줄 이내, 표 사용 금지(이 인계서는 예외 — 정리 목적), 영어 파일명/기술 영어 최소화
- 음슴체 금지

## 메모리 위치

`/Users/chalres/.claude/projects/-Users-chalres-Projects-test-codex/memory/MEMORY.md` 자동 로드되므로 새 세션에서도 위 규칙 그대로 적용됨.
