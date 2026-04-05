# update_stack_mini.md

## Goal
Keep current project and improve real-time UX + perceived speed with minimal process.

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

