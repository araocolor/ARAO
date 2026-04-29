# CLAUDE.md

## 스킬 규칙 (최우선)
- `using-superpowers` 스킬 사용 금지
- 플레이라이트  사용시 허락요청



## 메모리 규칙 (최우선)

모든 답변 전에 `/Users/chalres/.claude/projects/-Users-chalres-Projects-test-codex/memory/MEMORY.md`의 메모리 규칙을 먼저 읽고 적용할 것. 사용자가 별도로 언급하지 않아도 항상 적용.



This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. See **frontend.md**, **backend.md**, and **share.md** for detailed specifications.
Also follow **AGENTS.md** for shared agent workflow and verification rules.

## Quick Start

```bash
npm install                    # Install dependencies
cp .env.example .env.local     # Copy environment template
npm run dev                    # Start dev server (localhost:3000)
npm run build                  # Build for production
npm run start                  # Start production server
```


## 사용자에게 메세지 전달규치 

영어 파일명/기술 영어/표 금지, 쉬운 설명으로 5줄 이내
사용자 친화적 설명: 기술 용어 없이 결과 중심으로


> **레이아웃 수정 요청 시 반드시 아래 순서를 따를 것 (생략 금지):**
> 1. **LAYOUT_MAP.md** 를 먼저 참조하여 해당 구역의 파일과 클래스를 확인
> 2. **부모 요소부터 자식 요소까지 전체 구조를 파악**하고 이미 적용된 스타일 확인
> 3. 확인한 내용을 사용자에게 먼저 보고한 후 수정 진행


## Project Overview

**Arao** — Next.js 15.5.15 (App Router) + TypeScript + Clerk + Supabase (PostgreSQL + Realtime + Storage) + Vercel 배포

Import alias: `@/` → project root

## Authentication & Protected Routes

- Clerk 로그인 → `syncProfile()`로 Supabase profiles 자동 생성
- **보호 경로:** `/admin/*` (role=admin), `/account/*` (인증), `/article/*` (admin), 나머지 공개

## Critical: Next.js 15.5.15 Dynamic Routes

`params`는 반드시 `await` 필요. TypeScript가 잡지 못함:
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // Must await!
}
```


## Styling & Layout

- **CSS-first:** 도메인별 파일 분리 (`app/styles/`), `app/layout.tsx`에서 순서대로 임포트
- **Mobile-first:** 기본값(쿼리 없음)이 모바일, `@media (min-width: 820px)` 단일 분기로 태블릿+데스크탑 공통 적용
- **브레이크포인트 단일:** `820px` 하나만 사용. 480/600/768/1024px 등 다른 값 추가 금지
- **컨테이너:** 태블릿+ 구간에서 `max-width: 820px`, `margin: 0 auto` 고정폭. 데스크탑도 동일
- **데스크톱 없음:** 1024px 이상도 820px 고정폭 안에서 표시, 별도 분기 없음
- **헤더/푸터/댓글시트:** 위 정책 동일하게 상속, 별도 분기점 사용 금지
- **Layout reference:** See **LAYOUT_MAP.md**

## Documentation

| File | Contains |
|------|----------|
| **frontend.md** | Components, styling, client patterns |
| **backend.md** | APIs, database, server patterns |
| **share.md** | Routing, auth, workflows, deployment, preferences |
| **DATABASE_SCHEMA.md** | Complete database structure |
| **LAYOUT_MAP.md** | 구역명 → CSS 클래스 → 파일 매핑 |
| **CACHE_IMPROVEMENTS.md** | 캐싱 전략 개선 계획 (심각도별 체크리스트) |


## Commit Convention

- **"XXX로 올려"** → commit message를 "XXX" 그대로 사용
- **커밋/푸시는 사용자가 명시적으로 요청할 때만.** 절대 작업후 스스로 판단 하지 않는다.
- Format: 각 AI는 본인의 명칭과 이메일을 'Co-Authored-By' 필드에 작성하여 커밋할 것.

## Pre-Push Checklist

1. `npm run build` — 최소 게이트 (`npm run lint`는 현재 Next.js 15.5.15 환경에서 실패함)
2. Dev 서버에서 수동 확인 사용자에게 물어볼것.

