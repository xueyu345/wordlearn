-- Wordlearn invite-only study groups
-- Apply this migration in the WorkBuddy cloud database SQL console before enabling the UI.
-- All group operations go through SECURITY DEFINER RPCs; clients never receive direct table access.

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 30),
  invite_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.study_group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  grade smallint not null check (grade between 1 and 6),
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists study_group_members_user_idx
  on public.study_group_members(user_id, joined_at desc);

alter table public.study_groups enable row level security;
alter table public.study_group_members enable row level security;

revoke all on public.study_groups from anon, authenticated;
revoke all on public.study_group_members from anon, authenticated;

create or replace function public.create_study_group(p_name text, p_nickname text, p_grade integer)
returns table(group_id uuid, group_name text, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group_id uuid;
  v_code text;
  v_name text := btrim(coalesce(p_name, ''));
  v_nickname text := btrim(coalesce(p_nickname, ''));
begin
  if v_user is null then raise exception '请先登录后再创建学习小组'; end if;
  if char_length(v_name) < 2 or char_length(v_name) > 30 then raise exception '小组名称需要为 2 至 30 个字符'; end if;
  if char_length(v_nickname) < 1 or char_length(v_nickname) > 20 then raise exception '昵称需要为 1 至 20 个字符'; end if;
  if p_grade < 1 or p_grade > 6 then raise exception '年级请选择一至六年级'; end if;
  if (select count(*) from public.study_group_members m where m.user_id = v_user) >= 5 then
    raise exception '每个账号最多加入 5 个学习小组';
  end if;

  loop
    v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 8));
    exit when not exists (select 1 from public.study_groups g where g.invite_code = v_code);
  end loop;

  insert into public.study_groups(name, invite_code, owner_id)
  values (v_name, v_code, v_user)
  returning id into v_group_id;

  insert into public.study_group_members(group_id, user_id, nickname, grade, role)
  values (v_group_id, v_user, v_nickname, p_grade, 'owner');

  return query select v_group_id, v_name, v_code;
end;
$$;

create or replace function public.join_study_group_by_code(p_invite_code text, p_nickname text, p_grade integer)
returns table(group_id uuid, group_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_group public.study_groups%rowtype;
  v_nickname text := btrim(coalesce(p_nickname, ''));
begin
  if v_user is null then raise exception '请先登录后再加入学习小组'; end if;
  if char_length(v_nickname) < 1 or char_length(v_nickname) > 20 then raise exception '昵称需要为 1 至 20 个字符'; end if;
  if p_grade < 1 or p_grade > 6 then raise exception '年级请选择一至六年级'; end if;
  if exists (select 1 from public.study_group_members m where m.user_id = v_user and m.group_id in
    (select g.id from public.study_groups g where g.invite_code = upper(btrim(coalesce(p_invite_code,''))))) then
    raise exception '你已经加入这个学习小组了';
  end if;
  if (select count(*) from public.study_group_members m where m.user_id = v_user) >= 5 then
    raise exception '每个账号最多加入 5 个学习小组';
  end if;

  select * into v_group from public.study_groups g
  where g.invite_code = upper(btrim(coalesce(p_invite_code,'')));
  if not found then raise exception '邀请码无效，请检查后重试'; end if;

  if (select count(*) from public.study_group_members m where m.group_id = v_group.id) >= 20 then
    raise exception '这个学习小组已满员';
  end if;

  insert into public.study_group_members(group_id, user_id, nickname, grade, role)
  values (v_group.id, v_user, v_nickname, p_grade, 'member');

  return query select v_group.id, v_group.name;
end;
$$;

create or replace function public.list_my_study_groups()
returns table(group_id uuid, group_name text, invite_code text, member_role text, member_count bigint, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select g.id, g.name,
         case when m.role = 'owner' then g.invite_code else null end,
         m.role,
         (select count(*) from public.study_group_members allm where allm.group_id = g.id),
         g.created_at
  from public.study_groups g
  join public.study_group_members m on m.group_id = g.id
  where m.user_id = auth.uid()
  order by g.created_at desc;
$$;

create or replace function public.list_study_group_members(p_group_id uuid)
returns table(nickname text, grade smallint, member_role text, joined_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.study_group_members m where m.group_id = p_group_id and m.user_id = auth.uid()) then
    raise exception '你不是这个小组的成员';
  end if;
  return query
    select m.nickname, m.grade, m.role, m.joined_at
    from public.study_group_members m
    where m.group_id = p_group_id
    order by case when m.role = 'owner' then 0 else 1 end, m.joined_at asc;
end;
$$;

create or replace function public.leave_study_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  select m.role into v_role from public.study_group_members m
  where m.group_id = p_group_id and m.user_id = auth.uid();
  if not found then raise exception '你还不是这个小组的成员'; end if;
  if v_role = 'owner' then raise exception '小组创建者暂不能直接退出，请先删除小组或转交管理权'; end if;
  delete from public.study_group_members where group_id = p_group_id and user_id = auth.uid();
end;
$$;

create or replace function public.delete_study_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception '请先登录'; end if;
  if not exists (select 1 from public.study_groups g where g.id = p_group_id and g.owner_id = auth.uid()) then
    raise exception '只有小组创建者可以删除小组';
  end if;
  delete from public.study_groups where id = p_group_id;
end;
$$;

revoke all on function public.create_study_group(text,text,integer) from public, anon;
revoke all on function public.join_study_group_by_code(text,text,integer) from public, anon;
revoke all on function public.list_my_study_groups() from public, anon;
revoke all on function public.list_study_group_members(uuid) from public, anon;
revoke all on function public.leave_study_group(uuid) from public, anon;
revoke all on function public.delete_study_group(uuid) from public, anon;

grant execute on function public.create_study_group(text,text,integer) to authenticated;
grant execute on function public.join_study_group_by_code(text,text,integer) to authenticated;
grant execute on function public.list_my_study_groups() to authenticated;
grant execute on function public.list_study_group_members(uuid) to authenticated;
grant execute on function public.leave_study_group(uuid) to authenticated;
grant execute on function public.delete_study_group(uuid) to authenticated;
