-- Notificações no celular (Web Push).
--
-- Como funciona:
-- 1. Cada aparelho que ativa as notificações grava uma inscrição em inscricoes_push.
-- 2. Eventos do banco (aviso publicado, resposta validada, justificativa decidida etc.) e os
--    lembretes do dia (pg_cron, 9h em Recife) inserem linhas em notificacoes, só para quem tem
--    aparelho inscrito e não desligou aquela categoria em preferencias_notificacao.
-- 3. Cada inserção chama (pg_net) a Edge Function enviar-notificacoes, que esvazia a fila com a
--    chave privada VAPID (segredo da Edge Function) e marca o que foi enviado. Um job a cada
--    10 minutos repete o chamado para o que ficou pendente.
-- A função não recebe dados de quem a chama: só esvazia a fila. Chamá-la de fora não envia nada
-- que o banco já não tenha decidido enviar.
-- O conselho não recebe notificações (não participa; ver permissoes.md).

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

-- ───────────── Aparelhos inscritos ─────────────
create table public.inscricoes_push (
  id         uuid primary key default gen_random_uuid(),
  membro_id  uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  endpoint   text not null unique check (endpoint ~ '^https://'),
  p256dh     text not null,
  auth       text not null,
  aparelho   text check (aparelho is null or length(aparelho) <= 120),
  criado_em  timestamptz not null default now()
);
create index on public.inscricoes_push (membro_id);

alter table public.inscricoes_push enable row level security;
create policy inscricoes_push_ler on public.inscricoes_push for select to authenticated
  using (membro_id = (select privado.membro_atual_id()));
create policy inscricoes_push_criar on public.inscricoes_push for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));
create policy inscricoes_push_apagar on public.inscricoes_push for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()));

-- ───────────── Preferências ─────────────
create table public.preferencias_notificacao (
  membro_id      uuid primary key default privado.membro_atual_id() references public.membros (id) on delete cascade,
  avisos         boolean not null default true,  -- avisos da diretoria
  lembretes      boolean not null default true,  -- aula de amanhã, leitura, avaliação, prazos
  respostas      boolean not null default true,  -- tira-dúvidas e justificativas
  oportunidades  boolean not null default true,  -- mural de oportunidades
  fila           boolean not null default true,  -- só diretoria: o que espera decisão
  atualizado_em  timestamptz not null default now()
);

alter table public.preferencias_notificacao enable row level security;
create policy preferencias_notificacao_ler on public.preferencias_notificacao for select to authenticated
  using (membro_id = (select privado.membro_atual_id()));
create policy preferencias_notificacao_criar on public.preferencias_notificacao for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));
create policy preferencias_notificacao_editar on public.preferencias_notificacao for update to authenticated
  using (membro_id = (select privado.membro_atual_id()))
  with check (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));

-- ───────────── Fila de envio ─────────────
create type public.categoria_notificacao as enum ('avisos', 'lembretes', 'respostas', 'oportunidades', 'fila', 'teste');

create table public.notificacoes (
  id            uuid primary key default gen_random_uuid(),
  membro_id     uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  categoria     public.categoria_notificacao not null,
  titulo        text not null check (length(titulo) <= 120),
  corpo         text not null default '' check (length(corpo) <= 240),
  url           text not null default '/' check (url ~ '^/'),
  criada_em     timestamptz not null default now(),
  reservada_em  timestamptz,
  tentativas    smallint not null default 0,
  enviada_em    timestamptz
);
create index on public.notificacoes (membro_id);
create index notificacoes_pendentes_idx on public.notificacoes (criada_em) where enviada_em is null;

alter table public.notificacoes enable row level security;
-- Cada um vê as próprias. Quem cria é o banco (gatilhos e lembretes); o membro só cria o teste.
create policy notificacoes_ler on public.notificacoes for select to authenticated
  using (membro_id = (select privado.membro_atual_id()));
create policy notificacoes_testar on public.notificacoes for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and categoria = 'teste'
              and (select privado.pode_participar()));

-- Reserva um lote para envio (só a Edge Function, com a chave de serviço).
create or replace function public.reservar_notificacoes(p_limite int default 100)
returns setof public.notificacoes language sql security invoker set search_path = '' as $$
  update public.notificacoes n
     set reservada_em = now(), tentativas = n.tentativas + 1
   where n.id in (select f.id from public.notificacoes f
                   where f.enviada_em is null and f.tentativas < 5
                     and f.criada_em > now() - interval '1 day'
                     and (f.reservada_em is null or f.reservada_em < now() - interval '2 minutes')
                   order by f.criada_em
                   limit least(greatest(p_limite, 1), 200)
                   for update skip locked)
  returning n.*
$$;
revoke execute on function public.reservar_notificacoes(int) from public, anon, authenticated;
grant execute on function public.reservar_notificacoes(int) to service_role;

-- ───────────── Quem recebe ─────────────
-- Insere a notificação para os membros indicados que participam, têm aparelho e não desligaram a categoria.
create or replace function privado.notificar(p_membros uuid[], p_categoria public.categoria_notificacao,
                                             p_titulo text, p_corpo text, p_url text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notificacoes (membro_id, categoria, titulo, corpo, url)
  select m.id, p_categoria, left(p_titulo, 120), left(coalesce(p_corpo, ''), 240), coalesce(p_url, '/')
    from public.membros m
    left join public.preferencias_notificacao p on p.membro_id = m.id
   where m.id = any(p_membros) and m.ativo and m.papel <> 'conselheiro'
     and exists (select 1 from public.inscricoes_push i where i.membro_id = m.id)
     and case p_categoria
           when 'avisos' then coalesce(p.avisos, true)
           when 'lembretes' then coalesce(p.lembretes, true)
           when 'respostas' then coalesce(p.respostas, true)
           when 'oportunidades' then coalesce(p.oportunidades, true)
           when 'fila' then coalesce(p.fila, true)
           else true
         end
$$;

create or replace function privado.ids_participantes()
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(m.id), '{}') from public.membros m where m.ativo and m.papel <> 'conselheiro'
$$;

create or replace function privado.ids_diretoria()
returns uuid[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(m.id), '{}') from public.membros m
   where m.ativo and (m.papel = 'diretoria' or (m.acesso_diretoria and m.papel <> 'conselheiro'))
$$;

-- "Aula 07" / "aula extra"
create or replace function privado.rotulo_aula(p_numero int)
returns text language sql immutable set search_path = '' as $$
  select case when p_numero is null then 'Aula extra' else 'Aula ' || lpad(p_numero::text, 2, '0') end
$$;

-- ───────────── Disparo ─────────────
create or replace function privado.chamar_envio()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform net.http_post(
    url := 'https://hcogfswjtddiqcunhywo.supabase.co/functions/v1/enviar-notificacoes',
    body := '{}'::jsonb,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 10000
  );
end $$;

create or replace function privado.notificacoes_depois_de_inserir()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.chamar_envio();
  return null;
end $$;

create trigger depois_de_inserir after insert on public.notificacoes
  for each statement execute function privado.notificacoes_depois_de_inserir();

-- Repete o chamado se ficou algo pendente (rede, Edge Function fora do ar).
create or replace function privado.reenviar_pendentes()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.notificacoes where enviada_em is null and tentativas < 5
               and criada_em > now() - interval '1 day') then
    perform privado.chamar_envio();
  end if;
end $$;

-- ───────────── Eventos ─────────────
-- Aviso publicado: todos, menos quem publicou.
create or replace function privado.avisar_aviso()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.notificar(array_remove(privado.ids_participantes(), new.autor_id), 'avisos',
    case when new.fixado then 'Aviso importante: ' else 'Novo aviso: ' end || new.titulo, new.corpo, '/');
  return null;
end $$;
create trigger notificar after insert on public.avisos for each row execute function privado.avisar_aviso();

-- Oportunidade publicada: todos, menos quem publicou.
create or replace function privado.avisar_oportunidade()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform privado.notificar(array_remove(privado.ids_participantes(), new.publicada_por), 'oportunidades',
    'Nova oportunidade: ' || new.titulo,
    concat_ws(' · ', new.organizacao, case when new.prazo is not null then 'prazo ' || to_char(new.prazo, 'DD/MM') end),
    '/oportunidades/' || new.id);
  return null;
end $$;
create trigger notificar after insert on public.oportunidades for each row execute function privado.avisar_oportunidade();

-- Justificativa: a diretoria recebe a nova; o membro recebe a decisão.
create or replace function privado.avisar_justificativa()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_aula text;
begin
  select privado.rotulo_aula(a.numero) || ' · ' || a.titulo into v_aula from public.aulas a where a.id = new.aula_id;
  if tg_op = 'INSERT' then
    perform privado.notificar(array_remove(privado.ids_diretoria(), new.membro_id), 'fila',
      'Justificativa de falta para decidir', v_aula, '/gestao?aba=frequencia');
  elsif old.status = 'pendente' and new.status in ('aceita', 'recusada') then
    perform privado.notificar(array[new.membro_id], 'respostas',
      case when new.status = 'aceita' then 'Justificativa aceita' else 'Justificativa recusada' end, v_aula, '/trajetoria');
  end if;
  return null;
end $$;
create trigger notificar after insert or update of status on public.justificativas
  for each row execute function privado.avisar_justificativa();

-- Pergunta privada nova: a diretoria recebe.
create or replace function privado.avisar_pergunta()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.visibilidade = 'privada' then
    perform privado.notificar(array_remove(privado.ids_diretoria(), new.autor_id), 'fila',
      'Pergunta privada para responder', new.titulo, '/tira-duvidas/' || new.id);
  end if;
  return null;
end $$;
create trigger notificar after insert on public.perguntas for each row execute function privado.avisar_pergunta();

-- Respostas: validada avisa quem perguntou e quem respondeu; pendente avisa a diretoria; recusada avisa quem respondeu.
create or replace function privado.avisar_resposta()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_pergunta record;
begin
  select p.id, p.titulo, p.autor_id into v_pergunta from public.perguntas p where p.id = new.pergunta_id;
  if new.status = 'validada' and (tg_op = 'INSERT' or old.status is distinct from 'validada') then
    if v_pergunta.autor_id is distinct from new.autor_id then
      perform privado.notificar(array[v_pergunta.autor_id], 'respostas',
        'Sua pergunta foi respondida', v_pergunta.titulo, '/tira-duvidas/' || v_pergunta.id);
    end if;
    if new.origem = 'ligante' and new.autor_id is not null then
      perform privado.notificar(array[new.autor_id], 'respostas',
        'Sua resposta foi validada', v_pergunta.titulo, '/tira-duvidas/' || v_pergunta.id);
    end if;
  elsif new.status = 'recusada' and tg_op = 'UPDATE' and old.status is distinct from 'recusada'
        and new.origem = 'ligante' and new.autor_id is not null then
    perform privado.notificar(array[new.autor_id], 'respostas',
      'Sua resposta não foi validada', v_pergunta.titulo, '/tira-duvidas/' || v_pergunta.id);
  elsif new.status = 'pendente' and tg_op = 'INSERT' then
    perform privado.notificar(array_remove(privado.ids_diretoria(), new.autor_id), 'fila',
      'Resposta aguardando validação', v_pergunta.titulo, '/gestao?aba=fila');
  end if;
  return null;
end $$;
create trigger notificar after insert or update of status on public.respostas
  for each row execute function privado.avisar_resposta();

-- ───────────── Lembretes do dia (9h em Recife) ─────────────
create or replace function privado.lembretes_do_dia()
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_hoje date := (now() at time zone 'America/Recife')::date;
  r record;
  v_hora text;
begin
  -- Aula amanhã: quem não marcou a leitura recebe o lembrete da leitura; os demais, só o da aula.
  for r in
    select a.id, a.numero, a.titulo, a.data,
           (coalesce(btrim(a.bibliografia), '') <> '' or exists (select 1 from public.aula_materiais am where am.aula_id = a.id)) as tem_leitura
      from public.aulas a join public.ciclos c on c.id = a.ciclo_id and c.status = 'atual'
     where (a.data at time zone 'America/Recife')::date = v_hoje + 1
  loop
    v_hora := to_char(r.data at time zone 'America/Recife', 'FMHH24"h"MI');
    v_hora := regexp_replace(v_hora, 'h00$', 'h');
    if r.tem_leitura then
      perform privado.notificar(
        array(select u.id from unnest(privado.ids_participantes()) as u(id)
               where not exists (select 1 from public.leituras_feitas l where l.aula_id = r.id and l.membro_id = u.id)),
        'lembretes', 'Aula amanhã: ' || r.titulo, 'Às ' || v_hora || '. Já fez a leitura?',
        '/ciclos/aulas/' || r.id || '#bibliografia');
      perform privado.notificar(
        array(select l.membro_id from public.leituras_feitas l where l.aula_id = r.id),
        'lembretes', 'Aula amanhã: ' || r.titulo, 'Às ' || v_hora || '.', '/ciclos/aulas/' || r.id);
    else
      perform privado.notificar(privado.ids_participantes(), 'lembretes',
        'Aula amanhã: ' || r.titulo, 'Às ' || v_hora || '.', '/ciclos/aulas/' || r.id);
    end if;
  end loop;

  -- Aula de ontem: quem ainda não avaliou.
  for r in
    select a.id, a.titulo
      from public.aulas a join public.ciclos c on c.id = a.ciclo_id and c.status = 'atual'
     where (a.data at time zone 'America/Recife')::date = v_hoje - 1
  loop
    perform privado.notificar(
      array(select u.id from unnest(privado.ids_participantes()) as u(id)
             where not exists (select 1 from public.avaliacoes_aula av where av.aula_id = r.id and av.membro_id = u.id)),
      'lembretes', 'Como foi a aula de ontem?', r.titulo || '. Avalie em menos de um minuto.',
      '/ciclos/aulas/' || r.id || '#avaliacao');
  end loop;

  -- Produção com prazo amanhã: carrossel sem entrega; mini-artigo sem rascunho.
  for r in
    select p.id, p.tipo, p.numero, p.tema
      from public.producoes p
      left join public.artigo_andamento aa on aa.producao_id = p.id
     where p.entrega = v_hoje + 1 and p.status <> 'publicado'
       and ((p.tipo = 'carrossel' and not exists (select 1 from public.producao_entregas e where e.producao_id = p.id))
            or (p.tipo = 'artigo' and aa.rascunho_em is null))
  loop
    perform privado.notificar(
      array(select pp.membro_id from public.producao_participantes pp where pp.producao_id = r.id and pp.papel = 'autor'),
      'lembretes',
      case when r.tipo = 'carrossel' then 'Entrega amanhã: carrossel ' else 'Rascunho amanhã: artigo ' end || lpad(coalesce(r.numero, 0)::text, 2, '0'),
      coalesce(r.tema, 'Tema a definir'), '/producao/' || r.id);
  end loop;

  -- Oportunidade com prazo amanhã: quem marcou "Vou".
  for r in select o.id, o.titulo from public.oportunidades o where o.prazo = v_hoje + 1
  loop
    perform privado.notificar(
      array(select oi.membro_id from public.oportunidade_interessados oi where oi.oportunidade_id = r.id),
      'oportunidades', 'Prazo amanhã: ' || r.titulo, 'Último dia para se inscrever ou enviar.', '/oportunidades/' || r.id);
  end loop;

  -- Limpeza: o histórico de envio fica 30 dias.
  delete from public.notificacoes where criada_em < now() - interval '30 days';
end $$;

revoke execute on function privado.notificar(uuid[], public.categoria_notificacao, text, text, text),
  privado.ids_participantes(), privado.ids_diretoria(), privado.rotulo_aula(int),
  privado.chamar_envio(), privado.notificacoes_depois_de_inserir(), privado.reenviar_pendentes(),
  privado.avisar_aviso(), privado.avisar_oportunidade(), privado.avisar_justificativa(),
  privado.avisar_pergunta(), privado.avisar_resposta(), privado.lembretes_do_dia()
  from public, anon, authenticated;

select cron.schedule('lds-lembretes-do-dia', '0 12 * * *', 'select privado.lembretes_do_dia()');
select cron.schedule('lds-reenviar-notificacoes', '*/10 * * * *', 'select privado.reenviar_pendentes()');
