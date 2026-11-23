-- Cargos da diretoria: diretor-presidente, diretor vice-presidente, diretor acadêmico e
-- diretor de relações institucionais. O cargo é exibido no site e define quem é o diretor
-- acadêmico (que deixa de ser uma marcação à parte e passa a decorrer do cargo).
-- Quem ocupa cada cargo é gravado direto no banco, fora das migrações (o repositório é público).

create type public.cargo_diretoria as enum ('presidente', 'vice_presidente', 'academico', 'relacoes_institucionais');

alter table public.membros add column cargo_diretoria public.cargo_diretoria;

comment on column public.membros.cargo_diretoria is
  'Cargo na diretoria, para quem tem o papel diretoria. Um ocupante ativo por cargo. O cargo academico define o diretor acadêmico.';

-- Cargo só para associados diretores.
alter table public.membros add constraint membros_cargo_so_diretoria
  check (cargo_diretoria is null or papel = 'diretoria');

-- Um ocupante ativo por cargo.
create unique index membros_um_por_cargo on public.membros (cargo_diretoria)
  where cargo_diretoria is not null and ativo;

-- Diretor acadêmico passa a decorrer do cargo. Quem já estava marcado recebe o cargo antes
-- da troca da coluna, para a função não mudar de mãos. As funções que leem a coluna
-- (privado.is_diretor_academico e os gatilhos do mini-artigo) seguem iguais.
update public.membros set cargo_diretoria = 'academico'
  where diretor_academico and papel = 'diretoria' and ativo
    and not exists (select 1 from public.membros o where o.cargo_diretoria = 'academico' and o.ativo);

alter table public.membros drop column diretor_academico;
alter table public.membros add column diretor_academico boolean
  generated always as (coalesce(cargo_diretoria = 'academico', false)) stored;

comment on column public.membros.diretor_academico is
  'Calculada a partir do cargo (academico). Designa revisores e faz a conferência final dos mini-artigos.';
