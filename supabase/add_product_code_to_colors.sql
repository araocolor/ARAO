-- colors 테이블에 상품코드 컬럼 추가
-- 실행 후 갤러리/상세에서 상품코드 기반 연결에 사용할 수 있습니다.
alter table if exists public.colors
  add column if not exists product_code text;

create unique index if not exists colors_product_code_key
  on public.colors (product_code)
  where product_code is not null;
