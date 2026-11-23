-- Plataforma completa (novembro de 2026): e-mails fora da lista pública de membros,
-- pastas do Drive em ciclos, aulas e competições, e produção com autores, revisores e entregas.

-- ───────────── 1. E-mails de acesso em tabela própria ─────────────
-- Todo membro passa a ver o nome e o papel dos colegas (tira-dúvidas, equipes, produção),
-- mas só a diretoria e o conselho veem os e-mails. Cada um vê o próprio.
create table public.membros_acesso (
  membro_id  uuid primary key references public.membros (id) on delete cascade,
  email      text not null unique check (email = lower(email))
);

insert into public.membros_acesso (membro_id, email)
select id, email from public.membros where email is not null;

alter table public.membros_acesso enable row level security;
create policy membros_acesso_ler on public.membros_acesso for select to authenticated
  using (membro_id = (select privado.membro_atual_id())
         or (select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy membros_acesso_gerir on public.membros_acesso for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

-- Os gatilhos de cadastro passam a consultar a nova tabela.
create or replace function privado.validar_novo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.membros_acesso a
                 join public.membros m on m.id = a.membro_id
                 where a.email = lower(new.email) and m.ativo) then
    raise exception 'E-mail fora da lista de membros da LDS-FDR';
  end if;
  return new;
end $$;

create or replace function privado.vincular_membro()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.membros m set user_id = new.id
  from public.membros_acesso a
  where a.membro_id = m.id and a.email = lower(new.email) and m.user_id is null;
  return new;
end $$;

alter table public.membros drop column email;

drop policy membros_ver on public.membros;
create policy membros_ver on public.membros for select to authenticated
  using (user_id = (select auth.uid()) or (select privado.is_membro()));

-- ───────────── 2. Pastas do Drive ─────────────
alter table public.ciclos add column descricao text, add column pasta_url text;
alter table public.aulas add column pasta_url text;
alter table public.competicoes add column pasta_url text;

-- A biblioteca aceita links do Drive e de fontes oficiais (Planalto, CVM).
alter table public.biblioteca_itens rename column drive_url to url;
alter table public.biblioteca_itens add constraint biblioteca_url_https check (url ~ '^https://');

-- ───────────── 3. Produção: participantes e entregas ─────────────
create type public.papel_producao as enum ('autor', 'revisor');

create table public.producao_participantes (
  producao_id  uuid not null references public.producoes (id) on delete cascade,
  membro_id    uuid not null references public.membros (id) on delete cascade,
  papel        public.papel_producao not null default 'autor',
  primary key (producao_id, membro_id, papel)
);
create index on public.producao_participantes (membro_id);

create table public.producao_entregas (
  id           uuid primary key default gen_random_uuid(),
  producao_id  uuid not null references public.producoes (id) on delete cascade,
  membro_id    uuid default privado.membro_atual_id() references public.membros (id) on delete set null,
  etapa        text not null check (etapa in ('rascunho', 'revisao', 'final')),
  link         text not null check (link ~ '^https://'),
  nota         text,
  criado_em    timestamptz not null default now()
);
create index on public.producao_entregas (producao_id);
create index on public.producao_entregas (membro_id);

alter table public.producoes add column link_publicado text check (link_publicado ~ '^https://');

create or replace function privado.participa_da_producao(p_producao uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.producao_participantes pp
                 where pp.producao_id = p_producao and pp.membro_id = privado.membro_atual_id())
$$;
revoke execute on function privado.participa_da_producao(uuid) from public, anon;
grant execute on function privado.participa_da_producao(uuid) to authenticated;

alter table public.producao_participantes enable row level security;
create policy producao_participantes_ler on public.producao_participantes for select to authenticated
  using ((select privado.is_membro()));
create policy producao_participantes_gerir on public.producao_participantes for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

alter table public.producao_entregas enable row level security;
create policy producao_entregas_ler on public.producao_entregas for select to authenticated
  using ((select privado.is_membro()));
-- Autores e revisores enviam as próprias entregas; a diretoria também pode registrar.
create policy producao_entregas_enviar on public.producao_entregas for insert to authenticated
  with check (
    (membro_id = (select privado.membro_atual_id())
     and (select privado.pode_participar())
     and privado.participa_da_producao(producao_id))
    or (select privado.is_diretoria())
  );
create policy producao_entregas_apagar on public.producao_entregas for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()) or (select privado.is_diretoria()));
