# update_stack_mini.md

## 사용자 필수 규칙 반드시!!!

답변은 전문기술용어 사용금지, 페이지파일표시금지
홈페이지 방문자 입장에서 이해할수 있게 쉽게설명 
함수이름을 설명할때는 사용자가이해할수 있는 이름으로 설명


## Goal
Keep current project and improve real-time UX + perceived speed with minimal process.
- Top priority: preserve smooth loading/transition and strong real-time feedback; no new feature should degrade these.

## As-Is
- Next.js + React + TypeScript
- Clerk auth
- Supabase DB/API
- Local/session cache logic per feature

## To-Be (Add/Change)
- Add `TanStack Query` for server-state
- Add `Zustand` for UI global state
- Standardize optimistic update + rollback
- Standardize realtime sync for badge/count/list/detail

## Priority Phases
1. Base
- Introduce Query client and query key rules
- Remove cache conflicts

2. Instant Interaction
- Like/comment-like: optimistic update + rollback
- Sync list/detail counts

3. Notification Realtime
- Unify badge update path (event + realtime + fallback polling)

4. Chat (Optional)
- Realtime chat + unread/read sync

## Required Verification (Every Change)
1. Replay core user flow end-to-end
2. Confirm UI reflects latest code
3. If mismatch, restart dev server and verify again

## Change Log
| Date | Change | Status | Verification | Note |
|---|---|---|---|---|
| YYYY-MM-DD | Example change | applied/partial/hold | pass/fail | short note |
