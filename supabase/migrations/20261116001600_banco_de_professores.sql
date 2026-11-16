-- Banco de professores: quem já deu ou pode dar aula na liga, com contato e histórico.
-- Área da diretoria: a diretoria cadastra e edita; o conselho lê; ligantes não têm acesso.
-- Os nomes e contatos ficam só no banco (nenhuma carga com pessoas vira migração).

create table public.professores (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null check (length(btrim(nome)) > 0),
  apresentacao   text,          -- formação e atuação; é o texto que vai para a página da aula
  instituicao    text,          -- escritório, universidade ou órgão
  temas          text,          -- assuntos que domina, em texto livre
  email          text check (email is null or email ~ '^[^@[:space:]]+@[^@[:space:]]+$'),
  telefone       text,
  linkedin       text check (linkedin is null or linkedin ~ '^https://'),
  observacoes    text,          -- notas internas da diretoria (quem indicou, preferências)
  disponivel     boolean not null default true,  -- falso: não convidar por enquanto
  criado_por     uuid default privado.membro_atual_id() references public.membros (id) on delete set null,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index on public.professores (criado_por);
create index on public.professores (lower(nome));

alter table public.professores enable row level security;
create policy professores_ler on public.professores for select to authenticated
  using ((select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy professores_gerir on public.professores for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

-- Cada aula pode apontar para o professor do banco. O nome e a apresentação continuam
-- copiados na própria aula (é o que os ligantes leem), porque o banco é só da diretoria.
alter table public.aulas add column professor_id uuid references public.professores (id) on delete set null;
create index on public.aulas (professor_id);
