-- colors 테이블에 creator(제작자) 컬럼 추가
alter table if exists public.colors
  add column if not exists creator text;
