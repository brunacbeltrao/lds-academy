-- Remove a coluna acesso_diretoria, sem efeito desde 20261123000200_sem_acesso_de_diretoria.
-- O app publicado já não a lê; as funções do banco também não.
alter table public.membros drop column acesso_diretoria;
