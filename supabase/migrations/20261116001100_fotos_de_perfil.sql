-- Foto de perfil: cada membro envia a sua; todo membro vê as dos colegas.
-- Arquivo no bucket privado "fotos", em <membro_id>/<uuid>.<ext>. A tabela guarda o caminho.
create table public.perfis (
  membro_id     uuid primary key references public.membros (id) on delete cascade,
  foto          text,
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;
create policy perfis_ler on public.perfis for select to authenticated
  using ((select privado.is_membro()));
create policy perfis_proprio_criar on public.perfis for insert to authenticated
  with check (membro_id = (select privado.membro_atual_id()));
create policy perfis_proprio_alterar on public.perfis for update to authenticated
  using (membro_id = (select privado.membro_atual_id()))
  with check (membro_id = (select privado.membro_atual_id()));
create policy perfis_proprio_apagar on public.perfis for delete to authenticated
  using (membro_id = (select privado.membro_atual_id()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy fotos_ler on storage.objects for select to authenticated
  using (bucket_id = 'fotos' and (select privado.is_membro()));
create policy fotos_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select privado.membro_atual_id())::text);
create policy fotos_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select privado.membro_atual_id())::text);
