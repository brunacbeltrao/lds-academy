-- Regularização: documentos da liga (estatuto, eleições, atas, registros), só para diretoria e conselho.
create type public.categoria_documento as enum ('estatuto', 'eleicoes', 'atas', 'registros', 'outros');

create table public.documentos (
  id              uuid primary key default gen_random_uuid(),
  titulo          text not null,
  categoria       public.categoria_documento not null default 'outros',
  descricao       text,
  data_documento  date,
  arquivo         text not null unique,          -- caminho no bucket "documentos": <uuid>.pdf
  tamanho         bigint,
  enviado_por     uuid default privado.membro_atual_id() references public.membros (id) on delete set null,
  criado_em       timestamptz not null default now()
);
create index on public.documentos (categoria);
create index on public.documentos (enviado_por);

alter table public.documentos enable row level security;
create policy documentos_ler on public.documentos for select to authenticated
  using ((select privado.is_diretoria()) or (select privado.is_conselheiro()));
create policy documentos_gerir on public.documentos for all to authenticated
  using ((select privado.is_diretoria())) with check ((select privado.is_diretoria()));

-- Bucket privado: só PDF, até 50 MB. A diretoria envia e apaga; diretoria e conselho leem.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy documentos_arquivo_ler on storage.objects for select to authenticated
  using (bucket_id = 'documentos' and ((select privado.is_diretoria()) or (select privado.is_conselheiro())));
create policy documentos_arquivo_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'documentos' and (select privado.is_diretoria()));
create policy documentos_arquivo_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'documentos' and (select privado.is_diretoria()));
