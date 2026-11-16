-- Mural de oportunidades: vagas de estágio, cursos, eventos, concursos e conteúdos que chegam à liga.
-- Só a diretoria publica (decisão de novembro de 2026). Todo membro lê; ligantes e diretoria
-- marcam "Vou" quando a oportunidade pede lista de quem vai.

create type public.tipo_oportunidade as enum ('estagio', 'curso', 'evento', 'concurso', 'conteudo', 'outro');

create table public.oportunidades (
  id             uuid primary key default gen_random_uuid(),
  tipo           public.tipo_oportunidade not null default 'outro',
  titulo         text not null check (length(btrim(titulo)) > 0),
  organizacao    text,                         -- quem oferece: escritório, instituto, outra liga
  descricao      text not null,                -- o texto da divulgação
  link           text check (link is null or link ~ '^https://'),  -- inscrição ou mais informações
  contato        text,                         -- e-mail para currículo, telefone etc.
  local          text,                         -- endereço, "online", sala
  quando         timestamptz,                  -- data e hora do evento ou início do curso
  prazo          date,                         -- último dia para se inscrever ou enviar
  cartaz         text unique,                  -- caminho no bucket "mural": <uuid>.<ext>
  pede_lista     boolean not null default false, -- mostra o botão "Vou" e a lista para a diretoria
  vagas          int check (vagas is null or vagas > 0),
  fixada         boolean not null default false,
  publicada_por  uuid default privado.membro_atual_id() references public.membros (id) on delete set null,
  criado_em      timestamptz not null default now()
);
create index on public.oportunidades (publicada_por);
create index on public.oportunidades (prazo);

create table public.oportunidade_interessados (
  oportunidade_id  uuid not null references public.oportunidades (id) on delete cascade,
  membro_id        uuid not null default privado.membro_atual_id() references public.membros (id) on delete cascade,
  criado_em        timestamptz not null default now(),
  primary key (oportunidade_id, membro_id)
);
create index on public.oportunidade_interessados (membro_id);

-- Ainda cabe mais um na lista? (security definer: conta todos, não só as linhas visíveis.)
create or replace function privado.tem_vaga(p_oportunidade uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.oportunidades o
    where o.id = p_oportunidade and o.pede_lista
      and (o.vagas is null
           or (select count(*) from public.oportunidade_interessados i where i.oportunidade_id = o.id) < o.vagas)
  )
$$;
revoke execute on function privado.tem_vaga(uuid) from public, anon;
grant execute on function privado.tem_vaga(uuid) to authenticated;

alter table public.oportunidades enable row level security;
create policy oportunidades_ler on public.oportunidades for select to authenticated
  using ((select privado.is_membro()));
create policy oportunidades_gerir on public.oportunidades for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

-- A lista: todo membro vê quantos vão (os nomes a tela mostra só à diretoria e ao conselho);
-- cada um entra e sai da própria; a diretoria pode tirar qualquer um.
alter table public.oportunidade_interessados enable row level security;
create policy oportunidade_interessados_ler on public.oportunidade_interessados for select to authenticated
  using ((select privado.is_membro()));
create policy oportunidade_interessados_entrar on public.oportunidade_interessados for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id())
              and (select privado.pode_participar())
              and privado.tem_vaga(oportunidade_id));
create policy oportunidade_interessados_sair on public.oportunidade_interessados for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()) or (select privado.is_diretoria()));

-- Cartazes: bucket privado, imagens de até 5 MB. Membros veem; a diretoria envia e apaga.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mural', 'mural', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy mural_ler on storage.objects for select to authenticated
  using (bucket_id = 'mural' and (select privado.is_membro()));
create policy mural_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'mural' and (select privado.is_diretoria()));
create policy mural_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'mural' and (select privado.is_diretoria()));
