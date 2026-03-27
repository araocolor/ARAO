# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. See **frontend.md**, **backend.md**, and **share.md** for detailed specifications.

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
- User profile management
- Admin content/pricing editing
- 1:1 consultation system (create, reply, track status)
- Real-time notification badges (60s polling)
- Gallery with EXIF metadata

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
- `profiles` — User accounts (Clerk sync)
- `inquiries` — Consultations (type, status, content)
- `inquiry_replies` — Admin responses
- `landing_contents` — Editable content
- Commerce tables (stubs)

**Inquiry Status:** `pending` (red) → `in_progress` → `resolved` (blue) → `closed`

## Styling & Layout

- **Approach:** CSS-first with custom styles in `app/globals.css` (500+ lines)
- **Mobile-first:** Baseline design targets mobile phones
- **Responsive:** Scales to tablet (1024px max-width)
- **No desktop layout:** Desktop uses same responsive design as tablet
- **Breakpoint:** `1024px` separates mobile/tablet from desktop considerations
- **Consultation badges:** `.consulting-status-*` classes with color codes (red=pending, blue=resolved, gray=closed)

## Key Components

**Frontend:** `consulting-section`, `admin-dashboard`, `gallery-hero-item`, headers/footers
**Backend:** API routes for consulting, notifications, landing content
**Hooks:** `use-notification-count`, `use-admin-pending-count` (60s polling)

## Documentation

| File | Contains |
|------|----------|
| **claude.md** | This overview |
| **frontend.md** | Components, styling, client patterns |
| **backend.md** | APIs, database, server patterns |
| **share.md** | Routing, auth, workflows, deployment, preferences |
| **README.md** | Full project details |
| **START_CHECKLIST.md** | Completed/pending tasks |

## Before You Start

1. **Setup:** Copy `.env.example` to `.env.local` and fill in Supabase/Clerk credentials
2. **Documentation:** Read **share.md** for auth/preferences, then **frontend.md** or **backend.md** based on task
3. **Development:** Run `npm run dev` (starts on localhost:3000 or 3001)
4. **Verify:** Test locally before committing

## Pre-Push Checklist

Before committing/pushing changes:
1. **Build test:** `npm run build` (catches TypeScript/build errors)
2. **Lint check:** `npm run lint`
3. **Manual test:** Verify changes in dev server
4. **Permission:** User preference — **always request approval before committing**

## Common Gotchas

| Issue | Solution |
|-------|----------|
| "Type is not assignable to Promise" | Next.js 16: must `await params` in dynamic routes |
| Cache corruption in dev | Delete `.next/` folder and restart `npm run dev` |
| Port 3000 in use | Dev server auto-uses 3001; check `package.json` scripts |
| RLS policy errors | Check Supabase Row-Level Security policies match auth checks |
