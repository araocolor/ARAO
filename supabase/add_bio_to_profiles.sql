-- profiles 자기소개 저장용 컬럼 추가
alter table if exists public.profiles
  add column if not exists bio text;
