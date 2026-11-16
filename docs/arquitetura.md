# Arquitetura

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4), publicado na **Vercel**.
- **Supabase**: Postgres com RLS, Auth (link de acesso por e-mail) e pgvector para a busca por similaridade da IA do tira-dúvidas.

## Estrutura

```
src/
  proxy.ts                  renova a sessão e barra quem não está logado
  app/
    layout.tsx              fontes e metadados
    globals.css             tokens do design system
    login/                  tela e ação de login
    auth/callback, auth/sair
    (app)/                  área logada: layout com o menu e as páginas das áreas
  components/               menu, cronograma e peças de interface (ui.tsx)
  lib/
    membro.ts               getMembroAtual() e exigirDiretoria()
    navegacao.ts            itens do menu
    supabase/               clientes para servidor e proxy
supabase/migrations/        todo o esquema do banco, em ordem
docs/                       decisões de produto
```

## Login por lista de membros

1. A diretoria cadastra a pessoa em `membros` (nome, papel, ativo) e, quando tiver, o e-mail em minúsculas. Sem e-mail, o nome fica na lista mas ninguém cria conta por ele. A carga de nomes é feita direto no banco, nunca em migração.
2. No primeiro acesso, a pessoa abre a aba Primeiro acesso em `/login`, informa o e-mail e cria a senha.
3. Um gatilho em `auth.users` confere a lista: se o e-mail não está ativo em `membros`, o cadastro é recusado; se está, a conta é vinculada à linha do membro (e o papel vem dela).
4. Nos acessos seguintes, e-mail e senha. Trocar a senha: `/conta/senha` (ícone de chave no menu).
5. Esqueci a senha: o Supabase envia um link; `/auth/callback?proximo=/conta/senha` troca o código pela sessão e leva à tela de nova senha.
6. Para tirar o acesso de alguém, basta marcar `ativo = false`: as políticas deixam de valer para a pessoa e o app encerra a sessão no acesso seguinte.
7. No Supabase (Authentication → Sign In / Providers → Email), "Confirm email" fica desligado: a lista de membros já é a verificação, e assim o cadastro não depende do envio de e-mail.

## Anexos das aulas

- Bucket privado `materiais` no Storage do Supabase: só PDF, até 50 MB por arquivo.
- O envio vai direto do navegador ao Storage (a RLS só deixa a diretoria enviar), porque arquivos grandes não passam pelas funções da Vercel. Depois do envio, uma ação no servidor registra o anexo em `aula_materiais`.
- O download passa por `/materiais/[id]`, que confere o membro e redireciona para um link temporário de 60 segundos.

## Documentos da liga

Mesmo desenho dos anexos das aulas, em bucket privado separado (`documentos`), legível só pela diretoria e pelo conselho. Registro em `documentos`; download por `/documentos/[id]`.

## Dados que não passam pelo repositório

Nomes de membros, professores, autores e revisores ficam só no banco. Cargas de dados com nomes de pessoas são feitas direto no banco, sem arquivo de migração; migrações trazem só estrutura e dados sem pessoas (como o cronograma do ciclo).

## Variáveis de ambiente

| Variável | Onde | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (todos os ambientes) e `.env.local` | Pública |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel (todos os ambientes) e `.env.local` | Pública por desenho; a proteção é a RLS |

Não há chave de serviço no app nesta etapa.

## Configuração feita fora do repositório

- **Supabase → Authentication → URL Configuration:** a "Site URL" e as "Redirect URLs" precisam conter o endereço do app na Vercel (com `/auth/callback`), senão o link do e-mail não volta para o site.
- **Vercel:** projeto `lds-academy` no time BRUNA, funções em São Paulo (`gru1`), produção no branch `main` e preview nos demais.
- **Lista de membros:** mantida direto no banco até existir a tela de Gestão.

## Banco

Tabelas: `membros`, `ciclos`, `aulas`, `aula_leituras`, `biblioteca_itens`, `favoritos`, `competicoes`, `equipes`, `equipe_membros`, `eventos`, `avisos`, `perguntas`, `respostas`, `presencas`, `justificativas`, `ia_trechos`, `aula_materiais`, `producoes`, `documentos`. Regras de acesso em `permissoes.md`.
