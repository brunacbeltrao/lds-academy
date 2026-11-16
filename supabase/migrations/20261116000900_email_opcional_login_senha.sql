-- Login por e-mail e senha (decisoes.md, novembro de 2026).
-- A lista oficial passa a aceitar membros ainda sem e-mail: o nome fica cadastrado e,
-- enquanto o e-mail não for informado pela diretoria, ninguém consegue criar conta por ele.
-- Os gatilhos de auth.users seguem iguais: só cria conta quem tem e-mail na lista, ativo.
alter table public.membros alter column email drop not null;

comment on column public.membros.email is
  'E-mail informado pela diretoria. Sem e-mail, o membro está na lista mas ainda não pode criar conta.';
