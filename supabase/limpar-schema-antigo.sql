-- =============================================================================
-- UNI AP - limpeza do schema antigo
-- Rode este arquivo UMA VEZ, antes do setup.sql.
-- Ele remove apenas as tabelas da tentativa anterior (schema em inglês).
-- =============================================================================

drop table if exists public.favorites  cascade;
drop table if exists public.messages   cascade;
drop table if exists public.interests  cascade;
drop table if exists public.apartments cascade;
drop table if exists public.profiles   cascade;

-- Recarrega o cache do PostgREST para o app enxergar as tabelas novas na hora.
notify pgrst, 'reload schema';
