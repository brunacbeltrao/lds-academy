-- Trilha de estudos: a ordem de aprendizado da liga (partes e tópicos, seguindo o livro de
-- referência), com os materiais de cada tópico e o progresso de cada membro.
-- O conteúdo (títulos e links do Drive) é carregado direto no banco, fora das migrações,
-- como o acervo: o repositório é público e os links dão acesso ao Drive da liga.

-- ───────────── Partes e tópicos ─────────────
create table public.trilha_partes (
  id         uuid primary key default gen_random_uuid(),
  ordem      int not null,
  titulo     text not null check (length(btrim(titulo)) > 0),
  descricao  text,
  criado_em  timestamptz not null default now()
);

create table public.trilha_topicos (
  id         uuid primary key default gen_random_uuid(),
  parte_id   uuid not null references public.trilha_partes (id) on delete cascade,
  ordem      int not null,
  titulo     text not null check (length(btrim(titulo)) > 0),
  leitura    text,   -- referência no livro: capítulo, parágrafos e páginas
  observacao text,   -- orientação curta da diretoria
  criado_em  timestamptz not null default now()
);
create index on public.trilha_topicos (parte_id);

-- Material de um tópico: uma aula da plataforma (aula_id) ou um link (pasta do Drive, vídeo).
create table public.trilha_materiais (
  id         uuid primary key default gen_random_uuid(),
  topico_id  uuid not null references public.trilha_topicos (id) on delete cascade,
  ordem      int not null default 0,
  rotulo     text,
  aula_id    uuid references public.aulas (id) on delete cascade,
  url        text check (url is null or url ~ '^https://'),
  check (aula_id is not null or url is not null)
);
create index on public.trilha_materiais (topico_id);
create index on public.trilha_materiais (aula_id);

-- ───────────── Progresso ─────────────
create table public.trilha_progresso (
  topico_id     uuid not null references public.trilha_topicos (id) on delete cascade,
  membro_id     uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  concluido_em  timestamptz not null default now(),
  primary key (topico_id, membro_id)
);
create index on public.trilha_progresso (membro_id);

-- ───────────── RLS ─────────────
alter table public.trilha_partes    enable row level security;
alter table public.trilha_topicos   enable row level security;
alter table public.trilha_materiais enable row level security;
alter table public.trilha_progresso enable row level security;

-- Conteúdo: todo membro lê; a diretoria escreve (uma política por ação).
create policy trilha_partes_ler on public.trilha_partes for select to authenticated using ((select privado.is_membro()));
create policy trilha_partes_criar on public.trilha_partes for insert to authenticated with check ((select privado.is_diretoria()));
create policy trilha_partes_editar on public.trilha_partes for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy trilha_partes_apagar on public.trilha_partes for delete to authenticated using ((select privado.is_diretoria()));

create policy trilha_topicos_ler on public.trilha_topicos for select to authenticated using ((select privado.is_membro()));
create policy trilha_topicos_criar on public.trilha_topicos for insert to authenticated with check ((select privado.is_diretoria()));
create policy trilha_topicos_editar on public.trilha_topicos for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy trilha_topicos_apagar on public.trilha_topicos for delete to authenticated using ((select privado.is_diretoria()));

create policy trilha_materiais_ler on public.trilha_materiais for select to authenticated using ((select privado.is_membro()));
create policy trilha_materiais_criar on public.trilha_materiais for insert to authenticated with check ((select privado.is_diretoria()));
create policy trilha_materiais_editar on public.trilha_materiais for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy trilha_materiais_apagar on public.trilha_materiais for delete to authenticated using ((select privado.is_diretoria()));

-- Progresso: cada um marca o seu; diretoria e conselho leem todos (o conselho não marca).
create policy trilha_progresso_ler on public.trilha_progresso for select to authenticated
  using (membro_id = (select privado.membro_atual_id())
         or (select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy trilha_progresso_marcar on public.trilha_progresso for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));
create policy trilha_progresso_desmarcar on public.trilha_progresso for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));
