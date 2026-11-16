-- LDS Academy · Etapa 1 · Fundação
-- Esquema inicial, papéis (ligante e diretoria) e RLS em todas as tabelas.
-- Regra de ouro: toda tabela nova nasce com RLS ligado e políticas explícitas.

create extension if not exists vector with schema extensions;

-- ───────────────────────── Tipos ─────────────────────────
create type public.papel_membro as enum ('ligante', 'diretoria');
create type public.status_ciclo as enum ('planejado', 'atual', 'encerrado');
create type public.tipo_evento as enum ('aula', 'evento', 'competicao', 'prazo', 'outro');
create type public.tipo_item_biblioteca as enum ('doutrina', 'legislacao', 'jurisprudencia', 'apostila', 'artigo', 'slides', 'outro');
create type public.visibilidade_pergunta as enum ('publica', 'privada');
create type public.status_pergunta as enum ('aberta', 'respondida', 'arquivada');
create type public.origem_resposta as enum ('ligante', 'diretoria', 'ia');
create type public.status_resposta as enum ('rascunho', 'pendente', 'validada', 'recusada');
create type public.status_presenca as enum ('presente', 'falta', 'justificada');
create type public.status_justificativa as enum ('pendente', 'aceita', 'recusada');

-- ───────────────────────── Membros (lista oficial) ─────────────────────────
-- Só entra na plataforma quem está aqui, ativo. O vínculo com auth.users é feito no primeiro login.
create table public.membros (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text not null unique check (email = lower(email)),
  papel       public.papel_membro not null default 'ligante',
  ativo       boolean not null default true,
  user_id     uuid unique references auth.users (id) on delete set null,
  criado_em   timestamptz not null default now()
);

-- Funções de apoio às políticas (security definer evita recursão de RLS)
create or replace function public.membro_atual_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select m.id from public.membros m where m.user_id = (select auth.uid()) and m.ativo
$$;

create or replace function public.is_membro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.user_id = (select auth.uid()) and m.ativo)
$$;

create or replace function public.is_diretoria()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.papel = 'diretoria')
$$;

-- Bloqueia cadastro de quem não está na lista e vincula quem está.
create or replace function public.validar_novo_usuario()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.membros m where m.email = lower(new.email) and m.ativo) then
    raise exception 'E-mail fora da lista de membros da LDS-FDR';
  end if;
  return new;
end $$;

create or replace function public.vincular_membro()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.membros set user_id = new.id where email = lower(new.email) and user_id is null;
  return new;
end $$;

create trigger antes_de_criar_usuario before insert on auth.users
  for each row execute function public.validar_novo_usuario();
create trigger depois_de_criar_usuario after insert on auth.users
  for each row execute function public.vincular_membro();

revoke execute on function public.validar_novo_usuario() from public, anon, authenticated;
revoke execute on function public.vincular_membro() from public, anon, authenticated;

-- ───────────────────────── Ciclos e aulas ─────────────────────────
create table public.ciclos (
  id         uuid primary key default gen_random_uuid(),
  codigo     text not null unique,            -- ex.: 2026.2
  titulo     text not null,                   -- ex.: Introdução ao Societário
  inicio     date,
  fim        date,
  status     public.status_ciclo not null default 'planejado',
  criado_em  timestamptz not null default now()
);

create table public.aulas (
  id            uuid primary key default gen_random_uuid(),
  ciclo_id      uuid not null references public.ciclos (id) on delete cascade,
  numero        int,
  titulo        text not null,
  data          timestamptz,
  local         text,
  resumo        text,
  slides_url    text,
  apostila_url  text,
  publicada     boolean not null default false,
  criado_em     timestamptz not null default now()
);
create index on public.aulas (ciclo_id);

-- ───────────────────────── Biblioteca (só links do Drive) ─────────────────────────
create table public.biblioteca_itens (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  autor       text,
  tipo        public.tipo_item_biblioteca not null default 'outro',
  tema        text,
  ciclo_id    uuid references public.ciclos (id) on delete set null,
  drive_url   text not null,
  descricao   text,
  criado_por  uuid references public.membros (id) on delete set null,
  criado_em   timestamptz not null default now()
);
create index on public.biblioteca_itens (ciclo_id);
create index on public.biblioteca_itens (criado_por);

create table public.aula_leituras (
  aula_id      uuid not null references public.aulas (id) on delete cascade,
  item_id      uuid not null references public.biblioteca_itens (id) on delete cascade,
  obrigatoria  boolean not null default true,
  primary key (aula_id, item_id)
);
create index on public.aula_leituras (item_id);

create table public.favoritos (
  membro_id  uuid not null references public.membros (id) on delete cascade,
  item_id    uuid not null references public.biblioteca_itens (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  primary key (membro_id, item_id)
);
create index on public.favoritos (item_id);

-- ───────────────────────── Competições ─────────────────────────
create table public.competicoes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,                  -- ex.: Sociecap, CMNA
  edicao      text,
  descricao   text,
  edital_url  text,
  inicio      date,
  fim         date,
  criado_em   timestamptz not null default now()
);

create table public.equipes (
  id             uuid primary key default gen_random_uuid(),
  competicao_id  uuid not null references public.competicoes (id) on delete cascade,
  nome           text not null,
  criado_em      timestamptz not null default now()
);
create index on public.equipes (competicao_id);

create table public.equipe_membros (
  equipe_id  uuid not null references public.equipes (id) on delete cascade,
  membro_id  uuid not null references public.membros (id) on delete cascade,
  primary key (equipe_id, membro_id)
);
create index on public.equipe_membros (membro_id);

create or replace function public.is_da_equipe(p_equipe uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.equipe_membros em
                 where em.equipe_id = p_equipe and em.membro_id = public.membro_atual_id())
$$;

-- ───────────────────────── Calendário e avisos ─────────────────────────
create table public.eventos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  tipo           public.tipo_evento not null default 'evento',
  inicio         timestamptz not null,
  fim            timestamptz,
  local          text,
  descricao      text,
  ciclo_id       uuid references public.ciclos (id) on delete set null,
  aula_id        uuid references public.aulas (id) on delete cascade,
  competicao_id  uuid references public.competicoes (id) on delete cascade,
  criado_em      timestamptz not null default now()
);
create index on public.eventos (inicio);
create index on public.eventos (ciclo_id);
create index on public.eventos (aula_id);
create index on public.eventos (competicao_id);

create table public.avisos (
  id            uuid primary key default gen_random_uuid(),
  titulo        text not null,
  corpo         text not null,
  fixado        boolean not null default false,
  autor_id      uuid references public.membros (id) on delete set null,
  publicado_em  timestamptz not null default now()
);
create index on public.avisos (autor_id);

-- ───────────────────────── Tira-dúvidas ─────────────────────────
create table public.perguntas (
  id            uuid primary key default gen_random_uuid(),
  autor_id      uuid not null default public.membro_atual_id() references public.membros (id) on delete cascade,
  titulo        text not null,
  corpo         text not null,
  visibilidade  public.visibilidade_pergunta not null default 'publica',
  status        public.status_pergunta not null default 'aberta',
  ciclo_id      uuid references public.ciclos (id) on delete set null,
  tema          text,
  criado_em     timestamptz not null default now()
);
create index on public.perguntas (autor_id);
create index on public.perguntas (ciclo_id);

create table public.respostas (
  id            uuid primary key default gen_random_uuid(),
  pergunta_id   uuid not null references public.perguntas (id) on delete cascade,
  autor_id      uuid default public.membro_atual_id() references public.membros (id) on delete set null,
  origem        public.origem_resposta not null default 'ligante',
  corpo         text not null,
  status        public.status_resposta not null default 'pendente',
  validada_por  uuid references public.membros (id) on delete set null,
  validada_em   timestamptz,
  criado_em     timestamptz not null default now()
);
create index on public.respostas (pergunta_id);
create index on public.respostas (autor_id);
create index on public.respostas (validada_por);

-- Pode ver a pergunta? (usada pelas políticas de respostas)
create or replace function public.pode_ver_pergunta(p_pergunta uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.perguntas p
                 where p.id = p_pergunta
                   and (public.is_diretoria()
                        or p.autor_id = public.membro_atual_id()
                        or (p.visibilidade = 'publica' and public.is_membro())))
$$;

-- ───────────────────────── Minha trajetória ─────────────────────────
create table public.presencas (
  aula_id    uuid not null references public.aulas (id) on delete cascade,
  membro_id  uuid not null references public.membros (id) on delete cascade,
  status     public.status_presenca not null,
  registrada_em timestamptz not null default now(),
  primary key (aula_id, membro_id)
);
create index on public.presencas (membro_id);

create table public.justificativas (
  id            uuid primary key default gen_random_uuid(),
  aula_id       uuid not null references public.aulas (id) on delete cascade,
  membro_id     uuid not null default public.membro_atual_id() references public.membros (id) on delete cascade,
  motivo        text not null,
  status        public.status_justificativa not null default 'pendente',
  decidida_por  uuid references public.membros (id) on delete set null,
  decidida_em   timestamptz,
  criado_em     timestamptz not null default now()
);
create index on public.justificativas (aula_id);
create index on public.justificativas (membro_id);
create index on public.justificativas (decidida_por);

-- ───────────────────────── Base da IA (busca por similaridade) ─────────────────────────
-- A dimensão do vetor será fixada quando o modelo de embeddings for escolhido (ver docs/decisoes.md).
create table public.ia_trechos (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid references public.biblioteca_itens (id) on delete cascade,
  conteudo    text not null,
  metadados   jsonb not null default '{}'::jsonb,
  embedding   extensions.vector,
  criado_em   timestamptz not null default now()
);
create index on public.ia_trechos (item_id);

-- ───────────────────────── RLS ─────────────────────────
alter table public.membros          enable row level security;
alter table public.ciclos           enable row level security;
alter table public.aulas            enable row level security;
alter table public.biblioteca_itens enable row level security;
alter table public.aula_leituras    enable row level security;
alter table public.favoritos        enable row level security;
alter table public.competicoes      enable row level security;
alter table public.equipes          enable row level security;
alter table public.equipe_membros   enable row level security;
alter table public.eventos          enable row level security;
alter table public.avisos           enable row level security;
alter table public.perguntas        enable row level security;
alter table public.respostas        enable row level security;
alter table public.presencas        enable row level security;
alter table public.justificativas   enable row level security;
alter table public.ia_trechos       enable row level security;

-- Membros: cada um vê a própria linha; a diretoria vê e gere todas.
create policy membros_ver on public.membros for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_diretoria()));
create policy membros_gerir on public.membros for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

-- Conteúdo geral: todo membro lê; só a diretoria escreve.
create policy ciclos_ler on public.ciclos for select to authenticated using ((select public.is_membro()));
create policy ciclos_gerir on public.ciclos for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy aulas_ler on public.aulas for select to authenticated
  using ((publicada and (select public.is_membro())) or (select public.is_diretoria()));
create policy aulas_gerir on public.aulas for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy biblioteca_ler on public.biblioteca_itens for select to authenticated using ((select public.is_membro()));
create policy biblioteca_gerir on public.biblioteca_itens for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy aula_leituras_ler on public.aula_leituras for select to authenticated using ((select public.is_membro()));
create policy aula_leituras_gerir on public.aula_leituras for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy eventos_ler on public.eventos for select to authenticated using ((select public.is_membro()));
create policy eventos_gerir on public.eventos for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy avisos_ler on public.avisos for select to authenticated using ((select public.is_membro()));
create policy avisos_gerir on public.avisos for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

-- Favoritos: só os próprios.
create policy favoritos_proprios on public.favoritos for all to authenticated
  using (membro_id = (select public.membro_atual_id()))
  with check (membro_id = (select public.membro_atual_id()));

-- Competições: edital e prazos visíveis a todos; equipes só para quem está nelas e para a diretoria.
create policy competicoes_ler on public.competicoes for select to authenticated using ((select public.is_membro()));
create policy competicoes_gerir on public.competicoes for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy equipes_ler on public.equipes for select to authenticated
  using ((select public.is_diretoria()) or public.is_da_equipe(id));
create policy equipes_gerir on public.equipes for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

create policy equipe_membros_ler on public.equipe_membros for select to authenticated
  using ((select public.is_diretoria()) or public.is_da_equipe(equipe_id));
create policy equipe_membros_gerir on public.equipe_membros for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

-- Perguntas: públicas para todos os membros; privadas só para o autor e a diretoria.
create policy perguntas_ler on public.perguntas for select to authenticated
  using ((select public.is_diretoria())
         or autor_id = (select public.membro_atual_id())
         or (visibilidade = 'publica' and (select public.is_membro())));
create policy perguntas_criar on public.perguntas for insert to authenticated
  with check (autor_id = (select public.membro_atual_id()) and status = 'aberta');
create policy perguntas_diretoria on public.perguntas for update to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));
create policy perguntas_apagar on public.perguntas for delete to authenticated
  using ((select public.is_diretoria()));

-- Respostas: só aparecem depois de validadas; o autor vê as próprias; a diretoria vê tudo.
create policy respostas_ler on public.respostas for select to authenticated
  using ((select public.is_diretoria())
         or autor_id = (select public.membro_atual_id())
         or (status = 'validada' and public.pode_ver_pergunta(pergunta_id)));
create policy respostas_ligante on public.respostas for insert to authenticated
  with check (
    autor_id = (select public.membro_atual_id())
    and origem = 'ligante' and status = 'pendente'
    and exists (select 1 from public.perguntas p where p.id = pergunta_id and p.visibilidade = 'publica')
  );
create policy respostas_diretoria_criar on public.respostas for insert to authenticated
  with check ((select public.is_diretoria()));
create policy respostas_diretoria_gerir on public.respostas for update to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));
create policy respostas_diretoria_apagar on public.respostas for delete to authenticated
  using ((select public.is_diretoria()));

-- Presenças: cada um vê as suas; a diretoria registra.
create policy presencas_ler on public.presencas for select to authenticated
  using (membro_id = (select public.membro_atual_id()) or (select public.is_diretoria()));
create policy presencas_gerir on public.presencas for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

-- Justificativas: o ligante envia e acompanha as suas; a diretoria decide.
create policy justificativas_ler on public.justificativas for select to authenticated
  using (membro_id = (select public.membro_atual_id()) or (select public.is_diretoria()));
create policy justificativas_enviar on public.justificativas for insert to authenticated
  with check (membro_id = (select public.membro_atual_id()) and status = 'pendente'
              and decidida_por is null and decidida_em is null);
create policy justificativas_decidir on public.justificativas for update to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));

-- Base da IA: leitura pela diretoria (a IA usa a chave de serviço no servidor).
create policy ia_trechos_diretoria on public.ia_trechos for all to authenticated
  using ((select public.is_diretoria())) with check ((select public.is_diretoria()));
