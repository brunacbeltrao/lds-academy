-- Fim do "acesso de diretoria" à parte do papel: as permissões da diretoria passam a
-- decorrer só do papel diretoria. Quem tinha o acesso volta a ser ligante comum.
-- A coluna fica inerte até o app publicado deixar de lê-la; sai numa migração seguinte.

create or replace function privado.is_diretoria()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.papel = 'diretoria')
$$;

create or replace function privado.is_diretor_academico()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.diretor_academico
                   and m.papel = 'diretoria')
$$;

create or replace function privado.ids_diretoria()
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(m.id), '{}') from public.membros m
   where m.ativo and m.papel = 'diretoria'
$$;

update public.membros set acesso_diretoria = false where acesso_diretoria;

comment on column public.membros.acesso_diretoria is
  'Descontinuada: não dá mais permissão nenhuma. Será removida.';
