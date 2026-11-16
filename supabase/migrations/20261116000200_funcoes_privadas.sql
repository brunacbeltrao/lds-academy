-- Move as funções de apoio das políticas para um schema fora da API (privado).
-- Políticas e defaults referenciam funções por OID, então continuam valendo após o "set schema".
create schema if not exists privado;
grant usage on schema privado to authenticated;
revoke all on schema privado from anon, public;

alter function public.membro_atual_id()       set schema privado;
alter function public.is_membro()             set schema privado;
alter function public.is_diretoria()          set schema privado;
alter function public.is_da_equipe(uuid)      set schema privado;
alter function public.pode_ver_pergunta(uuid) set schema privado;
alter function public.validar_novo_usuario()  set schema privado;
alter function public.vincular_membro()       set schema privado;

-- Corpos que citavam public.* passam a citar privado.*
create or replace function privado.is_da_equipe(p_equipe uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.equipe_membros em
                 where em.equipe_id = p_equipe and em.membro_id = privado.membro_atual_id())
$$;

create or replace function privado.pode_ver_pergunta(p_pergunta uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perguntas p
                 where p.id = p_pergunta
                   and (privado.is_diretoria()
                        or p.autor_id = privado.membro_atual_id()
                        or (p.visibilidade = 'publica' and privado.is_membro())))
$$;

revoke execute on all functions in schema privado from public, anon;
grant execute on function privado.membro_atual_id(), privado.is_membro(), privado.is_diretoria(),
  privado.is_da_equipe(uuid), privado.pode_ver_pergunta(uuid) to authenticated;
