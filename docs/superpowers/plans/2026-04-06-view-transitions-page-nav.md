# View Transitions 페이지 전환 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 커뮤니티 리스트 → 본문 → 리스트 전환을 View Transitions API로 교체해 멈칫 현상 제거하고 슬라이드 방향 애니메이션 구현

**Architecture:** `document.startViewTransition()` 으로 `router.push/back`을 감싸 브라우저가 화면 스냅샷을 유지하는 동안 서버 요청을 진행. 방향(forward/backward)을 `sessionStorage`의 `view-transition-direction` 키로 전달해 CSS `::view-transition-old/new` 에서 방향별 슬라이드 적용. 미지원 브라우저는 그냥 라우팅 폴백.

**Tech Stack:** Next.js App Router, React, CSS View Transitions API

---

## 파일 맵

| 파일 | 역할 |
|------|------|
| `components/main-user-review-page.tsx` | `openReview`: isRouteClosing/setTimeout 제거 → startTransition 래퍼 사용 |
| `components/user-content-page.tsx` | `closeWithSlide`: isClosing/setTimeout/isEntered 제거 → startTransition 래퍼 사용 |
| `app/styles/user-review.css` | is-route-closing CSS 제거, ::view-transition-old/new forward/backward 애니메이션 추가 |

---

### Task 1: CSS — View Transition 애니메이션 정의

**Files:**
- Modify: `app/styles/user-review.css`

- [ ] **Step 1: is-route-closing 관련 CSS 제거**

[app/styles/user-review.css](app/styles/user-review.css) 에서 아래 블록 제거:

```css
.user-review-page.is-route-closing {
  pointer-events: none;
  animation: user-review-route-out 0.22s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes user-review-route-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-10%);
    opacity: 0.96;
  }
}

@media (prefers-reduced-motion: reduce) {
  .user-review-page.is-route-closing {
    animation: none;
  }
}
```

그리고 `.user-review-page` 에서 transition/will-change/transform도 제거 (View Transitions가 대신 처리):

```css
/* before */
.user-review-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  transform: translate3d(0, 0, 0);
  opacity: 1;
  transition: transform 0.22s cubic-bezier(0.4, 0, 1, 1), opacity 0.22s cubic-bezier(0.4, 0, 1, 1);
  will-change: transform, opacity;
}

/* after */
.user-review-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
```

- [ ] **Step 2: View Transition 키프레임 + 방향별 규칙 추가**

`app/styles/user-review.css` 파일 끝에 추가:

```css
/* ── View Transitions: 페이지 슬라이드 전환 ── */

@keyframes vt-slide-in-from-right {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

@keyframes vt-slide-out-to-left {
  from { transform: translateX(0); }
  to   { transform: translateX(-30%); }
}

@keyframes vt-slide-in-from-left {
  from { transform: translateX(-30%); }
  to   { transform: translateX(0); }
}

@keyframes vt-slide-out-to-right {
  from { transform: translateX(0); }
  to   { transform: translateX(100%); }
}

/* forward: 리스트 → 본문 */
:root[data-vt-direction="forward"]::view-transition-old(root) {
  animation: vt-slide-out-to-left 0.32s cubic-bezier(0.4, 0, 1, 1) both;
}
:root[data-vt-direction="forward"]::view-transition-new(root) {
  animation: vt-slide-in-from-right 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* backward: 본문 → 리스트 */
:root[data-vt-direction="backward"]::view-transition-old(root) {
  animation: vt-slide-out-to-right 0.32s cubic-bezier(0.4, 0, 1, 1) both;
}
:root[data-vt-direction="backward"]::view-transition-new(root) {
  animation: vt-slide-in-from-left 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

- [ ] **Step 3: user-content-page-shell 기존 슬라이드 CSS 제거**

`app/styles/user-review.css` 에서 아래 블록 제거 (View Transitions가 대신 처리):

```css
.user-content-page-shell:not(.is-entered):not(.is-closing) {
  transform: translateX(100%);
}

.user-content-page-shell.is-entered {
  animation: user-content-slide-in 0.34s cubic-bezier(0.22, 1, 0.36, 1);
}

.user-content-page-shell.is-closing {
  animation: none;
  transform: translateX(100%);
  transition: transform 0.26s cubic-bezier(0.4, 0, 1, 1);
}

@keyframes user-content-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@media (prefers-reduced-motion: reduce) {
  .user-content-page-shell,
  .user-content-page-shell.is-entered,
  .user-content-page-shell.is-closing {
    animation: none;
    transform: none;
    transition: none;
  }
}
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공, CSS 오류 없음

---

### Task 2: main-user-review-page.tsx — openReview 교체

**Files:**
- Modify: `components/main-user-review-page.tsx`

- [ ] **Step 1: isRouteClosing state 및 routeCloseTimerRef 제거**

아래 라인들 제거:

```typescript
const [isRouteClosing, setIsRouteClosing] = useState(false);
// ...
const routeCloseTimerRef = useRef<number | null>(null);
```

cleanup useEffect에서 `routeCloseTimerRef` 관련 코드도 제거:

```typescript
// 제거 대상
useEffect(() => {
  return () => {
    if (routeCloseTimerRef.current !== null) {
      window.clearTimeout(routeCloseTimerRef.current);
    }
  };
}, []);
```

- [ ] **Step 2: isRouteClosing을 참조하는 모든 곳 수정**

`isRouteClosing`을 조건으로 사용하는 곳(총 13곳)을 모두 제거. 패턴:

```typescript
// 제거
if (isRouteClosing) return;
// 제거
if (loading || total <= page * limit || isRouteClosing) return;
// 제거 (조건에서만 isRouteClosing 제거, 나머지 조건 유지)
if (
  currentState.page !== 1 ||
  currentState.sortMode !== "latest" ||
  currentState.query ||
  Date.now() < backgroundApplyResumeAtRef.current   // isRouteClosing 제거
) {
  return;
}
```

의존성 배열에서도 `isRouteClosing` 제거:
```typescript
// before
}, [board, page, query, sortMode, limit, isRouteClosing]);
// after
}, [board, page, query, sortMode, limit]);
```

- [ ] **Step 3: openReview 함수 교체**

```typescript
// before (제거)
const openReview = (id: string) => {
  if (isRouteClosing) return;
  if (!isSignedIn) {
    router.push("/sign-in");
    return;
  }
  setIsRouteClosing(true);
  if (routeCloseTimerRef.current !== null) {
    window.clearTimeout(routeCloseTimerRef.current);
    routeCloseTimerRef.current = null;
  }
  backgroundApplyResumeAtRef.current = Number.POSITIVE_INFINITY;
  const targetPath = `/user_content/${id}?board=${encodeURIComponent(board)}`;
  window.requestAnimationFrame(() => {
    if (id === newItemId) setNewItemId(null);
    saveScroll();
    try {
      sessionStorage.setItem(LIST_STATE_KEY, JSON.stringify({ board, page, sortMode, query: query.trim(), viewMode, ts: Date.now() }));
      sessionStorage.setItem(LIST_RETURN_FLAG_KEY, "1");
    } catch {}
    routeCloseTimerRef.current = window.setTimeout(() => {
      routeCloseTimerRef.current = null;
      router.push(targetPath, { scroll: false });
    }, 220);
  });
  // ...
};

// after (교체)
const openReview = (id: string) => {
  if (!isSignedIn) {
    router.push("/sign-in");
    return;
  }
  if (id === newItemId) setNewItemId(null);
  backgroundApplyResumeAtRef.current = Number.POSITIVE_INFINITY;
  saveScroll();
  try {
    sessionStorage.setItem(
      LIST_STATE_KEY,
      JSON.stringify({ board, page, sortMode, query: query.trim(), viewMode, ts: Date.now() })
    );
    sessionStorage.setItem(LIST_RETURN_FLAG_KEY, "1");
  } catch {}
  const targetPath = `/user_content/${id}?board=${encodeURIComponent(board)}`;
  const navigate = () => router.push(targetPath, { scroll: false });
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    document.documentElement.dataset.vtDirection = "forward";
    const vt = document.startViewTransition(navigate);
    vt.finished.finally(() => {
      delete document.documentElement.dataset.vtDirection;
    });
  } else {
    navigate();
  }
};
```

- [ ] **Step 4: JSX에서 is-route-closing 클래스 제거**

```tsx
// before
<section className={`user-review-page${isRouteClosing ? " is-route-closing" : ""}`}>
// after
<section className="user-review-page">
```

- [ ] **Step 5: 빌드 + TypeScript 확인**

```bash
npm run build
```

Expected: 빌드 성공, 타입 오류 없음

---

### Task 3: user-content-page.tsx — closeWithSlide 교체

**Files:**
- Modify: `components/user-content-page.tsx`

- [ ] **Step 1: isEntered, isClosing state 및 closeTimerRef 제거**

```typescript
// 제거
const [isEntered, setIsEntered] = useState(false);
const [isClosing, setIsClosing] = useState(false);
const closeTimerRef = useRef<number | null>(null);
```

관련 useEffect도 제거:

```typescript
// 제거: isEntered 세팅 useEffect
useEffect(() => {
  const raf = window.requestAnimationFrame(() => {
    setIsEntered(true);
  });
  return () => window.cancelAnimationFrame(raf);
}, []);

// 제거: closeTimerRef cleanup useEffect
useEffect(() => {
  return () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
  };
}, []);
```

- [ ] **Step 2: closeWithSlide 함수 교체**

```typescript
// before (제거)
const closeWithSlide = useCallback(() => {
  if (isClosing) return;
  setIsClosing(true);
  closeTimerRef.current = window.setTimeout(() => {
    if (cameFromNotification) {
      try { sessionStorage.setItem("header-notification-reopen-once", "1"); } catch {}
    }
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    router.push(boardListPath, { scroll: false });
  }, 260);
}, [isClosing, onRequestClose, router, boardListPath, cameFromNotification]);

// after (교체)
const closeWithSlide = useCallback(() => {
  if (cameFromNotification) {
    try { sessionStorage.setItem("header-notification-reopen-once", "1"); } catch {}
  }
  const navigate = () => {
    if (onRequestClose) {
      onRequestClose();
      return;
    }
    router.push(boardListPath, { scroll: false });
  };
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    document.documentElement.dataset.vtDirection = "backward";
    const vt = document.startViewTransition(navigate);
    vt.finished.finally(() => {
      delete document.documentElement.dataset.vtDirection;
    });
  } else {
    navigate();
  }
}, [onRequestClose, router, boardListPath, cameFromNotification]);
```

- [ ] **Step 3: JSX에서 is-entered/is-closing 클래스 제거**

```tsx
// before
<main className={`landing-page user-content-page user-content-page-shell${isEntered ? " is-entered" : ""}${isClosing ? " is-closing" : ""}`}>
// after
<main className="landing-page user-content-page user-content-page-shell">
```

- [ ] **Step 4: 빌드 확인**

```bash
npm run build
```

Expected: 빌드 성공

---

### Task 4: 수동 검증

- [ ] **Step 1: dev 서버 확인 (이미 실행 중)**

```bash
# 이미 실행 중이면 생략
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

- [ ] **Step 2: 리스트 → 본문 전환 확인**

브라우저에서 `/user_review` 접속 → 글 클릭:
- 멈칫 없이 즉시 슬라이드 전환 시작되는지 확인
- 리스트가 왼쪽으로 밀리면서 본문이 오른쪽에서 들어오는지 확인

- [ ] **Step 3: 본문 → 뒤로가기 확인**

본문에서 뒤로가기 버튼 클릭:
- 본문이 오른쪽으로 나가면서 리스트가 왼쪽에서 들어오는지 확인
- 리스트 스크롤 위치가 복원되는지 확인

- [ ] **Step 4: 미지원 브라우저 폴백 확인 (선택)**

브라우저 콘솔에서:
```javascript
// startViewTransition 임시 제거 시뮬레이션
const orig = document.startViewTransition;
delete document.startViewTransition;
// 글 클릭 후 정상 라우팅 되는지 확인
document.startViewTransition = orig;
```

---

## 자기 검토

### 스펙 커버리지
- [x] 리스트 → 본문 슬라이드 전환 (forward): Task 1 Step 2, Task 2 Step 3
- [x] 본문 → 리스트 슬라이드 전환 (backward): Task 1 Step 2, Task 3 Step 2
- [x] setTimeout/isRouteClosing 제거: Task 2 Step 1-2
- [x] isEntered/isClosing 제거: Task 3 Step 1
- [x] 미지원 브라우저 폴백: Task 2 Step 3, Task 3 Step 2
- [x] prefers-reduced-motion: Task 1 Step 2

### 타입 일관성
- `document.startViewTransition` 타입: TypeScript DOM lib 에 포함됨 (tsconfig `lib: ["dom"]`)
- `document.documentElement.dataset.vtDirection`: `string | undefined` — `delete` 로 제거 시 정상
- `vt.finished`: `Promise<void>` — `.finally()` 사용 가능

### 주의사항
- `isRouteClosing`은 일부 useEffect 의존성 배열에도 있음 — Task 2 Step 2에서 모두 제거 필요
- `user-content-page-shell` 클래스는 CSS는 제거하지만 클래스명 자체는 남겨도 무방 (다른 스타일에 사용 가능)
