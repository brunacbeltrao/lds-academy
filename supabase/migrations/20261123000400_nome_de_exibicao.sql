-- Nome de exibição: cada membro escolhe como o nome aparece na plataforma
-- (por exemplo, o sobrenome pelo qual é conhecido no lugar do último sobrenome do registro).
--
-- • nome_completo: o nome da lista oficial, mantido pela diretoria.
-- • nome_exibicao: como a pessoa quer aparecer; em branco, vale o nome completo.
-- • nome: o que a plataforma mostra, calculado pelo banco (nome de exibição ou, sem ele, o completo).
--   Todas as leituras de membros.nome passam a mostrar o nome escolhido, sem mudança no app.

alter table public.membros add column nome_completo text;
update public.membros set nome_completo = nome;
alter table public.membros alter column nome_completo set not null;

alter table public.membros add column nome_exibicao text
  constraint membros_nome_exibicao_tamanho check (nome_exibicao is null or char_length(nome_exibicao) between 2 and 80);

comment on column public.membros.nome_completo is 'Nome da lista oficial. Só a diretoria altera.';
comment on column public.membros.nome_exibicao is 'Como o membro quer que o nome apareça. O próprio membro e a diretoria alteram; em branco, vale o nome completo.';
comment on column public.membros.nome is 'Nome mostrado na plataforma: o de exibição ou, sem ele, o completo. Calculado pelo gatilho membros_antes_de_salvar.';

-- Gatilho: protege a linha e recalcula o nome mostrado.
create or replace function privado.membros_antes_de_salvar()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Pelo app, quem não é da diretoria só muda o próprio nome de exibição (a RLS limita à própria linha).
  -- diretor_academico fica de fora da comparação: é coluna calculada (vem do cargo).
  -- Chamadas internas (gatilho do primeiro acesso, painel do Supabase) não passam por aqui.
  if tg_op = 'UPDATE' and current_user = 'authenticated' and not privado.is_diretoria()
     and (to_jsonb(new) - 'nome_exibicao' - 'diretor_academico') is distinct from (to_jsonb(old) - 'nome_exibicao' - 'diretor_academico') then
    raise exception 'Você só pode alterar o seu nome de exibição.' using errcode = '42501';
  end if;

  -- Quem grava só `nome` (cadastro direto no banco, versão anterior do app) está gravando o nome completo.
  if tg_op = 'INSERT' and new.nome_completo is null then
    new.nome_completo := new.nome;
  elsif tg_op = 'UPDATE' and new.nome is distinct from old.nome and new.nome_completo is not distinct from old.nome_completo then
    new.nome_completo := new.nome;
  end if;

  new.nome_completo := btrim(new.nome_completo);
  new.nome_exibicao := nullif(regexp_replace(btrim(new.nome_exibicao), '\s+', ' ', 'g'), '');
  new.nome := coalesce(new.nome_exibicao, new.nome_completo);
  return new;
end $$;

revoke execute on function privado.membros_antes_de_salvar() from public, anon, authenticated;

create trigger membros_antes_de_salvar before insert or update on public.membros
  for each row execute function privado.membros_antes_de_salvar();

-- Escrita em membros: a diretoria cria, altera e apaga; cada membro altera a própria linha
-- (o gatilho limita ao nome de exibição). Uma política por ação, sem sobreposição.
drop policy membros_gerir on public.membros;
create policy membros_criar on public.membros for insert to authenticated
  with check ((select privado.is_diretoria()));
create policy membros_alterar on public.membros for update to authenticated
  using ((select privado.is_diretoria()) or (user_id = (select auth.uid()) and ativo))
  with check ((select privado.is_diretoria()) or (user_id = (select auth.uid()) and ativo));
create policy membros_apagar on public.membros for delete to authenticated
  using ((select privado.is_diretoria()));
