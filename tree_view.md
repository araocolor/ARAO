# 프로젝트 파일 트리 (변경 후)

## 공개 페이지

```
app/
├── page.tsx                     # 홈
├── about/page.tsx               # ARAO 소개 (기존 /arao)
├── gallery/
│   ├── page.tsx                 # 갤러리 목록
│   └── [category]/page.tsx      # 갤러리 상세 (신규)
├── color/
│   ├── page.tsx                 # 컬러 목록
│   ├── write/page.tsx           # 컬러 등록
│   └── [id]/
│       ├── page.tsx             # 컬러 상세
│       └── order/               # 결제 플로우
│           ├── page.tsx
│           ├── success/page.tsx
│           ├── cancel/page.tsx
│           └── fail/page.tsx
├── pricing/page.tsx
├── manual/page.tsx
└── usercolor/[profileId]/page.tsx
```

## 커뮤니티

```
app/
├── user_review/page.tsx         # 커뮤니티 목록
├── user_content/[id]/page.tsx   # 커뮤니티 상세
└── write_review/page.tsx        # 글 작성
```

## 계정

```
app/account/
├── layout.tsx
├── page.tsx
├── general/page.tsx
├── userpage/page.tsx
├── orders/ (page.tsx, [id]/page.tsx)
├── reviews/ (page.tsx, [id]/page.tsx, write/page.tsx)
├── consulting/page.tsx
├── mycolor/page.tsx
├── withdraw/page.tsx
├── test/page.tsx
└── test_order/page.tsx
```

## 관리자 (변경됨)

```
app/admin/
├── page.tsx                     # 대시보드
├── work-list/page.tsx
├── sales/page.tsx               # 이동됨
├── orders/page.tsx              # 이동됨
└── article/page.tsx             # 이동됨
```

## 인증/기타

```
app/
├── sign-in/[[...sign-in]]/page.tsx
├── sign-up/[[...sign-up]]/page.tsx
├── settings/page.tsx
└── lucide/page.tsx
```

## API

```
app/api/
├── account/    (avatar, consulting, general, notifications, orders, reviews, test-order)
├── admin/      (consulting, landing-content, work-logs)
├── color/      ([id], [id]/order/*, upload)
├── gallery/    ([category]/[index]/*, batch, comments)
├── main/user-review/  (목록, [id], comments, likes, views, upload, batch-interactions)
└── health/
```

## 이번 세션 변경 요약

| 변경 | 내용 |
|---|---|
| 2단계 | `/sales`, `/orders`, `/article` → `/admin/*` 이동 |
| 5단계 | `/gallery/[category]` 상세 페이지 신설 |
| 6단계 | `/arao` → `/about` 이동 |
| 3·4단계 | 건너뛰기 (효과 대비 비용 큼) |
