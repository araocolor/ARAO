-- colors 테이블에 creator_icon(작가 사진 URL) 컬럼 추가
alter table if exists public.colors
  add column if not exists creator_icon text;
