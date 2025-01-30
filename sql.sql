--------------------------------------------------------------------------------
-- BLOCO 1) Extensões Necessárias
--------------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

--------------------------------------------------------------------------------
-- BLOCO 2) Criação de Tipos Enumerados (Enums)
--------------------------------------------------------------------------------

-- Ações do usuário
create type action_type as enum (
  'report_problem',
  'solve_problem',
  'daily_check_in',
  'streak_bonus',
  'achievement_completed',
  'add_upvote',
  'add_comment'
);

-- Status de problema
create type problem_status as enum (
  'active',
  'solved',
  'invalid',
  'deleted'
);

-- Categorias de problema
create type problem_category as enum (
  'infrastructure',
  'maintenance',
  'security',
  'cleaning',
  'technology',
  'educational',
  'social',
  'sustainability'
);

--------------------------------------------------------------------------------
-- BLOCO 3) Tabela action_rewards (XP por ação)
--------------------------------------------------------------------------------
create table if not exists action_rewards (
  action action_type primary key,
  xp_reward integer not null check (xp_reward >= 0),
  description text
);

insert into action_rewards (action, xp_reward, description)
values
  ('report_problem',        100,    'Reportar um problema'),
  ('solve_problem',         200,    'Resolver um problema'),
  ('daily_check_in',        30,     'Check-in diário'),
  ('streak_bonus',          2,      'Bônus de streak'),
  ('achievement_completed', 0,      'Conquista completada'),
  ('add_upvote',            0,      'Dar um upvote'),
  ('add_comment',           0,      'Fazer um comentário')
on conflict (action)
do update set
  xp_reward = excluded.xp_reward,
  description = excluded.description;

--------------------------------------------------------------------------------
-- BLOCO 4) Tabela level_config (definição de níveis)
--------------------------------------------------------------------------------
create table if not exists level_config (
  level integer primary key,
  xp_required integer not null,
  title text not null,
  description text,
  created_at timestamptz default now(),
  constraint ck_xp_required check (xp_required >= 0),
  constraint ck_level_pos check (level > 0)
);

insert into level_config (level, xp_required, title, description)
values
  (1, 0, 'Iniciante', 'Começando sua jornada'),
  (2, 100, 'Observador', 'Seus olhos estão atentos'),
  (3, 300, 'Cidadão Ativo', 'Participando ativamente'),
  (4, 600, 'Guardião da Cidade', 'Protegendo nossa comunidade'),
  (5, 1000, 'Líder Comunitário', 'Inspirando outros a ajudar'),
  (6, 1500, 'Agente de Mudança', 'Transformando a comunidade'),
  (7, 2100, 'Herói Local', 'Fazendo a diferença'),
  (8, 2800, 'Lenda da Cidade', 'Sua dedicação é inspiradora'),
  (9, 3600, 'Mestre Guardião', 'Um exemplo a ser seguido'),
  (10, 4500, 'Guardião Supremo', 'O mais alto nível de dedicação')
on conflict (level) do nothing;

--------------------------------------------------------------------------------
-- BLOCO 5) user_profiles (dados do usuário + XP + nível + counters)
--------------------------------------------------------------------------------
create table if not exists user_profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique,
  avatar_url text,
  current_xp integer default 0,
  current_level integer default 1 references level_config(level),
  current_streak integer default 0,
  max_streak integer default 0,
  last_check_in timestamptz,
  problems_reported integer default 0,
  problems_solved integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint ck_username_len check (char_length(username) >= 3),
  constraint ck_xp_nonneg check (current_xp >= 0),
  constraint ck_level_pos check (current_level > 0)
);

--------------------------------------------------------------------------------
-- BLOCO 5.1) Trigger para criar user_profiles ao criar auth.users
--------------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger as $$
declare
  base_name text;
  final_username text;
  suffix integer := 1;
begin
  base_name := split_part(new.email, '@', 1);
  final_username := base_name;

  if length(final_username) < 3 then
    final_username := final_username || '_user';
  end if;

  loop
    begin
      insert into user_profiles (id, username)
      values (new.id, final_username);
      exit;
    exception when unique_violation then
      final_username := base_name || suffix;
      suffix := suffix + 1;
      if length(final_username) < 3 then
        final_username := base_name || '_user' || suffix;
      end if;
    end;
  end loop;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

--------------------------------------------------------------------------------
-- BLOCO 6) user_actions (histórico de ações que geram XP)
--------------------------------------------------------------------------------
create table if not exists user_actions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  action action_type not null,
  xp_earned integer not null check (xp_earned >= 0),
  reference_id text,
  created_at timestamptz default now(),
  constraint unique_user_action unique (user_id, action, reference_id)
);


--------------------------------------------------------------------------------
-- BLOCO 6.1) Função add_user_action: soma XP (via action_rewards) + counters
--------------------------------------------------------------------------------
create or replace function add_user_action(
  p_user_id uuid,
  p_action action_type,
  p_reference_id text default null
)
returns void as $$
declare
  v_reward integer;
  v_ref text := p_reference_id; -- local para manipular
begin
  select xp_reward
    into v_reward
    from action_rewards
    where action = p_action;

  if v_reward is null then
    v_reward := 0;
  end if;

  -- Se não vier reference_id, gere um "uuid em texto"
  if v_ref is null then
    v_ref := uuid_generate_v4()::text;
  end if;

  insert into user_actions (user_id, action, xp_earned, reference_id)
  values (p_user_id, p_action, v_reward, v_ref);

  update user_profiles
    set current_xp = current_xp + v_reward,
        problems_reported = case
          when p_action = 'report_problem' then problems_reported + 1
          else problems_reported
        end,
        problems_solved = case
          when p_action = 'solve_problem' then problems_solved + 1
          else problems_solved
        end
  where id = p_user_id;
end;
$$ language plpgsql security definer;

--------------------------------------------------------------------------------
-- BLOCO 7) update_user_level: vincula current_xp ao level_config
--------------------------------------------------------------------------------
create or replace function update_user_level()
returns trigger as $$
begin
  new.current_level := (
    select level
    from level_config
    where xp_required <= new.current_xp
    order by level desc
    limit 1
  );
  return new;
end;
$$ language plpgsql;

create trigger on_profile_xp_change
  before update of current_xp on user_profiles
  for each row
  execute function update_user_level();

--------------------------------------------------------------------------------
-- BLOCO 7.1) Trigger para verificar conquistas de nível após atualização de level
--------------------------------------------------------------------------------
create or replace function check_level_achievements()
returns trigger as $$
begin
  if new.current_level <> old.current_level then
    perform check_achievement_progress(new.id, 'reach_level_3');
    perform check_achievement_progress(new.id, 'reach_level_5');
    perform check_achievement_progress(new.id, 'reach_level_10');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_level_change
  after update of current_level on user_profiles
  for each row
  execute function check_level_achievements();

--------------------------------------------------------------------------------
-- BLOCO 10) reported_problems
--------------------------------------------------------------------------------
create table if not exists reported_problems (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category problem_category not null,
  location geometry(Point, 4326) not null,
  image_url text,
  status problem_status default 'active',
  reporter_id uuid not null references auth.users(id),
  solver_id uuid references auth.users(id),
  reported_at timestamptz default now(),
  solved_at timestamptz,
  updated_at timestamptz default now(),
  constraint valid_solved check (
    (status in ('solved','invalid') and solver_id is not null and solved_at is not null)
    or (status in ('active','deleted') and solver_id is null and solved_at is null)
  )
);

--------------------------------------------------------------------------------
-- BLOCO 10.1) Função reopen_problem
--------------------------------------------------------------------------------
create or replace function reopen_problem(
  p_problem_id uuid,
  p_user_id uuid default auth.uid()
)
returns json as $$
declare
  v_prob reported_problems;
begin
  -- Verifica se o usuário está autenticado
  if p_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- Verifica se o usuário não é o mesmo que reportou o problema
  if exists (
    select 1 from reported_problems
    where id = p_problem_id and reporter_id = p_user_id
  ) then
    raise exception 'Você não pode reabrir seu próprio problema';
  end if;

  update reported_problems
  set
    status = 'active',
    solved_at = null,
    solver_id = null,
    reporter_id = p_user_id, -- Atualiza para o novo usuário que está reabrindo
    updated_at = now()
  where id = p_problem_id
    and status in ('solved','invalid')
  returning *
  into v_prob;

  if not found then
    raise exception 'Problema não encontrado ou não pode ser reaberto';
  end if;

  return row_to_json(v_prob);
end;
$$ language plpgsql security definer;

--------------------------------------------------------------------------------
-- BLOCO 11) problem_upvotes e problem_comments
--------------------------------------------------------------------------------
create table if not exists problem_upvotes (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid references reported_problems(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_upvote unique (problem_id, user_id)
);

create table if not exists problem_comments (
  id uuid primary key default uuid_generate_v4(),
  problem_id uuid references reported_problems(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  comment text not null check (char_length(comment) >= 1),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

--------------------------------------------------------------------------------
-- BLOCO 11.1) Triggers para conquistas de upvote/comment
-- Atualizar "upvotes_10" ou "comments_5" automaticamente
--------------------------------------------------------------------------------
create or replace function check_achievement_for_upvote()
returns trigger as $$
begin
  perform check_achievement_progress(new.user_id, 'upvotes_10');
  return new;
end;
$$ language plpgsql;

drop trigger if exists after_upvote_check_achievement on problem_upvotes;
create trigger after_upvote_check_achievement
after insert on problem_upvotes
for each row
execute function check_achievement_for_upvote();


create or replace function check_achievement_for_comment()
returns trigger as $$
begin
  perform check_achievement_progress(new.user_id, 'comments_5');
  return new;
end;
$$ language plpgsql;

drop trigger if exists after_comment_check_achievement on problem_comments;
create trigger after_comment_check_achievement
after insert on problem_comments
for each row
execute function check_achievement_for_comment();

--------------------------------------------------------------------------------
-- BLOCO 8) Achievements (conquistas) + user_achievements
--------------------------------------------------------------------------------
create table if not exists achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null check (xp_reward >= 0),
  category text not null,
  requirement integer not null
);

create table if not exists user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  achievement_id text references achievements(id),
  current_progress integer default 0,
  completed_at timestamptz,
  xp_claimed boolean default false,
  unique(user_id, achievement_id)
);

--------------------------------------------------------------------------------
-- BLOCO 8.1) Inserção de conquistas
--------------------------------------------------------------------------------
insert into achievements (id, title, description, icon, xp_reward, category, requirement)
values
  ('report_1',  'Primeiro Alerta',      'Reporte seu primeiro problema', 'icon_name', 50,  'problems', 1),
  ('report_5',  'Vigilante',           'Reporte 5 problemas',           'icon_name', 100, 'problems', 5),
  ('report_20', 'Guardião da Cidade',  'Reporte 20 problemas',          'icon_name', 200, 'problems', 20),
  ('solve_1',   'Primeira Solução',    'Resolva seu primeiro problema', 'icon_name', 100, 'problems', 1),
  ('solve_10',  'Solucionador',        'Resolva 10 problemas',          'icon_name', 300, 'problems', 10),
  ('solve_50',  'Mestre das Soluções', 'Resolva 50 problemas',          'icon_name', 1000,'problems', 50),

  ('streak_3',   'Consistente',        'Mantenha 3 dias de streak',     'icon_name', 75,  'check_in', 3),
  ('streak_7',   'Dedicação Semanal',  'Mantenha 7 dias de streak',     'icon_name', 200, 'check_in', 7),
  ('streak_30',  'Compromisso Mensal', 'Mantenha 30 dias de streak',    'icon_name', 500, 'check_in', 30),

  ('upvotes_10',         'Apoiador',     'Dê 10 upvotes',        'icon_name', 75,  'social', 10),
  ('comments_5',         'Comunicador',  'Faça 5 comentários',   'icon_name', 100, 'social', 5),
  ('received_upvotes_20','Reconhecido',  'Receba 20 upvotes',    'icon_name', 300, 'social', 20),

  ('reach_level_3',  'Cidadão Ativo',     'Alcance o nível 3', 'icon_name', 100, 'level', 3),
  ('reach_level_5',  'Líder Comunitário','Alcance o nível 5', 'icon_name', 200, 'level', 5),
  ('reach_level_10', 'Guardião Supremo', 'Alcance nível 10',   'icon_name', 500, 'level', 10)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  xp_reward = excluded.xp_reward,
  category = excluded.category,
  requirement = excluded.requirement;

--------------------------------------------------------------------------------
-- BLOCO 8.2) check_achievement_progress (analisa se o usuário completou)
--------------------------------------------------------------------------------
create or replace function check_achievement_progress(
  p_user_id uuid,
  p_achievement_id text
)
returns void as $$
declare
  v_ach achievements;
  v_progress integer := 0;
  v_completed boolean;
  v_already_claimed boolean;
begin
  select * into v_ach
  from achievements
  where id = p_achievement_id;

  if not found then
    return;
  end if;

  -- Verifica se já recebeu o XP desta conquista
  select exists (
    select 1 
    from user_actions 
    where user_id = p_user_id 
      and action = 'achievement_completed' 
      and reference_id = p_achievement_id
  ) into v_already_claimed;

  -- Se já recebeu o XP, não precisa continuar
  if v_already_claimed then
    return;
  end if;

  -- Calcula progresso
  if v_ach.category = 'problems' then
    if v_ach.id like 'report_%' then
      v_progress := (select problems_reported from user_profiles where id = p_user_id);
    elsif v_ach.id like 'solve_%' then
      v_progress := (select problems_solved from user_profiles where id = p_user_id);
    end if;

  elsif v_ach.category = 'check_in' then
    v_progress := (select max_streak from user_profiles where id = p_user_id);

  elsif v_ach.category = 'social' then
    case v_ach.id
      when 'upvotes_10' then
        v_progress := (select count(*) from problem_upvotes where user_id = p_user_id);
      when 'comments_5' then
        v_progress := (select count(*) from problem_comments where user_id = p_user_id);
      when 'received_upvotes_20' then
        v_progress := (
          select count(distinct pu.id)
          from problem_upvotes pu
          join reported_problems rp on pu.problem_id = rp.id
          where rp.reporter_id = p_user_id
        );
    end case;

  elsif v_ach.category = 'level' then
    v_progress := (select current_level from user_profiles where id = p_user_id);
  end if;

  v_completed := coalesce(v_progress, 0) >= v_ach.requirement;

  -- Atualiza user_achievements
  insert into user_achievements (
    user_id, achievement_id, current_progress, completed_at, xp_claimed
  )
  values (
    p_user_id,
    p_achievement_id,
    v_progress,
    case when v_completed then now() else null end,
    false
  )
  on conflict (user_id, achievement_id)
  do update set
    current_progress = excluded.current_progress,
    completed_at = case
      when v_completed and user_achievements.completed_at is null
      then now()
      else user_achievements.completed_at
    end;

  -- Se completou e não recebeu XP da conquista
  if v_completed and not exists (
    select 1
    from user_achievements
    where user_id = p_user_id
      and achievement_id = p_achievement_id
      and xp_claimed
  ) then
    -- Concede XP da conquista e usar reference_id = p_achievement_id
    insert into user_actions (user_id, action, xp_earned, reference_id)
    values (p_user_id, 'achievement_completed', v_ach.xp_reward, p_achievement_id);

    update user_profiles
    set current_xp = current_xp + v_ach.xp_reward
    where id = p_user_id;

    update user_achievements
    set xp_claimed = true
    where user_id = p_user_id
      and achievement_id = p_achievement_id;
  end if;
end;
$$ language plpgsql security definer;

--------------------------------------------------------------------------------
-- BLOCO 8.3) check_all_achievements (verifica todas)
--------------------------------------------------------------------------------
create or replace function check_all_achievements(
  p_user_id uuid
)
returns void as $$
declare
  r record;
begin
  for r in (select id from achievements) loop
    perform check_achievement_progress(p_user_id, r.id);
  end loop;
end;
$$ language plpgsql security definer;

--------------------------------------------------------------------------------
-- BLOCO 8.4) Trigger em user_actions: checar conquistas
-- (report, solve, etc.)
--------------------------------------------------------------------------------
create or replace function check_achievements_after_action()
returns trigger as $$
begin
  if new.action in ('report_problem', 'solve_problem') then
    perform check_achievement_progress(new.user_id, 'report_1');
    perform check_achievement_progress(new.user_id, 'report_5');
    perform check_achievement_progress(new.user_id, 'report_20');
    perform check_achievement_progress(new.user_id, 'solve_1');
    perform check_achievement_progress(new.user_id, 'solve_10');
    perform check_achievement_progress(new.user_id, 'solve_50');

  elsif new.action = 'daily_check_in' then
    perform check_achievement_progress(new.user_id, 'streak_3');
    perform check_achievement_progress(new.user_id, 'streak_7');
    perform check_achievement_progress(new.user_id, 'streak_30');
  end if;

  -- Sempre verifica conquistas de nível quando ganha XP
  if new.xp_earned > 0 then
    perform check_achievement_progress(new.user_id, 'reach_level_3');
    perform check_achievement_progress(new.user_id, 'reach_level_5');
    perform check_achievement_progress(new.user_id, 'reach_level_10');
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists after_user_action_check_achievements on user_actions;
create trigger after_user_action_check_achievements
after insert on user_actions
for each row
execute function check_achievements_after_action();

--------------------------------------------------------------------------------
-- BLOCO 9) Funções de Check-in Diário
--------------------------------------------------------------------------------

-- 9.1) Check-in simples
create or replace function perform_daily_check_in(p_user_id uuid)
returns void as $$
declare
  v_last timestamptz;
  v_cs integer;
  v_ms integer;
  v_diff numeric;
begin
  select last_check_in, current_streak, max_streak
  into v_last, v_cs, v_ms
  from user_profiles
  where id = p_user_id
  for update;

  if v_last is not null then
    v_diff := extract(epoch from (now() - v_last)) / 3600;
    if v_diff < 24 then
      raise exception 'Espere 24 horas para novo check-in.';
    end if;
    v_cs := case
      when v_diff <= 48 then v_cs + 1
      else 1
    end;
  else
    v_cs := 1;
  end if;

  v_ms := greatest(coalesce(v_ms, 0), v_cs);

  update user_profiles
  set
    last_check_in = now(),
    current_streak = v_cs,
    max_streak = v_ms
  where id = p_user_id;

  perform add_user_action(p_user_id, 'daily_check_in');
end;
$$ language plpgsql security definer;

-- 9.2) Check-in com bônus (streak_bonus)
create or replace function perform_daily_check_in_with_bonus(p_user_id uuid)
returns void as $$
declare
  v_last timestamptz;
  v_diff numeric;
  v_streak integer;
begin
  select last_check_in into v_last
  from user_profiles
  where id = p_user_id;

  if v_last is not null then
    v_diff := extract(epoch from (now() - v_last)) / 3600;
    if v_diff > 48 then
      perform perform_daily_check_in(p_user_id);
      return;
    end if;
  end if;

  perform perform_daily_check_in(p_user_id);

  select current_streak into v_streak
  from user_profiles
  where id = p_user_id;

  if v_streak > 1 then
    for i in 1..(v_streak - 1) loop
      perform add_user_action(p_user_id, 'streak_bonus');
    end loop;
  end if;
end;
$$ language plpgsql security definer;

--------------------------------------------------------------------------------
-- BLOCO 12) update_updated_at + triggers
--------------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_reported_problems_timestamp
  before update on reported_problems
  for each row
  execute function update_updated_at();

create trigger update_user_profiles_timestamp
  before update on user_profiles
  for each row
  execute function update_updated_at();

create trigger update_problem_comments_timestamp
  before update on problem_comments
  for each row
  execute function update_updated_at();

--------------------------------------------------------------------------------
-- BLOCO 13) Row Level Security (RLS) e Políticas
--------------------------------------------------------------------------------

-- user_profiles
alter table user_profiles enable row level security;
create policy "select_profiles"
  on user_profiles for select
  to authenticated
  using (true);

create policy "update_own_profile"
  on user_profiles for update
  to authenticated
  using (id = auth.uid());

-- reported_problems
alter table reported_problems enable row level security;
create policy "select_problems"
  on reported_problems for select
  to authenticated
  using (true);

create policy "insert_problems"
  on reported_problems for insert
  to authenticated
  with check (reporter_id = auth.uid());

create policy "update_own_problems"
  on reported_problems for update
  to authenticated
  using (reporter_id = auth.uid())
  with check (reporter_id = auth.uid());

-- problem_upvotes
alter table problem_upvotes enable row level security;
create policy "select_upvotes"
  on problem_upvotes for select
  to authenticated
  using (true);

create policy "insert_upvote"
  on problem_upvotes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "delete_own_upvote"
  on problem_upvotes for delete
  to authenticated
  using (auth.uid() = user_id);

-- problem_comments
alter table problem_comments enable row level security;
create policy "select_comments"
  on problem_comments for select
  to authenticated
  using (true);

create policy "insert_comment"
  on problem_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "update_own_comment"
  on problem_comments for update
  to authenticated
  using (auth.uid() = user_id);

create policy "delete_own_comment"
  on problem_comments for delete
  to authenticated
  using (auth.uid() = user_id);

-- user_actions
alter table user_actions enable row level security;
create policy "select_own_actions"
  on user_actions for select
  to authenticated
  using (user_id = auth.uid());

create policy "insert_own_actions"
  on user_actions for insert
  to authenticated
  with check (user_id = auth.uid());

-- achievements
alter table achievements enable row level security;
create policy "select_achievements"
  on achievements for select
  to authenticated
  using (true);

-- user_achievements
alter table user_achievements enable row level security;
create policy "select_own_achievements"
  on user_achievements for select
  to authenticated
  using (user_id = auth.uid());

--------------------------------------------------------------------------------
-- BLOCO 14) Índices de performance
--------------------------------------------------------------------------------
create index if not exists idx_reported_problems_location 
    on reported_problems using gist (location);

create index if not exists idx_reported_problems_reporter 
    on reported_problems (reporter_id);

create index if not exists idx_reported_problems_solver 
    on reported_problems (solver_id);

create index if not exists idx_reported_problems_status 
    on reported_problems (status);

create index if not exists idx_problem_upvotes_problem 
    on problem_upvotes (problem_id);

create index if not exists idx_problem_upvotes_user 
    on problem_upvotes (user_id);

create index if not exists idx_problem_comments_problem 
    on problem_comments (problem_id);

create index if not exists idx_problem_comments_user 
    on problem_comments (user_id);

create index if not exists idx_user_actions_user 
    on user_actions (user_id);

create index if not exists idx_user_achievements_user 
    on user_achievements (user_id);

--------------------------------------------------------------------------------
-- BLOCO 15) View para juntar comments + perfil
--------------------------------------------------------------------------------
create or replace view problem_comments_with_profiles as
select
  pc.*,
  up.username,
  up.avatar_url
from problem_comments pc
join user_profiles up on pc.user_id = up.id;

--------------------------------------------------------------------------------
-- BLOCO 16) Bucket de imagens (storage)
--------------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('problem-images', 'problem-images', false)
on conflict (id) do nothing;

create policy "upload_propria_pasta"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'problem-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "view_images"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'problem-images');

--------------------------------------------------------------------------------
-- BLOCO 17) Habilitar Realtime no Supabase
--------------------------------------------------------------------------------
alter publication supabase_realtime add table user_profiles;
alter publication supabase_realtime add table user_actions;
alter publication supabase_realtime add table achievements;
alter publication supabase_realtime add table user_achievements;
alter publication supabase_realtime add table reported_problems;
alter publication supabase_realtime add table problem_upvotes;
alter publication supabase_realtime add table problem_comments;

alter publication supabase_realtime set (publish = 'insert,update,delete');

commit;

--------------------------------------------------------------------------------
-- BLOCO 18) Função para resolver um problema
--------------------------------------------------------------------------------
create or replace function public.solve_problem(p_problem_id uuid)
returns json as $$
declare
  v_problem reported_problems;
  v_user_id uuid;
begin
  -- Pega o ID do usuário uma única vez
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  -- Inicia transação
  begin;
    -- Busca e trava o problema para validações
    select * into v_problem
    from reported_problems
    where id = p_problem_id
    for update;

    -- Validações em sequência
    if v_problem is null then
      raise exception 'Problema não encontrado';
    end if;

    if v_problem.status != 'active' then
      raise exception 'Apenas problemas ativos podem ser resolvidos';
    end if;

    if v_problem.reporter_id = v_user_id then
      raise exception 'Você não pode resolver seu próprio problema';
    end if;

    if v_problem.solver_id is not null then
      raise exception 'Este problema já foi resolvido por outra pessoa';
    end if;

    -- Atualiza o problema com condições de segurança extras
    update reported_problems
    set
      status = 'solved',
      solver_id = v_user_id,
      solved_at = now(),
      updated_at = now()
    where id = p_problem_id
      and status = 'active'
      and solver_id is null
      and reporter_id != v_user_id
    returning * into v_problem;

    -- Verifica se o update funcionou
    if not found then
      raise exception 'Não foi possível resolver o problema. Ele pode ter sido modificado por outro usuário.';
    end if;

    -- Registra a ação para gamificação
    perform add_user_action(v_user_id, 'solve_problem', p_problem_id::text);

    -- Commit da transação
    commit;

    -- Retorna o problema atualizado
    return row_to_json(v_problem);

  exception
    when others then
      -- Rollback em caso de erro
      rollback;
      -- Relança o erro
      raise;
  end;
end;
$$ language plpgsql security definer;

-- Comentário para documentação
comment on function public.solve_problem is 
'Resolve um problema reportado.
Requer autenticação.
Validações:
- Usuário deve estar autenticado
- Problema deve existir e estar ativo
- Usuário não pode resolver seu próprio problema
- Problema não pode já ter um solucionador
Retorna o problema atualizado em formato JSON.
Registra a ação para gamificação automaticamente.';

commit;