# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. See **frontend.md**, **backend.md**, and **share.md** for detailed specifications.

> **레이아웃 수정 요청 시** → **LAYOUT_MAP.md** 를 먼저 참조. 구역명(헤더, 히어로, 계정 > 하단탭 등)으로 파일과 클래스를 즉시 찾을 수 있음.

## Quick Start

```bash
npm install                    # Install dependencies
cp .env.example .env.local     # Copy environment template
# Edit .env.local with Supabase and Clerk credentials
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Check code quality
```

**Available ports:** Dev uses port 3000 (or 3001 if 3000 is in use)

## Project Overview

**Arao** is a Next.js expansion architecture converting a static landing site into a full-stack service platform with user authentication, admin content management, and consultation/inquiry system with notifications.

- **Framework:** Next.js 16 (App Router)
- **Auth:** Clerk (session-based, 1-hour expiration)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (`landing-assets` bucket)
- **Payments:** PortOne, Stripe (currently stubs)
- **Deployment:** Vercel (auto-deploy from GitHub)
- **Language:** TypeScript
- **Status:** Production (https://arao-test-7gxt.vercel.app)

## Core Concepts

### Client-Server Architecture
- **Server Components:** Data fetching, auth checks, admin operations
- **Client Components:** Interactive UI with state management
- **API Routes:** Bridge for client operations requiring auth/permissions
- **Import alias:** `@/` maps to project root (use `@/components`, `@/lib`, `@/hooks`)

### Authentication & Protected Routes
- Users log in via Clerk (`/sign-in`, `/sign-up`)
- `syncProfile()` auto-creates Supabase profiles on first login
- **Middleware** (`middleware.ts`) enforces auth via `clerkMiddleware()`:
  - `/admin/*` — Admin only (requires `profiles.role = 'admin'`)
  - `/account/*` — Authenticated users only
  - `/article/*` — Admin only
  - All other routes are public

### Critical: Next.js 16 Dynamic Routes
Dynamic routes now require awaiting `params` (it's a Promise). TypeScript won't catch missed awaits:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // ← Must await!
  // Rest of logic
}
```
See **backend.md** for API route patterns.

### Key Features
- User profile management with custom avatar upload
- Admin content/pricing editing
- 1:1 consultation system (create, reply, track status)
- Order system (list, detail, status tracking)
- Unified notification system (6 types: settings, orders, consulting, reviews, gallery)
- Reviews board with replies and likes
- Gallery with comments, likes, and EXIF metadata
- Real-time notification badges (60s polling)

## Project Structure

```
app/              # Next.js App Router
├── api/          # API routes
├── admin/        # Admin pages
├── account/      # User pages
└── ...           # Public pages

components/       # React components
lib/              # Utilities (supabase, consulting, profiles)
hooks/            # React hooks (notification polling)
app/globals.css   # Global styles (500+ lines)
```

## Database Overview

**Core Tables:**
- `profiles` — User accounts (Clerk sync, includes `icon_image` bytea, `role`, `created_at`)
- `inquiries` — Consultations (type, status, content)
- `inquiry_replies` — Admin responses
- `landing_contents` — Editable content
- `orders` — User orders (user_id, status, total_amount)
- `payments` — Order payments (order_id, provider, amount)
- `products` — Product catalog
- `product_options` — Product variants (soft/bw/std)

**Notification System Tables:**
- `notifications` — Aggregated alerts (orders, reviews, gallery, etc)
- `reviews` — User reviews with categories
- `review_likes` — Review likes tracking
- `review_replies` — Replies to reviews
- `gallery_comments` — Comments on gallery items
- `gallery_comment_likes` — Likes on gallery comments
- `gallery_item_likes` — Likes on gallery images

**Inquiry Status:** `pending` (red) → `in_progress` → `resolved` (blue) → `closed`

**Order Status:** `결제완료` (blue) → `환불진행중` (yellow) → `환불완료` (purple) → `결제오류` (red)

**Notification Types:** `settings` | `order_shipped` | `order_cancelled` | `consulting` | `review_reply` | `gallery_like`

**See DATABASE_SCHEMA.md** for complete database structure.

## Styling & Layout

- **Approach:** CSS-first with custom styles in `app/globals.css` (500+ lines)
- **Mobile-first:** Baseline design targets mobile phones
- **Widths:** Mobile `480px`, Tablet `820px` (`--tablet-width`), media query at `1024px`
- **No desktop layout:** Desktop uses same responsive design as tablet
- **Consultation badges:** `.consulting-status-*` classes with color codes (red=pending, blue=resolved, gray=closed)
- **Layout reference:** See **LAYOUT_MAP.md** for zone name → CSS class → file mapping

## Documentation

| File | Contains |
|------|----------|
| **claude.md** | This overview |
| **frontend.md** | Components, styling, client patterns |
| **backend.md** | APIs, database, server patterns |
| **share.md** | Routing, auth, workflows, deployment, preferences |
| **DATABASE_SCHEMA.md** | Complete database structure (all tables) |
| **WORK_SUMMARY_20260327.md** | Order system implementation summary |
| **README.md** | Full project details |
| **START_CHECKLIST.md** | Completed/pending tasks |

## Before You Start

1. **Setup:** Copy `.env.example` to `.env.local` and fill in Supabase/Clerk credentials
2. **Documentation:** Read **share.md** for auth/preferences, then **frontend.md** or **backend.md** based on task
3. **Development:** Run `npm run dev` (starts on localhost:3000 or 3001)
4. **Verify:** Test locally before committing

## Commit Convention

- **Commit message pattern:** When user says "XXX로 올려", use "XXX" as the commit message verbatim
- **Permission required:** Always request user approval before committing or pushing
- **Format:** `git commit -m "message" -m "Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"`

## Pre-Push Checklist

Before committing/pushing changes:
1. **Build test:** `npm run build` (catches TypeScript/build errors)
2. **Lint check:** `npm run lint`
3. **Manual test:** Verify changes in dev server

## Language

User communicates in **Korean**. Respond in Korean when addressed in Korean. Grammar note: "~게" = user will do it, "~려" = command to assistant.

## Common Gotchas

| Issue | Solution |
|-------|----------|
| "Type is not assignable to Promise" | Next.js 16: must `await params` in dynamic routes |
| Cache corruption in dev | Delete `.next/` folder and restart `npm run dev` |
| Port 3000 in use | Dev server auto-uses 3001; check `package.json` scripts |
| RLS policy errors | Check Supabase Row-Level Security policies match auth checks |
| Notification table not found | Run DB migration: `alter table profiles add column if not exists icon_image bytea` |
| Avatar upload fails | Ensure `icon_image` bytea column exists on profiles table |
| Notification count mismatch | Items must be loaded on mount, not on drawer open (HeaderProfileLink.tsx) |
| Invalid date in join date | formatDate function handles null/invalid dates (returns "날짜 오류") |
