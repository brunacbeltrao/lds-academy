-- Uma só política de leitura por tabela nas tabelas novas (professores, aula_planejamento,
-- oportunidades) e em eventos: a escrita da diretoria vira políticas de insert, update e delete,
-- em vez de "for all", que também contava como leitura (aviso multiple_permissive_policies).
-- As regras de acesso não mudam.

-- professores: diretoria e conselho leem; a diretoria escreve.
drop policy professores_gerir on public.professores;
create policy professores_criar on public.professores for insert to authenticated
  with check ((select privado.is_diretoria()));
create policy professores_editar on public.professores for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy professores_apagar on public.professores for delete to authenticated
  using ((select privado.is_diretoria()));

-- aula_planejamento: diretoria e conselho leem; a diretoria escreve.
drop policy aula_planejamento_gerir on public.aula_planejamento;
create policy aula_planejamento_criar on public.aula_planejamento for insert to authenticated
  with check ((select privado.is_diretoria()));
create policy aula_planejamento_editar on public.aula_planejamento for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy aula_planejamento_apagar on public.aula_planejamento for delete to authenticated
  using ((select privado.is_diretoria()));

-- oportunidades: todo membro lê; a diretoria escreve.
drop policy oportunidades_gerir on public.oportunidades;
create policy oportunidades_criar on public.oportunidades for insert to authenticated
  with check ((select privado.is_diretoria()));
create policy oportunidades_editar on public.oportunidades for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy oportunidades_apagar on public.oportunidades for delete to authenticated
  using ((select privado.is_diretoria()));

-- eventos: membros leem os publicados; diretoria e conselho leem também os rascunhos.
drop policy eventos_ler on public.eventos;
drop policy eventos_conselho_ler on public.eventos;
drop policy eventos_gerir on public.eventos;
create policy eventos_ler on public.eventos for select to authenticated
  using ((publicado and (select privado.is_membro()))
         or (select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy eventos_criar on public.eventos for insert to authenticated
  with check ((select privado.is_diretoria()));
create policy eventos_editar on public.eventos for update to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));
create policy eventos_apagar on public.eventos for delete to authenticated
  using ((select privado.is_diretoria()));
