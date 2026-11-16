-- Aulas: professor, bibliografia e anexos em PDF. Produção: carrosséis e mini-artigos.

-- ───────────── Aulas ─────────────
alter table public.aulas
  add column professor      text,   -- quem ministrou (texto livre; pode ser mais de uma pessoa)
  add column professor_bio  text,   -- apresentação do professor
  add column bibliografia   text;   -- leituras indicadas, em texto livre

-- Anexos da aula (PDFs da bibliografia). O arquivo fica no Storage, bucket privado "materiais".
create table public.aula_materiais (
  id           uuid primary key default gen_random_uuid(),
  aula_id      uuid not null references public.aulas (id) on delete cascade,
  titulo       text not null,
  arquivo      text not null unique,          -- caminho no bucket: aulas/<aula_id>/<uuid>.pdf
  tamanho      bigint,
  enviado_por  uuid default privado.membro_atual_id() references public.membros (id) on delete set null,
  criado_em    timestamptz not null default now()
);
create index on public.aula_materiais (aula_id);
create index on public.aula_materiais (enviado_por);

alter table public.aula_materiais enable row level security;
create policy aula_materiais_ler on public.aula_materiais for select to authenticated
  using ((select privado.is_membro()));
create policy aula_materiais_gerir on public.aula_materiais for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

-- Bucket privado: só PDF, até 50 MB por arquivo. Membros baixam; a diretoria envia e apaga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('materiais', 'materiais', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy materiais_ler on storage.objects for select to authenticated
  using (bucket_id = 'materiais' and (select privado.is_membro()));
create policy materiais_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'materiais' and (select privado.is_diretoria()));
create policy materiais_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'materiais' and (select privado.is_diretoria()));

-- ───────────── Produção de conteúdo ─────────────
create type public.tipo_producao as enum ('carrossel', 'artigo');
create type public.status_producao as enum ('a_definir', 'em_redacao', 'em_revisao', 'pronto', 'publicado', 'atrasado');

create table public.producoes (
  id              uuid primary key default gen_random_uuid(),
  ciclo_id        uuid references public.ciclos (id) on delete set null,
  tipo            public.tipo_producao not null,
  numero          int,
  tema            text,
  autores         text,          -- dupla ou trio, em texto livre
  revisor         text,
  inicio_redacao  date,
  entrega         date,          -- prazo do rascunho (artigo) ou da arte (carrossel)
  fim_revisao     date,
  publicacao      date not null,
  status          public.status_producao not null default 'a_definir',
  observacoes     text,
  criado_em       timestamptz not null default now()
);
create index on public.producoes (publicacao);
create index on public.producoes (ciclo_id);

alter table public.producoes enable row level security;
create policy producoes_ler on public.producoes for select to authenticated
  using ((select privado.is_membro()));
create policy producoes_gerir on public.producoes for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
