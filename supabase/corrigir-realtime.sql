-- =============================================================================
-- UNI AP - correção do chat em tempo real (Realtime)
-- Rode este arquivo inteiro no SQL Editor do Supabase.
-- É idempotente: pode executar mais de uma vez.
--
-- Sintoma que isto corrige:
--   A mensagem é enviada, mas o outro usuário só vê depois de fechar/abrir o
--   chat (ou recarregar o app). Em outras palavras: o chat não "atualiza".
--
-- Causa mais comum: as tabelas chats/messages não estão na publicação
-- `supabase_realtime`, então o Supabase não envia os eventos para o app.
-- =============================================================================

-- 1) Diagnóstico: mostra o que está (ou não) publicado para Realtime.
select schemaname, tablename
  from pg_publication_tables
 where pubname = 'supabase_realtime'
 order by tablename;

-- 2) Garante a publicação com as tabelas usadas pelo chat.
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

  -- O app também escuta "profiles" (status online). Sem isto, só essa parte
  -- fica sem atualização — não é o que trava o chat, mas convém alinhar.
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- 3) Reaplica a política de leitura das mensagens.
--    O Realtime respeita o RLS: o usuário só recebe eventos de mensagens que
--    ele tem permissão de ler (ou seja, chats dos quais participa).
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

-- 4) Faz o PostgREST/Realtime enxergarem as mudanças imediatamente.
notify pgrst, 'reload schema';

-- 5) Verificação final: deve listar messages e chats.
select schemaname, tablename
  from pg_publication_tables
 where pubname = 'supabase_realtime'
 order by tablename;
