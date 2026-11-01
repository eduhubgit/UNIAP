-- =============================================================================
-- UNI AP - configuração do banco no Supabase
-- Rode este arquivo inteiro no SQL Editor do seu projeto.
-- É idempotente: pode executar mais de uma vez sem perder dados.
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- 1. TABELAS
-- =============================================================================

-- Perfil público (visível para todos os usuários logados).
create table if not exists public.profiles (
  id            uuid primary key,
  nome          text not null,
  idade         int,
  cidade        text not null default '',
  curso         text not null default 'Estudante',
  foto          text,
  sobre         text not null default '',
  observacoes   text not null default '',
  horarios      text[] not null default '{}',
  preferencias  text[] not null default '{}',
  faixa         text,
  tem_ap        boolean not null default false,
  online        boolean not null default false,
  is_mock       boolean not null default false,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Dados privados (só o próprio dono enxerga).
create table if not exists public.profiles_private (
  id             uuid primary key references public.profiles(id) on delete cascade,
  matricula      text not null default '',
  telefone       text not null default '',
  email          text not null default '',
  cpf            text not null default '',
  notificacoes   boolean not null default true,
  perfil_visivel boolean not null default true
);

-- Apartamento do usuário (1 por usuário).
create table if not exists public.apartments (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  endereco      text not null default '',
  bairro        text not null default '',
  cidade        text not null default '',
  referencia    text not null default '',
  aluguel       numeric(10,2) not null default 0,
  vagas_total   int not null default 1,
  vagas         int not null default 1,
  despesas      jsonb not null default '{}'::jsonb,
  outras        text not null default '',
  adendos       text not null default '',
  fotos         text[] not null default '{}',
  doc_nome      text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Interesses enviados (quem quer conversar com quem).
create table if not exists public.interests (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  mensagem   text,
  anuncio    jsonb,
  criado_em  timestamptz not null default now(),
  unique (from_user, to_user),
  check (from_user <> to_user)
);

-- Interesses recusados.
create table if not exists public.rejections (
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (from_user, to_user)
);

-- Conversas (user_a < user_b sempre).
create table if not exists public.chats (
  id            uuid primary key default gen_random_uuid(),
  user_a        uuid not null references public.profiles(id) on delete cascade,
  user_b        uuid not null references public.profiles(id) on delete cascade,
  produto       jsonb,
  vaga_ocupada  boolean not null default false,
  nao_lidas_a   int not null default 0,
  nao_lidas_b   int not null default 0,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

-- Mensagens das conversas.
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  sender     uuid not null references public.profiles(id) on delete cascade,
  texto      text not null default '',
  tipo       text not null default 'texto',
  ocupantes  uuid[] not null default '{}',
  criado_em  timestamptz not null default now()
);
create index if not exists messages_chat_idx on public.messages (chat_id, criado_em);

-- Anúncios do marketplace.
create table if not exists public.ads (
  id         uuid primary key default gen_random_uuid(),
  vendedor   uuid not null references public.profiles(id) on delete cascade,
  titulo     text not null,
  categoria  text not null,
  condicao   text not null,
  preco      numeric(10,2) not null default 0,
  emoji      text,
  descricao  text not null default '',
  detalhes   text not null default '',
  fotos      text[] not null default '{}',
  cidade     text not null default '',
  criado_em  timestamptz not null default now()
);
create index if not exists ads_criado_idx on public.ads (criado_em desc);

-- Favoritos de anúncios.
create table if not exists public.favorites (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  ad_id     uuid not null references public.ads(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (user_id, ad_id)
);

-- =============================================================================
-- 2. FUNÇÕES AUXILIARES
-- =============================================================================

create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

drop trigger if exists profiles_atualizado on public.profiles;
create trigger profiles_atualizado before update on public.profiles
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists apartments_atualizado on public.apartments;
create trigger apartments_atualizado before update on public.apartments
  for each row execute function public.tocar_atualizado_em();

drop trigger if exists chats_atualizado on public.chats;
create trigger chats_atualizado before update on public.chats
  for each row execute function public.tocar_atualizado_em();

-- Soma 1 no contador de não lidas de quem recebeu a mensagem.
create or replace function public.contar_nao_lida()
returns trigger language plpgsql as $$
declare
  v_chat public.chats;
begin
  select * into v_chat from public.chats where id = new.chat_id;
  if v_chat.id is null then
    return new;
  end if;

  if new.sender = v_chat.user_a then
    update public.chats set nao_lidas_b = nao_lidas_b + 1 where id = v_chat.id;
  else
    update public.chats set nao_lidas_a = nao_lidas_a + 1 where id = v_chat.id;
  end if;

  return new;
end $$;

drop trigger if exists messages_nao_lida on public.messages;
create trigger messages_nao_lida after insert on public.messages
  for each row execute function public.contar_nao_lida();

-- =============================================================================
-- 3. RPCs (regras de negócio)
-- =============================================================================

-- Cria a conversa entre o usuário logado e p_other. Só é permitido se:
--   * p_other demonstrou interesse no usuário logado, ou
--   * p_other é um perfil de demonstração (is_mock).
create or replace function public.iniciar_chat(
  p_other uuid,
  p_texto text default null,
  p_produto jsonb default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_a uuid;
  v_b uuid;
  v_chat uuid;
  v_texto text;
  v_permitido boolean;
begin
  if v_me is null then
    raise exception 'nao autenticado';
  end if;
  if p_other is null or p_other = v_me then
    raise exception 'pessoa invalida';
  end if;

  select (
    exists (select 1 from public.interests where from_user = p_other and to_user = v_me)
    or exists (select 1 from public.profiles where id = p_other and is_mock)
  ) into v_permitido;

  if not v_permitido then
    raise exception 'sem permissao para iniciar conversa';
  end if;

  v_a := least(v_me, p_other);
  v_b := greatest(v_me, p_other);

  select id into v_chat from public.chats where user_a = v_a and user_b = v_b;

  if v_chat is null then
    insert into public.chats (user_a, user_b, produto)
    values (v_a, v_b, p_produto)
    returning id into v_chat;
  elsif p_produto is not null then
    update public.chats set produto = coalesce(produto, p_produto) where id = v_chat;
  end if;

  if not exists (select 1 from public.messages where chat_id = v_chat) then
    select coalesce(p_texto, mensagem) into v_texto
      from public.interests
     where from_user = p_other and to_user = v_me;

    insert into public.messages (chat_id, sender, texto)
    values (v_chat, p_other, coalesce(v_texto, p_texto, 'Oi! Vamos conversar?'));
  end if;

  return v_chat;
end $$;

-- Retorna 'match' quando os dois já se interessaram, senão 'interesse'.
create or replace function public.criar_interesse(
  p_to uuid,
  p_mensagem text default null,
  p_anuncio jsonb default null
) returns text
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then
    raise exception 'nao autenticado';
  end if;
  if p_to = v_me then
    raise exception 'pessoa invalida';
  end if;

  insert into public.interests (from_user, to_user, mensagem, anuncio)
  values (v_me, p_to, nullif(p_mensagem, ''), p_anuncio)
  on conflict (from_user, to_user) do nothing;

  if exists (select 1 from public.interests where from_user = p_to and to_user = v_me) then
    perform public.iniciar_chat(p_to, null, p_anuncio);
    delete from public.interests
     where (from_user = v_me and to_user = p_to)
        or (from_user = p_to and to_user = v_me);
    return 'match';
  end if;

  return 'interesse';
end $$;

-- Aceita quem se interessou por mim: abre a conversa e remove o interesse.
create or replace function public.aceitar_interesse(p_from uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_chat uuid;
begin
  if v_me is null then raise exception 'nao autenticado'; end if;

  if not exists (select 1 from public.interests where from_user = p_from and to_user = v_me) then
    raise exception 'interesse inexistente';
  end if;

  v_chat := public.iniciar_chat(p_from, null, null);

  delete from public.interests where from_user = p_from and to_user = v_me;

  return v_chat;
end $$;

-- Recusa quem se interessou por mim.
-- A recusa é gravada como "eu recusei fulano" (from_user = eu), que é o
-- formato que o app lê (rejected) e que a política de RLS permite ver.
create or replace function public.recusar_interesse(p_from uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'nao autenticado'; end if;

  insert into public.rejections (from_user, to_user)
  values (v_me, p_from)
  on conflict do nothing;

  delete from public.interests where from_user = p_from and to_user = v_me;
end $$;

-- Desmarca um interesse que eu enviei.
create or replace function public.desfazer_interesse(p_to uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.interests where from_user = auth.uid() and to_user = p_to;
end $$;

-- Cria mensagem na conversa (o remetente é sempre o usuário logado).
create or replace function public.enviar_mensagem(
  p_chat uuid,
  p_texto text,
  p_tipo text default 'texto',
  p_ocupantes uuid[] default '{}'
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_msg uuid;
begin
  if v_me is null then raise exception 'nao autenticado'; end if;

  if not exists (
    select 1 from public.chats
     where id = p_chat and (user_a = v_me or user_b = v_me)
  ) then
    raise exception 'sem acesso a conversa';
  end if;

  insert into public.messages (chat_id, sender, texto, tipo, ocupantes)
  values (p_chat, v_me, coalesce(p_texto, ''), coalesce(p_tipo, 'texto'), coalesce(p_ocupantes, '{}'))
  returning id into v_msg;

  return v_msg;
end $$;

-- Zera as não lidas do usuário logado.
create or replace function public.marcar_lidas(p_chat uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
begin
  update public.chats
     set nao_lidas_a = case when user_a = v_me then 0 else nao_lidas_a end,
         nao_lidas_b = case when user_b = v_me then 0 else nao_lidas_b end
   where id = p_chat and (user_a = v_me or user_b = v_me);
end $$;

-- Liga/desliga "vaga ocupada" e acerta as vagas livres do apartamento.
create or replace function public.alternar_vaga(p_chat uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_chat public.chats;
  v_novo boolean;
begin
  if v_me is null then raise exception 'nao autenticado'; end if;

  select * into v_chat from public.chats
   where id = p_chat and (user_a = v_me or user_b = v_me);
  if v_chat.id is null then raise exception 'sem acesso a conversa'; end if;

  if not exists (select 1 from public.apartments where user_id = v_me) then
    raise exception 'sem apartamento';
  end if;

  v_novo := not v_chat.vaga_ocupada;

  if v_novo then
    update public.apartments
       set vagas = vagas - 1
     where user_id = v_me and vagas > 0;
    if not found then
      raise exception 'sem vagas';
    end if;
  else
    update public.apartments
       set vagas = least(vagas_total, vagas + 1)
     where user_id = v_me;
  end if;

  update public.chats set vaga_ocupada = v_novo where id = p_chat;
  return v_novo;
end $$;

-- Área de demonstração: faz um perfil de teste "aceitar" o interesse do usuário.
create or replace function public.simular_aceite(p_person uuid)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
  v_chat uuid;
begin
  if v_me is null then raise exception 'nao autenticado'; end if;
  if not exists (select 1 from public.profiles where id = p_person and is_mock) then
    raise exception 'perfil invalido';
  end if;

  insert into public.interests (from_user, to_user, mensagem)
  values (p_person, v_me, 'Aceitei seu interesse! Vamos conversar? 😊')
  on conflict (from_user, to_user) do update set mensagem = excluded.mensagem;

  v_chat := public.iniciar_chat(p_person, 'Aceitei seu interesse! Vamos conversar? 😊', null);

  delete from public.interests where from_user = p_person and to_user = v_me;

  return v_chat;
end $$;

-- Verifica se já existe conta com o e-mail (usado no cadastro).
create or replace function public.email_ja_existe(p_email text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return exists (
    select 1 from auth.users where lower(email) = lower(trim(p_email))
  );
end $$;

-- Exclui a conta do usuário logado (perfil + dados + login).
create or replace function public.excluir_minha_conta()
returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_me uuid := auth.uid();
begin
  if v_me is null then raise exception 'nao autenticado'; end if;

  delete from public.profiles where id = v_me;
  delete from auth.users where id = v_me;
end $$;

-- =============================================================================
-- 4. RLS (segurança por linha)
-- =============================================================================

alter table public.profiles         enable row level security;
alter table public.profiles_private enable row level security;
alter table public.apartments       enable row level security;
alter table public.interests        enable row level security;
alter table public.rejections       enable row level security;
alter table public.chats            enable row level security;
alter table public.messages         enable row level security;
alter table public.ads              enable row level security;
alter table public.favorites        enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles leitura" on public.profiles;
create policy "profiles leitura" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles inserir" on public.profiles;
create policy "profiles inserir" on public.profiles
  for insert to authenticated with check (id = auth.uid() and is_mock = false);

drop policy if exists "profiles atualizar" on public.profiles;
create policy "profiles atualizar" on public.profiles
  for update to authenticated
  using (id = auth.uid() and is_mock = false)
  with check (id = auth.uid() and is_mock = false);

drop policy if exists "profiles excluir" on public.profiles;
create policy "profiles excluir" on public.profiles
  for delete to authenticated using (id = auth.uid() and is_mock = false);

-- profiles_private ----------------------------------------------------------
drop policy if exists "privado leitura" on public.profiles_private;
create policy "privado leitura" on public.profiles_private
  for select to authenticated using (id = auth.uid());

drop policy if exists "privado inserir" on public.profiles_private;
create policy "privado inserir" on public.profiles_private
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "privado atualizar" on public.profiles_private;
create policy "privado atualizar" on public.profiles_private
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- apartments ----------------------------------------------------------------
drop policy if exists "ap leitura" on public.apartments;
create policy "ap leitura" on public.apartments
  for select to authenticated using (true);

drop policy if exists "ap inserir" on public.apartments;
create policy "ap inserir" on public.apartments
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "ap atualizar" on public.apartments;
create policy "ap atualizar" on public.apartments
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ap excluir" on public.apartments;
create policy "ap excluir" on public.apartments
  for delete to authenticated using (user_id = auth.uid());

-- interests -----------------------------------------------------------------
drop policy if exists "interesses leitura" on public.interests;
create policy "interesses leitura" on public.interests
  for select to authenticated
  using (from_user = auth.uid() or to_user = auth.uid());

drop policy if exists "interesses inserir" on public.interests;
create policy "interesses inserir" on public.interests
  for insert to authenticated with check (from_user = auth.uid());

drop policy if exists "interesses excluir" on public.interests;
create policy "interesses excluir" on public.interests
  for delete to authenticated using (from_user = auth.uid());

-- rejections ----------------------------------------------------------------
drop policy if exists "recusas leitura" on public.rejections;
create policy "recusas leitura" on public.rejections
  for select to authenticated using (from_user = auth.uid());

drop policy if exists "recusas inserir" on public.rejections;
create policy "recusas inserir" on public.rejections
  for insert to authenticated with check (from_user = auth.uid());

drop policy if exists "recusas excluir" on public.rejections;
create policy "recusas excluir" on public.rejections
  for delete to authenticated using (from_user = auth.uid());

-- chats (somente leitura direta; escrita via RPC) ---------------------------
drop policy if exists "chats leitura" on public.chats;
create policy "chats leitura" on public.chats
  for select to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

-- messages (somente leitura direta; escrita via RPC) ------------------------
drop policy if exists "mensagens leitura" on public.messages;
create policy "mensagens leitura" on public.messages
  for select to authenticated
  using (
    exists (
      select 1 from public.chats c
       where c.id = messages.chat_id
         and (c.user_a = auth.uid() or c.user_b = auth.uid())
    )
  );

-- ads -----------------------------------------------------------------------
drop policy if exists "anuncios leitura" on public.ads;
create policy "anuncios leitura" on public.ads
  for select to authenticated using (true);

drop policy if exists "anuncios inserir" on public.ads;
create policy "anuncios inserir" on public.ads
  for insert to authenticated with check (vendedor = auth.uid());

drop policy if exists "anuncios atualizar" on public.ads;
create policy "anuncios atualizar" on public.ads
  for update to authenticated
  using (vendedor = auth.uid()) with check (vendedor = auth.uid());

drop policy if exists "anuncios excluir" on public.ads;
create policy "anuncios excluir" on public.ads
  for delete to authenticated using (vendedor = auth.uid());

-- favorites -----------------------------------------------------------------
drop policy if exists "favoritos leitura" on public.favorites;
create policy "favoritos leitura" on public.favorites
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "favoritos inserir" on public.favorites;
create policy "favoritos inserir" on public.favorites
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "favoritos excluir" on public.favorites;
create policy "favoritos excluir" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

-- =============================================================================
-- 5. PERMISSÕES
-- =============================================================================

-- O RLS decide o que cada conta vê/edita; aqui liberamos o acesso às tabelas
-- para o papel "authenticated". Sem isso o PostgREST responde "permission
-- denied" mesmo com as políticas corretas.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

revoke all on function public.iniciar_chat(uuid, text, jsonb)      from public, anon;
revoke all on function public.criar_interesse(uuid, text, jsonb)   from public, anon;
revoke all on function public.aceitar_interesse(uuid)              from public, anon;
revoke all on function public.recusar_interesse(uuid)              from public, anon;
revoke all on function public.desfazer_interesse(uuid)             from public, anon;
revoke all on function public.enviar_mensagem(uuid, text, text, uuid[]) from public, anon;
revoke all on function public.marcar_lidas(uuid)                   from public, anon;
revoke all on function public.alternar_vaga(uuid)                  from public, anon;
revoke all on function public.simular_aceite(uuid)                 from public, anon;
revoke all on function public.email_ja_existe(text)                from public, anon;
revoke all on function public.excluir_minha_conta()                from public, anon;

grant execute on function public.email_ja_existe(text)                to anon;
grant execute on function public.iniciar_chat(uuid, text, jsonb)      to authenticated;
grant execute on function public.criar_interesse(uuid, text, jsonb)   to authenticated;
grant execute on function public.aceitar_interesse(uuid)              to authenticated;
grant execute on function public.recusar_interesse(uuid)              to authenticated;
grant execute on function public.desfazer_interesse(uuid)             to authenticated;
grant execute on function public.enviar_mensagem(uuid, text, text, uuid[]) to authenticated;
grant execute on function public.marcar_lidas(uuid)                   to authenticated;
grant execute on function public.alternar_vaga(uuid)                  to authenticated;
grant execute on function public.simular_aceite(uuid)                 to authenticated;
grant execute on function public.email_ja_existe(text)                to authenticated;
grant execute on function public.excluir_minha_conta()                to authenticated;

-- =============================================================================
-- 6. STORAGE (fotos)
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',      'avatars',      true),
  ('apartamentos', 'apartamentos', true),
  ('anuncios',     'anuncios',     true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "fotos leitura publica" on storage.objects;
create policy "fotos leitura publica" on storage.objects
  for select using (bucket_id in ('avatars', 'apartamentos', 'anuncios'));

drop policy if exists "fotos envio" on storage.objects;
create policy "fotos envio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars', 'apartamentos', 'anuncios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos atualizacao" on storage.objects;
create policy "fotos atualizacao" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('avatars', 'apartamentos', 'anuncios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "fotos remocao" on storage.objects;
create policy "fotos remocao" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('avatars', 'apartamentos', 'anuncios')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- 7. SEED: PERFIS DE DEMONSTRAÇÃO
-- =============================================================================

insert into public.profiles
  (id, nome, idade, cidade, curso, foto, sobre, observacoes, horarios, preferencias, faixa, tem_ap, online, is_mock)
values
  ('00000000-0000-4000-8000-000000000001', 'Mariana', 20, 'Quixadá - CE', 'Estudante de Computação',
   'https://randomuser.me/api/portraits/women/44.jpg',
   'Tranquila e focada nos estudos. Gosto de série e de cozinhar nos fins de semana.',
   'Prefiro um ambiente silencioso à noite.',
   array['estuda_noite','dorme_cedo'],
   array['organizada','silencio','nao_fuma','estudo'], '300a500', true, true, true),
  ('00000000-0000-4000-8000-000000000002', 'Rafael', 22, 'Quixadá - CE', 'Estudante de Engenharia Civil',
   'https://randomuser.me/api/portraits/men/32.jpg',
   'Sou de outra cidade e procuro um AP perto da faculdade. Gosto de futebol e de música.',
   '',
   array['estuda_manha','casa_fds'],
   array['perto_faculdade','cozinha','amigos'], '300a500', false, false, true),
  ('00000000-0000-4000-8000-000000000003', 'Beatriz', 21, 'Quixadá - CE', 'Estudante de Direito',
   'https://randomuser.me/api/portraits/women/68.jpg',
   'Organizada, gosto de casa limpa e de estudar em silêncio. Tenho um gato.',
   'Não fumo e prefiro quem também não fuma.',
   array['estuda_tarde','dorme_cedo'],
   array['organizada','silencio','nao_fuma','animais'], '500a800', true, true, true),
  ('00000000-0000-4000-8000-000000000004', 'Lucas', 23, 'Quixadá - CE', 'Estudante de Sistemas de Informação',
   'https://randomuser.me/api/portraits/men/75.jpg',
   'Trabalho meio período e estudo à noite. Calmo, gosto de jogos e de cozinhar.',
   'Chego tarde em alguns dias.',
   array['trabalha_dia','estuda_noite','dorme_tarde'],
   array['cozinha','silencio','organizada'], '300a500', false, true, true),
  ('00000000-0000-4000-8000-000000000005', 'Camila', 19, 'Quixadá - CE', 'Estudante de Psicologia',
   'https://randomuser.me/api/portraits/women/12.jpg',
   'Sociável e animada, adoro receber amigos. Também gosto de ter meu momento de estudo.',
   'Aceito animais!',
   array['estuda_tarde','recebe_visitas','casa_fds'],
   array['amigos','animais','cozinha','perto_faculdade'], '300a500', true, false, true),
  ('00000000-0000-4000-8000-000000000006', 'Thiago', 24, 'Quixadá - CE', 'Estudante de Engenharia de Produção',
   'https://randomuser.me/api/portraits/men/45.jpg',
   'Rotina puxada, quase sempre estudando. Procuro um lugar sossegado.',
   '',
   array['estuda_manha','dorme_cedo'],
   array['silencio','estudo','nao_fuma','organizada'], '500a800', false, true, true),
  ('00000000-0000-4000-8000-000000000007', 'Juliana', 22, 'Quixadá - CE', 'Estudante de Arquitetura',
   'https://randomuser.me/api/portraits/women/21.jpg',
   'Criativa e caseira. Gosto de plantas, de música baixinha e de manter tudo em ordem.',
   'Tenho horário flexível no fim de semana.',
   array['estuda_manha','dorme_cedo','casa_fds'],
   array['organizada','silencio','cozinha','nao_fuma'], '500a800', true, true, true),
  ('00000000-0000-4000-8000-000000000008', 'Eduardo', 24, 'Quixadá - CE', 'Estudante de Engenharia Elétrica',
   'https://randomuser.me/api/portraits/men/52.jpg',
   'Rotina corrida entre estágio e faculdade. Gosto de casa tranquila e de jogar bola no fim de semana.',
   'Fumo apenas na varanda.',
   array['trabalha_dia','estuda_noite','dorme_tarde'],
   array['amigos','cozinha','perto_faculdade'], '300a500', true, false, true),
  ('00000000-0000-4000-8000-000000000009', 'Isabela', 21, 'Quixadá - CE', 'Estudante de Enfermagem',
   'https://randomuser.me/api/portraits/women/33.jpg',
   'Calma, estudiosa e responsável com as contas. Procuro um lugar perto da faculdade.',
   'Tenho plantão em alguns fins de semana.',
   array['estuda_tarde','dorme_cedo'],
   array['organizada','silencio','nao_fuma','perto_faculdade'], '500a800', false, true, true),
  ('00000000-0000-4000-8000-000000000010', 'Pedro', 19, 'Quixadá - CE', 'Estudante de Medicina Veterinária',
   'https://randomuser.me/api/portraits/men/18.jpg',
   'Animado e tranquilo, adoro bichos e cozinhar. Sou novo na cidade e quero dividir um lugar legal.',
   'Tenho um cachorro pequeno.',
   array['estuda_manha','recebe_visitas','casa_fds'],
   array['animais','cozinha','amigos','perto_faculdade'], '300a500', false, false, true)
on conflict (id) do nothing;

insert into public.apartments
  (user_id, endereco, bairro, cidade, referencia, aluguel, vagas_total, vagas, despesas, outras, adendos, fotos)
values
  ('00000000-0000-4000-8000-000000000001', 'Rua Dr. Pinto Ferreira, 120', 'Centro', 'Quixadá - CE',
   'Próximo à praça', 900, 2, 1,
   '{"agua":true,"luz":true,"internet":true,"condominio":false,"gas":false}', '',
   'Apartamento com 2 quartos, mobiliado. Aceita animais pequenos.',
   array['https://picsum.photos/seed/ap1a/600/400','https://picsum.photos/seed/ap1b/600/400','https://picsum.photos/seed/ap1c/600/400']),
  ('00000000-0000-4000-8000-000000000003', 'Av. Plácido Castelo, 450', 'Planalto Universitário', 'Quixadá - CE',
   'Em frente ao campus', 1200, 3, 2,
   '{"agua":true,"luz":false,"internet":true,"condominio":true,"gas":false}', 'Limpeza semanal',
   'Quarto com ar-condicionado. Área de lazer no prédio.',
   array['https://picsum.photos/seed/ap3a/600/400','https://picsum.photos/seed/ap3b/600/400','https://picsum.photos/seed/ap3c/600/400']),
  ('00000000-0000-4000-8000-000000000005', 'Rua Padre Pedro, 88', 'Campo Velho', 'Quixadá - CE',
   'Perto do mercadinho', 750, 1, 1,
   '{"agua":true,"luz":true,"internet":false,"condominio":false,"gas":false}', '',
   'Casa ventilada, quintal pequeno. Vaga para 1 pessoa.',
   array['https://picsum.photos/seed/ap5a/600/400','https://picsum.photos/seed/ap5b/600/400','https://picsum.photos/seed/ap5c/600/400']),
  ('00000000-0000-4000-8000-000000000007', 'Rua José Jucá, 305', 'Alto São Francisco', 'Quixadá - CE',
   'Atrás da padaria', 1000, 3, 1,
   '{"agua":true,"luz":true,"internet":true,"condominio":false,"gas":true}', '',
   'Apartamento arejado, varanda com plantas. Quarto com guarda-roupa embutido.',
   array['https://picsum.photos/seed/ap7a/600/400','https://picsum.photos/seed/ap7b/600/400','https://picsum.photos/seed/ap7c/600/400']),
  ('00000000-0000-4000-8000-000000000008', 'Av. Jesus Maria José, 77', 'Centro', 'Quixadá - CE',
   'Ao lado da lotérica', 800, 2, 0,
   '{"agua":false,"luz":false,"internet":true,"condominio":false,"gas":false}', '',
   'Apartamento simples, sem móveis no quarto vago.',
   array['https://picsum.photos/seed/ap8a/600/400','https://picsum.photos/seed/ap8b/600/400','https://picsum.photos/seed/ap8c/600/400'])
on conflict (user_id) do nothing;

-- Interesses iniciais dos perfis de demonstração para contas novas.
-- Quem procura apê recebe interesse de quem tem apê (e vice-versa).
create or replace function public.semear_interesses_demo()
returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.is_mock then
    return new;
  end if;

  insert into public.interests (from_user, to_user, mensagem)
  select p.id, new.id, m.mensagem
    from public.profiles p
    join (values
      ('00000000-0000-4000-8000-000000000001'::uuid, 'Vamos conversar?'),
      ('00000000-0000-4000-8000-000000000005'::uuid, 'Oi! Vi seu perfil e achei bem legal. Topa conversar?'),
      ('00000000-0000-4000-8000-000000000007'::uuid, 'Oi! Gostei muito do seu perfil, vamos conversar sobre o apê?'),
      ('00000000-0000-4000-8000-000000000004'::uuid, 'Vamos conversar?'),
      ('00000000-0000-4000-8000-000000000009'::uuid, 'Oi! Tudo bem? Tenho interesse no seu apê. Ainda está disponível?'),
      ('00000000-0000-4000-8000-000000000010'::uuid, 'Opa! Vi seu perfil e achei bem legal. Topa conversar?')
    ) as m(id, mensagem) on m.id = p.id
   where p.is_mock
     and (case when new.tem_ap then not p.tem_ap else p.tem_ap end)
  on conflict (from_user, to_user) do nothing;

  return new;
end $$;

drop trigger if exists profiles_semear_demo on public.profiles;
create trigger profiles_semear_demo after insert on public.profiles
  for each row execute function public.semear_interesses_demo();

-- =============================================================================
-- 8. SEED: ANÚNCIOS DE DEMONSTRAÇÃO
-- =============================================================================

insert into public.ads (id, vendedor, titulo, categoria, condicao, preco, emoji, descricao, detalhes, fotos, cidade, criado_em)
values
  ('00000000-0000-4000-9000-0000000000a1','00000000-0000-4000-8000-000000000001','Geladeira Consul 340L','eletrodomesticos','Usado',1200,'🧊',
   'Geladeira em ótimo estado, funcionando perfeitamente. Ideal para quem mora sozinho ou divide apartamento.',
   'Geladeira Consul 340L, cor inox, frost free, 2 portas. Comprei há 2 anos e estou me mudando, por isso estou vendendo. Funciona perfeitamente, sem barulhos e sem vazamentos. Retirada no Centro de Quixadá. Aceito Pix.',
   '{}', 'Quixadá - CE', now() - interval '2 days'),
  ('00000000-0000-4000-9000-0000000000a2','00000000-0000-4000-8000-000000000003','Mesa de estudo','moveis','Usado',250,'📚',
   'Mesa de madeira com cadeira. Perfeita para estudos e trabalho. Super conservada!',
   'Mesa de madeira com 1,20 m de largura e uma gaveta, acompanhada de cadeira estofada preta. Bem conservada, sem riscos fundos. Ideal para quarto de estudante. Retirada no Planalto Universitário.',
   '{}', 'Quixadá - CE', now() - interval '3 days'),
  ('00000000-0000-4000-9000-0000000000a3','00000000-0000-4000-8000-000000000005','Cama de casal + colchão','moveis','Seminovo',450,'🛏️',
   'Cama de casal com colchão incluso. Usada por apenas 6 meses. Ótima qualidade!',
   'Cama de casal (138 cm) com colchão de espuma incluso. Usada por apenas 6 meses, sem manchas. Desmontável, fácil de transportar. Retirada no Campo Velho.',
   '{}', 'Quixadá - CE', now() - interval '4 days'),
  ('00000000-0000-4000-9000-0000000000a4','00000000-0000-4000-8000-000000000004','Bicicleta aro 29','outros','Usado',600,'🚲',
   'Bicicleta em ótimo estado, revisada recentemente. Ideal para o dia a dia ou lazer.',
   'Bicicleta aro 29 com 21 marchas, freios a disco e quadro de alumínio. Revisada recentemente (troca de pneus e corrente). Acompanha cadeado. Pode testar antes de comprar.',
   '{}', 'Quixadá - CE', now() - interval '7 days'),
  ('00000000-0000-4000-9000-0000000000a5','00000000-0000-4000-8000-000000000002','Micro-ondas Philco 20L','eletrodomesticos','Usado',280,'🍽️',
   'Micro-ondas funcionando perfeitamente. Marca: Philco. 20L.',
   'Micro-ondas Philco de 20 litros, 220V, com prato giratório incluso. Funciona perfeitamente e esquenta rápido. Vendo porque ganhei outro de presente.',
   '{}', 'Quixadá - CE', now() - interval '7 days'),
  ('00000000-0000-4000-9000-0000000000a6','00000000-0000-4000-8000-000000000006','Notebook Dell Inspiron i5','eletronicos','Usado',1900,'💻',
   'Core i5, 8GB de RAM e SSD de 256GB. Ótimo para estudar e programar.',
   'Notebook Dell Inspiron com Core i5 de 10ª geração, 8 GB de RAM, SSD de 256 GB e tela de 15,6". A bateria dura cerca de 4 horas. Acompanha o carregador original. Perfeito para os trabalhos da faculdade.',
   '{}', 'Quixadá - CE', now() - interval '1 days'),
  ('00000000-0000-4000-9000-0000000000a7','00000000-0000-4000-8000-000000000009','Fone Bluetooth com cancelamento de ruído','eletronicos','Seminovo',90,'🎧',
   'Pouco uso, na caixa original. Bateria dura até 20 horas.',
   'Fone over-ear Bluetooth 5.0 com microfone embutido, cancelamento de ruído e bateria de até 20 horas. Usado poucas vezes. Acompanha cabo de carregamento e caixa original.',
   '{}', 'Quixadá - CE', now() - interval '5 days'),
  ('00000000-0000-4000-9000-0000000000a8','00000000-0000-4000-8000-000000000009','Jaleco branco tamanho M','roupas','Seminovo',40,'🥼',
   'Jaleco branco de manga longa, usado em apenas um semestre.',
   'Jaleco de brim branco, manga longa, tamanho M, com bolsos frontais. Lavado e passado, sem manchas. Ideal para os cursos da área da saúde.',
   '{}', 'Quixadá - CE', now() - interval '6 days'),
  ('00000000-0000-4000-9000-0000000000a9','00000000-0000-4000-8000-000000000008','Livro Cálculo - Stewart (vol. 1)','livros','Usado',70,'📖',
   'Cálculo, volume 1, de James Stewart. Algumas anotações a lápis.',
   'Cálculo, volume 1, de James Stewart. Capa em ótimo estado, com algumas anotações a lápis que podem ser apagadas. Muito usado nas cadeiras de Cálculo 1 e 2.',
   '{}', 'Quixadá - CE', now() - interval '10 days'),
  ('00000000-0000-4000-9000-0000000000aa','00000000-0000-4000-8000-000000000010','Ventilador de coluna','eletrodomesticos','Usado',120,'🌀',
   'Ventilador com 3 velocidades. Funciona muito bem e é silencioso.',
   'Ventilador de coluna de 40 cm, 3 velocidades e inclinação ajustável. Funcionando perfeitamente e bem silencioso. Ótimo para os dias quentes de Quixadá. 220V.',
   '{}', 'Quixadá - CE', now() - interval '3 days'),
  ('00000000-0000-4000-9000-0000000000ab','00000000-0000-4000-8000-000000000001','Estante de livros','moveis','Usado',180,'🗄️',
   'Estante com 5 prateleiras, ótima para livros e decoração. Pequeno desgaste na lateral.',
   'Estante de MDF com 5 prateleiras (1,60 m de altura). Tem um pequeno desgaste na lateral, que não afeta o uso. Desmontável para facilitar o transporte.',
   '{}', 'Quixadá - CE', now() - interval '14 days'),
  ('00000000-0000-4000-9000-0000000000ac','00000000-0000-4000-8000-000000000004','Tênis casual nº 40','roupas','Seminovo',150,'👟',
   'Tênis casual tamanho 40, usado poucas vezes. Confortável e em ótimo estado.',
   'Tênis casual preto, tamanho 40, usado poucas vezes e higienizado. Solado em ótimo estado. Acompanha a caixa.',
   '{}', 'Quixadá - CE', now() - interval '8 days'),
  ('00000000-0000-4000-9000-0000000000ad','00000000-0000-4000-8000-000000000003','Kit de livros de Direito','livros','Usado',120,'⚖️',
   'Três livros usados na graduação, com poucas marcações.',
   'Kit com três livros usados na graduação em Direito: Direito Civil, Direito Constitucional e Introdução ao Estudo do Direito. Poucas marcações com marca-texto. Vendo juntos pelo preço indicado.',
   '{}', 'Quixadá - CE', now() - interval '20 days')
on conflict (id) do nothing;

-- =============================================================================
-- 9. REALTIME
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chats'
  ) then
    alter publication supabase_realtime add table public.chats;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'interests'
  ) then
    alter publication supabase_realtime add table public.interests;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ads'
  ) then
    alter publication supabase_realtime add table public.ads;
  end if;

  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'favorites'
  ) then
    alter publication supabase_realtime add table public.favorites;
  end if;
end $$;

-- Faz o PostgREST enxergar as tabelas/funções novas imediatamente.
notify pgrst, 'reload schema';
