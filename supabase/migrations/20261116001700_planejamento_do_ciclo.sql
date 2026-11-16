-- Planejamento do ciclo: a diretoria monta o cronograma do próximo ciclo em rascunho
-- (aulas, eventos, professores e convites) e publica para os ligantes quando estiver pronto.
-- Qualquer membro da diretoria planeja (decisão de novembro de 2026); o conselho lê.

-- Cronograma publicado: enquanto falso, as aulas e os eventos do ciclo são rascunho.
alter table public.ciclos add column cronograma_publicado boolean not null default false;
update public.ciclos set cronograma_publicado = true where status <> 'planejado';

-- Eventos em rascunho ficam fora do calendário e do cronograma dos ligantes.
alter table public.eventos add column publicado boolean not null default true;

drop policy eventos_ler on public.eventos;
create policy eventos_ler on public.eventos for select to authenticated
  using (publicado and (select privado.is_membro()));
create policy eventos_conselho_ler on public.eventos for select to authenticated
  using ((select privado.is_conselheiro()));

-- Dados internos do planejamento de cada aula: andamento do convite e notas da diretoria.
-- Ficam fora de `aulas`, que os ligantes leem.
create type public.status_convite as enum ('a_convidar', 'convidado', 'confirmado', 'recusou');

create table public.aula_planejamento (
  aula_id         uuid primary key references public.aulas (id) on delete cascade,
  status_convite  public.status_convite not null default 'a_convidar',
  notas           text,
  atualizado_em   timestamptz not null default now()
);

alter table public.aula_planejamento enable row level security;
create policy aula_planejamento_ler on public.aula_planejamento for select to authenticated
  using ((select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy aula_planejamento_gerir on public.aula_planejamento for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
