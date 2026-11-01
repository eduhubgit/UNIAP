-- =============================================================================
-- UNI AP - correção da recusa de interesse
-- Rode este bloco no SQL Editor (só precisa uma vez).
-- Antes: a recusa era gravada invertida e o app não conseguia enxergá-la,
-- então a pessoa recusada voltava a aparecer nos interessados.
-- =============================================================================

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

notify pgrst, 'reload schema';
