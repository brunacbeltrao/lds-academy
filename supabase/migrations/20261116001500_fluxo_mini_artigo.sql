-- Fluxo do mini-artigo: tema, redação, rascunho, revisão, ajustes, conferência final e publicação.
-- A fase de cada artigo é calculada pelo banco a partir do que já aconteceu; ninguém a escreve à mão.

-- ───────────── Diretor acadêmico ─────────────
-- Designa o revisor, registra o parecer de revisor de fora, decide sobre "Reescrever" e faz a conferência final.
alter table public.membros add column diretor_academico boolean not null default false;
comment on column public.membros.diretor_academico is
  'Designa revisores e faz a conferência final dos mini-artigos. Só vale com permissões de diretoria.';

create or replace function privado.is_diretor_academico()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.diretor_academico
                   and (m.papel = 'diretoria' or m.acesso_diretoria))
$$;

create or replace function privado.tem_papel_na_producao(p_producao uuid, p_papel public.papel_producao)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.producao_participantes pp
                 where pp.producao_id = p_producao and pp.papel = p_papel
                   and pp.membro_id = privado.membro_atual_id())
$$;

revoke execute on function privado.is_diretor_academico(), privado.tem_papel_na_producao(uuid, public.papel_producao) from public, anon;
grant execute on function privado.is_diretor_academico(), privado.tem_papel_na_producao(uuid, public.papel_producao) to authenticated;

-- ───────────── Fase do artigo ─────────────
create type public.fase_artigo as enum ('tema', 'redacao', 'revisao', 'ajustes', 'decisao', 'conferencia', 'pronto', 'publicado');
create type public.conclusao_parecer as enum ('aprovado', 'aprovado_com_ajustes', 'reescrever');

alter table public.producoes
  add column fase                public.fase_artigo,   -- só artigos; calculada pelo banco
  add column tema_registrado_em  timestamptz,
  add column tema_recusado       text,                 -- último tema recusado pela diretoria acadêmica
  add column tema_recusa_motivo  text,
  add column publicado_em        timestamptz,
  alter column publicacao drop not null;               -- artigo de reserva: passa pelo fluxo sem data marcada

-- Os dados que já existem: publicado, em redação (com tema) ou à espera do tema.
update public.producoes
   set fase = case when status = 'publicado' then 'publicado'::public.fase_artigo
                   when tema is not null then 'redacao'::public.fase_artigo
                   else 'tema'::public.fase_artigo end,
       publicado_em = case when status = 'publicado' then (publicacao + time '10:00') at time zone 'America/Recife' end
 where tipo = 'artigo';
update public.producoes
   set status = case fase when 'publicado' then 'publicado'::public.status_producao
                          when 'redacao' then 'em_redacao'::public.status_producao
                          else 'a_definir'::public.status_producao end
 where tipo = 'artigo';

alter table public.producoes
  add constraint producoes_data_ou_reserva check (publicacao is not null or tipo = 'artigo'),
  add constraint producoes_fase_so_de_artigo check ((fase is not null) = (tipo = 'artigo'));

-- ───────────── Andamento do artigo (visível só ao grupo) ─────────────
-- Rascunho, parecer, ajustes e liberação. Lê quem escreve, quem revisa, a diretoria e o conselho.
create table public.artigo_andamento (
  producao_id        uuid primary key references public.producoes (id) on delete cascade,
  rascunho_link      text check (rascunho_link ~ '^https://'),
  rascunho_em        timestamptz,
  parecer_conclusao  public.conclusao_parecer,
  parecer_texto      text,
  parecer_em         timestamptz,
  parecer_por        uuid references public.membros (id) on delete set null,
  ajustes_pedidos    boolean not null default false,   -- o diretor pediu ajustes (após "Reescrever" ou na conferência)
  ajustes_em         timestamptz,
  liberado_em        timestamptz,
  liberado_por       uuid references public.membros (id) on delete set null,
  atualizado_em      timestamptz not null default now()
);
create index on public.artigo_andamento (parecer_por);
create index on public.artigo_andamento (liberado_por);

insert into public.artigo_andamento (producao_id)
select id from public.producoes where tipo = 'artigo';

alter table public.artigo_andamento enable row level security;
create policy artigo_andamento_ler on public.artigo_andamento for select to authenticated
  using ((select privado.is_diretoria()) or (select privado.is_conselheiro())
         or privado.participa_da_producao(producao_id));
-- A linha nasce com o artigo (gatilho); aqui só se atualiza. Quem altera cada campo, o gatilho confere.
create policy artigo_andamento_atualizar on public.artigo_andamento for update to authenticated
  using ((select privado.is_diretoria())
         or ((select privado.pode_participar()) and privado.participa_da_producao(producao_id)))
  with check ((select privado.is_diretoria())
              or ((select privado.pode_participar()) and privado.participa_da_producao(producao_id)));

-- Os autores atualizam a própria publicação (só o tema; o gatilho confere).
create policy producoes_autor_tema on public.producoes for update to authenticated
  using ((select privado.pode_participar()) and privado.tem_papel_na_producao(id, 'autor'))
  with check ((select privado.pode_participar()) and privado.tem_papel_na_producao(id, 'autor'));

-- Entregas (links de rascunho e arte): só o grupo da publicação, a diretoria e o conselho.
drop policy producao_entregas_ler on public.producao_entregas;
create policy producao_entregas_ler on public.producao_entregas for select to authenticated
  using ((select privado.is_diretoria()) or (select privado.is_conselheiro())
         or privado.participa_da_producao(producao_id));

-- ───────────── Cálculo da fase ─────────────
create or replace function privado.fase_do_artigo(p public.producoes, a public.artigo_andamento)
returns public.fase_artigo language sql immutable set search_path = '' as $$
  select (case
    when p.publicado_em is not null then 'publicado'
    when a.liberado_em is not null then 'pronto'
    when a.parecer_conclusao = 'aprovado_com_ajustes' or (a.ajustes_pedidos and a.parecer_conclusao is not null)
      then case when a.ajustes_em is not null then 'conferencia' else 'ajustes' end
    when a.parecer_conclusao = 'aprovado' then 'conferencia'
    when a.parecer_conclusao = 'reescrever' then 'decisao'
    when a.rascunho_em is not null then 'revisao'
    when p.tema is not null then 'redacao'
    else 'tema'
  end)::public.fase_artigo
$$;

-- ───────────── Gatilhos ─────────────
-- Conferências de permissão são puladas em operações internas (gatilho chamando gatilho)
-- e em manutenção direta no banco (sem usuário logado; o app sempre tem um).

create or replace function privado.producoes_antes_de_gravar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_andamento public.artigo_andamento;
  v_livres constant text[] := array['tema', 'tema_registrado_em', 'fase', 'status'];
  v_conferir constant boolean := pg_trigger_depth() = 1 and (select auth.uid()) is not null;
begin
  if v_conferir and tg_op = 'UPDATE' and not privado.is_diretoria() then
    if not privado.tem_papel_na_producao(new.id, 'autor') then
      raise exception 'Só a diretoria altera esta publicação.' using errcode = '42501';
    end if;
    if (to_jsonb(new) - v_livres) is distinct from (to_jsonb(old) - v_livres) then
      raise exception 'Os autores só registram o tema.' using errcode = '42501';
    end if;
    if new.tema is distinct from old.tema and old.fase not in ('tema', 'redacao') then
      raise exception 'O tema não muda depois da entrega do rascunho.' using errcode = '42501';
    end if;
  end if;

  if v_conferir and new.tipo = 'artigo' and not privado.is_diretor_academico() and (
       (tg_op = 'INSERT' and (new.revisor is not null or new.tema_recusado is not null))
    or (tg_op = 'UPDATE' and (new.revisor, new.tema_recusado, new.tema_recusa_motivo)
                              is distinct from (old.revisor, old.tema_recusado, old.tema_recusa_motivo))) then
    raise exception 'Só o diretor acadêmico designa o revisor e recusa temas.' using errcode = '42501';
  end if;

  if new.tipo = 'artigo' then
    if new.tema is distinct from (case when tg_op = 'UPDATE' then old.tema end) then
      new.tema_registrado_em := case when new.tema is null then null else now() end;
    end if;
    if tg_op = 'UPDATE' then
      select * into v_andamento from public.artigo_andamento where producao_id = new.id;
    end if;
    new.fase := privado.fase_do_artigo(new, v_andamento);
    new.status := (case new.fase
      when 'tema' then 'a_definir' when 'redacao' then 'em_redacao'
      when 'pronto' then 'pronto' when 'publicado' then 'publicado'
      else 'em_revisao' end)::public.status_producao;
  else
    new.fase := null;
  end if;
  return new;
end $$;

create trigger producoes_antes_de_gravar before insert or update on public.producoes
  for each row execute function privado.producoes_antes_de_gravar();

-- Todo artigo nasce com a linha de andamento.
create or replace function privado.producoes_depois_de_criar()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo = 'artigo' then
    insert into public.artigo_andamento (producao_id) values (new.id) on conflict do nothing;
  end if;
  return null;
end $$;

create trigger producoes_depois_de_criar after insert on public.producoes
  for each row execute function privado.producoes_depois_de_criar();

-- Quem altera cada parte do andamento; datas e autoria são carimbadas pelo banco.
create or replace function privado.artigo_andamento_antes_de_gravar()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old public.artigo_andamento;
  v_conferir constant boolean := pg_trigger_depth() = 1 and (select auth.uid()) is not null;
begin
  if tg_op = 'UPDATE' then
    v_old := old;
    if new.producao_id <> old.producao_id then
      raise exception 'Andamento inválido.' using errcode = '42501';
    end if;
  end if;

  if v_conferir then
    if (new.rascunho_link, new.ajustes_em) is distinct from (v_old.rascunho_link, v_old.ajustes_em)
       and not (privado.is_diretoria() or privado.tem_papel_na_producao(new.producao_id, 'autor')) then
      raise exception 'Só os autores enviam o rascunho e concluem os ajustes.' using errcode = '42501';
    end if;
    if (new.parecer_conclusao, new.parecer_texto) is distinct from (v_old.parecer_conclusao, v_old.parecer_texto)
       and not (privado.is_diretor_academico() or privado.tem_papel_na_producao(new.producao_id, 'revisor')) then
      raise exception 'Só o revisor designado (ou o diretor acadêmico, por ele) registra o parecer.' using errcode = '42501';
    end if;
    if (new.ajustes_pedidos, new.liberado_em) is distinct from (v_old.ajustes_pedidos, v_old.liberado_em)
       and not privado.is_diretor_academico() then
      raise exception 'Só o diretor acadêmico decide sobre a reescrita e libera a publicação.' using errcode = '42501';
    end if;
  end if;

  -- Carimbos: a primeira entrega vale para o prazo; corrigir o link não muda a data.
  if new.rascunho_link is null then
    new.rascunho_em := null;
  elsif v_old.rascunho_em is null then
    new.rascunho_em := now();
  else
    new.rascunho_em := v_old.rascunho_em;
  end if;
  if new.parecer_conclusao is null then
    new.parecer_em := null; new.parecer_por := null; new.parecer_texto := null;
  elsif (new.parecer_conclusao, new.parecer_texto) is distinct from (v_old.parecer_conclusao, v_old.parecer_texto) then
    new.parecer_em := now(); new.parecer_por := privado.membro_atual_id();
  else
    new.parecer_em := v_old.parecer_em; new.parecer_por := v_old.parecer_por;
  end if;
  if new.ajustes_em is not null and v_old.ajustes_em is null then
    new.ajustes_em := now();
  end if;
  if new.liberado_em is null then
    new.liberado_por := null;
  elsif v_old.liberado_em is null then
    new.liberado_em := now(); new.liberado_por := privado.membro_atual_id();
  else
    new.liberado_em := v_old.liberado_em; new.liberado_por := v_old.liberado_por;
  end if;
  new.atualizado_em := now();
  return new;
end $$;

create trigger artigo_andamento_antes_de_gravar before insert or update on public.artigo_andamento
  for each row execute function privado.artigo_andamento_antes_de_gravar();

-- Depois de cada mudança no andamento, a fase do artigo é recalculada.
create or replace function privado.artigo_andamento_depois_de_gravar()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.producoes set fase = fase where id = new.producao_id;
  return null;
end $$;

create trigger artigo_andamento_depois_de_gravar after insert or update on public.artigo_andamento
  for each row execute function privado.artigo_andamento_depois_de_gravar();

-- Revisor de artigo: só o diretor acadêmico designa; ninguém revisa o próprio texto.
create or replace function privado.participantes_conferir()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_linha public.producao_participantes := case when tg_op = 'DELETE' then old else new end;
  v_artigo constant boolean := exists (select 1 from public.producoes p where p.id = v_linha.producao_id and p.tipo = 'artigo');
begin
  if pg_trigger_depth() = 1 and (select auth.uid()) is not null
     and v_artigo and v_linha.papel = 'revisor' and not privado.is_diretor_academico() then
    raise exception 'Só o diretor acadêmico designa o revisor do artigo.' using errcode = '42501';
  end if;
  if tg_op <> 'DELETE' and exists (
       select 1 from public.producao_participantes pp
        where pp.producao_id = new.producao_id and pp.membro_id = new.membro_id and pp.papel <> new.papel) then
    raise exception 'Quem é autor não pode revisar o próprio texto.' using errcode = '23514';
  end if;
  return v_linha;
end $$;

create trigger participantes_conferir before insert or update or delete on public.producao_participantes
  for each row execute function privado.participantes_conferir();

revoke execute on function privado.fase_do_artigo(public.producoes, public.artigo_andamento),
  privado.producoes_antes_de_gravar(), privado.producoes_depois_de_criar(),
  privado.artigo_andamento_antes_de_gravar(), privado.artigo_andamento_depois_de_gravar(),
  privado.participantes_conferir() from public, anon, authenticated;
