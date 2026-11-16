-- Acesso de diretoria independente do cargo: um membro pode aparecer como ligante
-- e ter as permissões da diretoria (por exemplo, quem mantém a plataforma).
alter table public.membros add column acesso_diretoria boolean not null default false;

comment on column public.membros.acesso_diretoria is
  'Dá as permissões da diretoria sem mudar o cargo exibido. Só a diretoria altera.';

create or replace function privado.is_diretoria()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo
                   and (m.papel = 'diretoria' or m.acesso_diretoria))
$$;
