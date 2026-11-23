-- Leitura feita e avaliação da aula.
-- leituras_feitas: o membro marca que fez a leitura de uma aula do ciclo em curso.
-- avaliacoes_aula: depois que a aula começa, o membro dá uma nota de 1 a 5 e, se quiser, um comentário.
-- Cada um lê e mexe só no que é seu; diretoria e conselho leem tudo (o conselho não escreve).
-- As telas da diretoria e do conselho mostram as avaliações sem o nome de quem avaliou;
-- o vínculo com o membro fica no banco para garantir uma avaliação por pessoa e permitir a correção.

-- A aula já começou (data e hora no passado).
create or replace function privado.aula_ja_comecou(p_aula uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.aulas a where a.id = p_aula and a.data is not null and a.data <= now())
$$;
revoke execute on function privado.aula_ja_comecou(uuid) from public, anon;
grant execute on function privado.aula_ja_comecou(uuid) to authenticated;

-- ───────────── Leituras feitas ─────────────
create table public.leituras_feitas (
  aula_id    uuid not null references public.aulas (id) on delete cascade,
  membro_id  uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  feita_em   timestamptz not null default now(),
  primary key (aula_id, membro_id)
);
create index on public.leituras_feitas (membro_id);

alter table public.leituras_feitas enable row level security;

create policy leituras_feitas_ler on public.leituras_feitas for select to authenticated
  using (membro_id = (select privado.membro_atual_id())
         or (select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy leituras_feitas_marcar on public.leituras_feitas for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id())
              and (select privado.pode_participar())
              and privado.aula_do_ciclo_atual(aula_id));
create policy leituras_feitas_desmarcar on public.leituras_feitas for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));

-- ───────────── Avaliações das aulas ─────────────
create table public.avaliacoes_aula (
  id             uuid primary key default gen_random_uuid(),
  aula_id        uuid not null references public.aulas (id) on delete cascade,
  membro_id      uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  nota           smallint not null check (nota between 1 and 5),
  comentario     text check (comentario is null or length(comentario) <= 1000),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  unique (aula_id, membro_id)
);
create index on public.avaliacoes_aula (membro_id);

alter table public.avaliacoes_aula enable row level security;

create policy avaliacoes_aula_ler on public.avaliacoes_aula for select to authenticated
  using (membro_id = (select privado.membro_atual_id())
         or (select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy avaliacoes_aula_criar on public.avaliacoes_aula for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id())
              and (select privado.pode_participar())
              and privado.aula_do_ciclo_atual(aula_id)
              and privado.aula_ja_comecou(aula_id));
create policy avaliacoes_aula_corrigir on public.avaliacoes_aula for update to authenticated
  using (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()))
  with check (membro_id = (select privado.membro_atual_id())
              and (select privado.pode_participar())
              and privado.aula_do_ciclo_atual(aula_id)
              and privado.aula_ja_comecou(aula_id));
