-- Conselheiro: lê tudo, não escreve nada.
create or replace function privado.is_conselheiro()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.papel = 'conselheiro')
$$;

-- Quem participa (pergunta, responde, justifica, favorita): ligantes e diretoria.
create or replace function privado.pode_participar()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m
                 where m.user_id = (select auth.uid()) and m.ativo and m.papel in ('ligante', 'diretoria'))
$$;

revoke execute on function privado.is_conselheiro(), privado.pode_participar() from public, anon;
grant execute on function privado.is_conselheiro(), privado.pode_participar() to authenticated;

-- Leitura do que antes só a diretoria (ou o próprio autor) via.
create policy membros_conselho_ler        on public.membros        for select to authenticated using ((select privado.is_conselheiro()));
create policy aulas_conselho_ler          on public.aulas          for select to authenticated using ((select privado.is_conselheiro()));
create policy equipes_conselho_ler        on public.equipes        for select to authenticated using ((select privado.is_conselheiro()));
create policy equipe_membros_conselho_ler on public.equipe_membros for select to authenticated using ((select privado.is_conselheiro()));
create policy perguntas_conselho_ler      on public.perguntas      for select to authenticated using ((select privado.is_conselheiro()));
create policy respostas_conselho_ler      on public.respostas      for select to authenticated using ((select privado.is_conselheiro()));
create policy presencas_conselho_ler      on public.presencas      for select to authenticated using ((select privado.is_conselheiro()));
create policy justificativas_conselho_ler on public.justificativas for select to authenticated using ((select privado.is_conselheiro()));
create policy ia_trechos_conselho_ler     on public.ia_trechos     for select to authenticated using ((select privado.is_conselheiro()));

-- Escrita: as políticas de participação passam a exigir ligante ou diretoria.
drop policy perguntas_criar on public.perguntas;
create policy perguntas_criar on public.perguntas for insert to authenticated
  with check (autor_id = (select privado.membro_atual_id()) and status = 'aberta'
              and (select privado.pode_participar()));

drop policy respostas_ligante on public.respostas;
create policy respostas_ligante on public.respostas for insert to authenticated
  with check (
    autor_id = (select privado.membro_atual_id())
    and origem = 'ligante' and status = 'pendente'
    and (select privado.pode_participar())
    and exists (select 1 from public.perguntas p where p.id = pergunta_id and p.visibilidade = 'publica')
  );

drop policy justificativas_enviar on public.justificativas;
create policy justificativas_enviar on public.justificativas for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and status = 'pendente'
              and decidida_por is null and decidida_em is null
              and (select privado.pode_participar()));

drop policy favoritos_proprios on public.favoritos;
create policy favoritos_proprios on public.favoritos for all to authenticated
  using (membro_id = (select privado.membro_atual_id()))
  with check (membro_id = (select privado.membro_atual_id()) and (select privado.pode_participar()));
