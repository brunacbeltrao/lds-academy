-- Com as datas do acervo, aulas de ciclos encerrados passaram a ter data. Justificativa de falta
-- só vale para aula do ciclo em curso; a RLS repete a regra da página e da ação no servidor.
create or replace function privado.aula_do_ciclo_atual(p_aula uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.aulas a
                 join public.ciclos c on c.id = a.ciclo_id
                 where a.id = p_aula and c.status = 'atual')
$$;
revoke execute on function privado.aula_do_ciclo_atual(uuid) from public, anon;
grant execute on function privado.aula_do_ciclo_atual(uuid) to authenticated;

drop policy justificativas_enviar on public.justificativas;
create policy justificativas_enviar on public.justificativas for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()) and status = 'pendente'
              and decidida_por is null and decidida_em is null
              and (select privado.pode_participar())
              and privado.aula_do_ciclo_atual(aula_id));
