-- O serviço de autenticação precisa executar os gatilhos de auth.users que vivem no schema privado.
grant usage on schema privado to supabase_auth_admin;
grant execute on function privado.validar_novo_usuario(), privado.vincular_membro() to supabase_auth_admin;
