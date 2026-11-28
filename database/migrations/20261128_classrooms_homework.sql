-- Wordlearn teacher accounts, classrooms and homework
-- Apply this migration in the WorkBuddy cloud database SQL console before enabling the 班级作业 UI.
-- Same model as study groups: tables are locked down, every operation goes through SECURITY DEFINER RPCs
-- that check auth.uid() and the caller's role in the classroom.

create table if not exists public.teacher_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 20),
  school text not null default '' check (char_length(school) <= 40),
  created_at timestamptz not null default now()
);

create table if not exists public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 30),
  grade smallint not null check (grade between 1 and 6),
  invite_code text not null unique,
  teacher_id uuid not null references public.teacher_profiles(user_id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists classrooms_teacher_idx on public.classrooms(teacher_id, created_at desc);

create table if not exists public.classroom_students (
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  joined_at timestamptz not null default now(),
  primary key (classroom_id, user_id)
);

create index if not exists classroom_students_user_idx on public.classroom_students(user_id, joined_at desc);

create table if not exists public.homework (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 40),
  subject text not null check (subject in ('en','math','chinese','other')),
  content text not null default '' check (char_length(content) <= 500),
  due_on date,
  created_at timestamptz not null default now()
);

create index if not exists homework_classroom_idx on public.homework(classroom_id, created_at desc);

create table if not exists public.homework_submissions (
  homework_id uuid not null references public.homework(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  note text not null default '' check (char_length(note) <= 200),
  submitted_at timestamptz not null default now(),
  primary key (homework_id, user_id)
);

alter table public.teacher_profiles enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_students enable row level security;
alter table public.homework enable row level security;
alter table public.homework_submissions enable row level security;

revoke all on public.teacher_profiles from anon, authenticated;
revoke all on public.classrooms from anon, authenticated;
revoke all on public.classroom_students from anon, authenticated;
revoke all on public.homework from anon, authenticated;
revoke all on public.homework_submissions from anon, authenticated;

-- ---------- 老师身份 ----------

create or replace function public.get_my_teacher_profile()
returns table(display_name text, school text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select t.display_name, t.school, t.created_at
  from public.teacher_profiles t
  where t.user_id = auth.uid();
$$;

create or replace function public.register_teacher(p_display_name text, p_school text)
returns table(display_name text, school text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_name text := btrim(coalesce(p_display_name, ''));
  v_school text := btrim(coalesce(p_school, ''));
begin
  if v_user is null then raise exception '请先登录后再开通老师身份'; end if;
  if char_length(v_name) < 1 or char_length(v_name) > 20 then raise exception '老师称呼需要为 1 至 20 个字符'; end if;
  if char_length(v_school) > 40 then raise exception '学校名称最多 40 个字符'; end if;

  insert into public.teacher_profiles(user_id, display_name, school)
  values (v_user, v_name, v_school)
  on conflict (user_id) do update set display_name = excluded.display_name, school = excluded.school;

  return query select v_name, v_school;
end;
$$;

-- ---------- 老师：班级管理 ----------

create or replace function public.create_classroom(p_name text, p_grade integer)
returns table(classroom_id uuid, classroom_name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_code text;
  v_name text := btrim(coalesce(p_name, ''));
begin
  if v_user is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.teacher_profiles t where t.user_id = v_user) then
    raise exception '请先开通老师身份';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 30 then raise exception '班级名称需要为 2 至 30 个字符'; end if;
  if p_grade < 1 or p_grade > 6 then raise exception '年级请选择一至六年级'; end if;
  if (select count(*) from public.classrooms c where c.teacher_id = v_user) >= 10 then
    raise exception '每位老师最多创建 10 个班级';
  end if;

  loop
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.classrooms c where c.invite_code = v_code);
  end loop;

  insert into public.classrooms(name, grade, invite_code, teacher_id)
  values (v_name, p_grade, v_code, v_user)
  returning id into v_id;

  return query select v_id, v_name, v_code;
end;
$$;

create or replace function public.list_teacher_classrooms()
returns table(classroom_id uuid, classroom_name text, grade smallint, invite_code text,
              student_count bigint, homework_count bigint, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name, c.grade, c.invite_code,
         (select count(*) from public.classroom_students s where s.classroom_id = c.id),
         (select count(*) from public.homework h where h.classroom_id = c.id),
         c.created_at
  from public.classrooms c
  where c.teacher_id = auth.uid()
  order by c.created_at desc;
$$;

create or replace function public.delete_classroom(p_classroom_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = auth.uid()) then
    raise exception '只有班级老师可以解散班级';
  end if;
  delete from public.classrooms where id = p_classroom_id;
end;
$$;

create or replace function public.list_classroom_students(p_classroom_id uuid)
returns table(nickname text, joined_at timestamptz, done_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = auth.uid()) then
    raise exception '只有班级老师可以查看学生名单';
  end if;
  return query
    select s.nickname, s.joined_at,
           (select count(*) from public.homework_submissions hs
              join public.homework h on h.id = hs.homework_id
             where h.classroom_id = p_classroom_id and hs.user_id = s.user_id)
    from public.classroom_students s
    where s.classroom_id = p_classroom_id
    order by s.joined_at asc;
end;
$$;

-- ---------- 老师：发布作业 ----------

create or replace function public.publish_homework(p_classroom_id uuid, p_title text, p_subject text,
                                                   p_content text, p_due_on date)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_title text := btrim(coalesce(p_title, ''));
  v_content text := btrim(coalesce(p_content, ''));
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = auth.uid()) then
    raise exception '只有班级老师可以发布作业';
  end if;
  if char_length(v_title) < 2 or char_length(v_title) > 40 then raise exception '作业标题需要为 2 至 40 个字符'; end if;
  if p_subject not in ('en','math','chinese','other') then raise exception '请选择作业科目'; end if;
  if char_length(v_content) > 500 then raise exception '作业要求最多 500 个字符'; end if;
  if p_due_on is not null and p_due_on < current_date then raise exception '截止日期不能早于今天'; end if;
  if (select count(*) from public.homework h where h.classroom_id = p_classroom_id) >= 200 then
    raise exception '这个班级的作业已达上限，请先删除一些旧作业';
  end if;

  insert into public.homework(classroom_id, title, subject, content, due_on)
  values (p_classroom_id, v_title, p_subject, v_content, p_due_on)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.delete_homework(p_homework_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (
    select 1 from public.homework h join public.classrooms c on c.id = h.classroom_id
    where h.id = p_homework_id and c.teacher_id = auth.uid()
  ) then
    raise exception '只有班级老师可以删除作业';
  end if;
  delete from public.homework where id = p_homework_id;
end;
$$;

create or replace function public.list_homework_progress(p_homework_id uuid)
returns table(nickname text, submitted_at timestamptz, note text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_classroom uuid;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select h.classroom_id into v_classroom
  from public.homework h join public.classrooms c on c.id = h.classroom_id
  where h.id = p_homework_id and c.teacher_id = auth.uid();
  if not found then raise exception '只有班级老师可以查看完成情况'; end if;
  return query
    select s.nickname, hs.submitted_at, coalesce(hs.note, '')
    from public.classroom_students s
    left join public.homework_submissions hs on hs.homework_id = p_homework_id and hs.user_id = s.user_id
    where s.classroom_id = v_classroom
    order by hs.submitted_at asc nulls last, s.joined_at asc;
end;
$$;

-- ---------- 学生：加入班级 / 完成作业 ----------

create or replace function public.join_classroom_by_code(p_invite_code text, p_nickname text)
returns table(classroom_id uuid, classroom_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_class public.classrooms%rowtype;
  v_nickname text := btrim(coalesce(p_nickname, ''));
begin
  if v_user is null then raise exception '请先登录后再加入班级'; end if;
  if char_length(v_nickname) < 1 or char_length(v_nickname) > 20 then raise exception '姓名或昵称需要为 1 至 20 个字符'; end if;

  select * into v_class from public.classrooms c where c.invite_code = upper(btrim(coalesce(p_invite_code, '')));
  if not found then raise exception '班级码无效，请向老师确认'; end if;
  if v_class.teacher_id = v_user then raise exception '你是这个班级的老师，不需要加入'; end if;
  if exists (select 1 from public.classroom_students s where s.classroom_id = v_class.id and s.user_id = v_user) then
    raise exception '你已经在这个班级里了';
  end if;
  if (select count(*) from public.classroom_students s where s.user_id = v_user) >= 5 then
    raise exception '每个账号最多加入 5 个班级';
  end if;
  if (select count(*) from public.classroom_students s where s.classroom_id = v_class.id) >= 60 then
    raise exception '这个班级人数已满';
  end if;

  insert into public.classroom_students(classroom_id, user_id, nickname)
  values (v_class.id, v_user, v_nickname);

  return query select v_class.id, v_class.name;
end;
$$;

create or replace function public.list_my_classrooms()
returns table(classroom_id uuid, classroom_name text, grade smallint, teacher_name text,
              nickname text, pending_count bigint, joined_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.id, c.name, c.grade, t.display_name, s.nickname,
         (select count(*) from public.homework h
           where h.classroom_id = c.id
             and not exists (select 1 from public.homework_submissions hs
                              where hs.homework_id = h.id and hs.user_id = auth.uid())),
         s.joined_at
  from public.classroom_students s
  join public.classrooms c on c.id = s.classroom_id
  join public.teacher_profiles t on t.user_id = c.teacher_id
  where s.user_id = auth.uid()
  order by s.joined_at desc;
$$;

create or replace function public.leave_classroom(p_classroom_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.classroom_students s where s.classroom_id = p_classroom_id and s.user_id = auth.uid()) then
    raise exception '你还不在这个班级里';
  end if;
  delete from public.homework_submissions hs
  using public.homework h
  where hs.homework_id = h.id and h.classroom_id = p_classroom_id and hs.user_id = auth.uid();
  delete from public.classroom_students where classroom_id = p_classroom_id and user_id = auth.uid();
end;
$$;

-- 老师和班级学生都能调用：老师看到完成人数，学生看到自己的完成状态
create or replace function public.list_classroom_homework(p_classroom_id uuid)
returns table(homework_id uuid, title text, subject text, content text, due_on date, created_at timestamptz,
              submitted_count bigint, student_count bigint, my_submitted_at timestamptz, my_note text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_is_teacher boolean;
begin
  if v_user is null then raise exception '请先登录'; end if;
  v_is_teacher := exists (select 1 from public.classrooms c where c.id = p_classroom_id and c.teacher_id = v_user);
  if not v_is_teacher and not exists (
    select 1 from public.classroom_students s where s.classroom_id = p_classroom_id and s.user_id = v_user
  ) then
    raise exception '你不在这个班级里';
  end if;
  return query
    select h.id, h.title, h.subject, h.content, h.due_on, h.created_at,
           case when v_is_teacher then (select count(*) from public.homework_submissions hs where hs.homework_id = h.id) else null end,
           case when v_is_teacher then (select count(*) from public.classroom_students s where s.classroom_id = p_classroom_id) else null end,
           mine.submitted_at, mine.note
    from public.homework h
    left join public.homework_submissions mine on mine.homework_id = h.id and mine.user_id = v_user
    where h.classroom_id = p_classroom_id
    order by h.created_at desc;
end;
$$;

create or replace function public.submit_homework(p_homework_id uuid, p_note text)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_note text := btrim(coalesce(p_note, ''));
  v_at timestamptz := now();
begin
  if v_user is null then raise exception '请先登录'; end if;
  if char_length(v_note) > 200 then raise exception '完成留言最多 200 个字符'; end if;
  if not exists (
    select 1 from public.homework h
    join public.classroom_students s on s.classroom_id = h.classroom_id and s.user_id = v_user
    where h.id = p_homework_id
  ) then
    raise exception '这份作业不属于你所在的班级';
  end if;

  insert into public.homework_submissions(homework_id, user_id, note, submitted_at)
  values (p_homework_id, v_user, v_note, v_at)
  on conflict (homework_id, user_id) do update set note = excluded.note, submitted_at = excluded.submitted_at;
  return v_at;
end;
$$;

create or replace function public.withdraw_homework_submission(p_homework_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  delete from public.homework_submissions where homework_id = p_homework_id and user_id = auth.uid();
end;
$$;

-- ---------- 权限 ----------

revoke all on function public.get_my_teacher_profile() from public, anon;
revoke all on function public.register_teacher(text,text) from public, anon;
revoke all on function public.create_classroom(text,integer) from public, anon;
revoke all on function public.list_teacher_classrooms() from public, anon;
revoke all on function public.delete_classroom(uuid) from public, anon;
revoke all on function public.list_classroom_students(uuid) from public, anon;
revoke all on function public.publish_homework(uuid,text,text,text,date) from public, anon;
revoke all on function public.delete_homework(uuid) from public, anon;
revoke all on function public.list_homework_progress(uuid) from public, anon;
revoke all on function public.join_classroom_by_code(text,text) from public, anon;
revoke all on function public.list_my_classrooms() from public, anon;
revoke all on function public.leave_classroom(uuid) from public, anon;
revoke all on function public.list_classroom_homework(uuid) from public, anon;
revoke all on function public.submit_homework(uuid,text) from public, anon;
revoke all on function public.withdraw_homework_submission(uuid) from public, anon;

grant execute on function public.get_my_teacher_profile() to authenticated;
grant execute on function public.register_teacher(text,text) to authenticated;
grant execute on function public.create_classroom(text,integer) to authenticated;
grant execute on function public.list_teacher_classrooms() to authenticated;
grant execute on function public.delete_classroom(uuid) to authenticated;
grant execute on function public.list_classroom_students(uuid) to authenticated;
grant execute on function public.publish_homework(uuid,text,text,text,date) to authenticated;
grant execute on function public.delete_homework(uuid) to authenticated;
grant execute on function public.list_homework_progress(uuid) to authenticated;
grant execute on function public.join_classroom_by_code(text,text) to authenticated;
grant execute on function public.list_my_classrooms() to authenticated;
grant execute on function public.leave_classroom(uuid) to authenticated;
grant execute on function public.list_classroom_homework(uuid) to authenticated;
grant execute on function public.submit_homework(uuid,text) to authenticated;
grant execute on function public.withdraw_homework_submission(uuid) to authenticated;
