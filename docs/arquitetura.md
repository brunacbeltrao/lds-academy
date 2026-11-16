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
  components/               menu e esqueleto das áreas
  lib/
    membro.ts               getMembroAtual() e exigirDiretoria()
    navegacao.ts            itens do menu
    supabase/               clientes para servidor e proxy
supabase/migrations/        todo o esquema do banco, em ordem
docs/                       decisões de produto
```

## Login por lista de membros

1. A diretoria cadastra a pessoa em `membros` (e-mail em minúsculas, papel, ativo).
2. A pessoa informa o e-mail em `/login` e recebe um link de acesso.
3. No primeiro acesso, um gatilho em `auth.users` confere a lista: se o e-mail não está ativo em `membros`, o cadastro é recusado; se está, a conta é vinculada à linha do membro.
4. `/auth/callback` troca o código do link pela sessão, guardada em cookies.
5. Para tirar o acesso de alguém, basta marcar `ativo = false`: as políticas deixam de valer para a pessoa e o app encerra a sessão no acesso seguinte.

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

Tabelas: `membros`, `ciclos`, `aulas`, `aula_leituras`, `biblioteca_itens`, `favoritos`, `competicoes`, `equipes`, `equipe_membros`, `eventos`, `avisos`, `perguntas`, `respostas`, `presencas`, `justificativas`, `ia_trechos`. Regras de acesso em `permissoes.md`.
