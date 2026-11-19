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

## Instalação como app (PWA)

- `src/app/manifest.ts`: nome, cores, ícones (`public/icones/`, inclusive a versão adaptável do Android) e atalhos.
- `public/sw.js`: o service worker guarda só a página `public/offline.html`. Nenhuma página da plataforma fica no aparelho, porque todas exigem login e trazem dados dos membros. Registrado em produção por `src/components/registro-do-app.tsx`; o `next.config.ts` impede o cache do `sw.js`.
- `src/components/instalar-app.tsx`: convite para instalar, no Início (celular, pode ser dispensado) e no perfil. No Android e no computador abre o pedido do navegador; no iPhone mostra o caminho pelo Compartilhar.

## Notificações no celular (Web Push)

- O membro ativa em Meu perfil (`/conta`), aparelho por aparelho. O navegador inscreve o aparelho com a chave pública VAPID (`src/lib/notificacoes-formato.ts`) e a inscrição vai para `inscricoes_push`. No iPhone, só funciona no app instalado na tela de início (iOS 16.4 ou mais novo).
- Quem decide o que enviar é o banco: gatilhos em `avisos`, `oportunidades`, `justificativas`, `perguntas` e `respostas`, e a função `privado.lembretes_do_dia()`, agendada no pg_cron para as 9h de Recife. Elas gravam em `notificacoes` só para quem tem aparelho e não desligou a categoria (`preferencias_notificacao`).
- Cada gravação chama, pelo pg_net, a Edge Function `enviar-notificacoes` (`supabase/functions/`), que esvazia a fila com a chave privada VAPID e marca o que foi enviado. Um job do pg_cron a cada 10 minutos repete o chamado para o que ficou pendente. Inscrições expiradas são apagadas no envio, e o histórico fica 30 dias.
- A função não exige login (verify_jwt desligado) porque não recebe dados de quem chama: só envia o que o banco já colocou na fila.
- O service worker (`public/sw.js`) mostra a notificação e abre a página certa ao tocar nela.

## Cartazes do mural

Bucket privado `mural` (JPG, PNG ou WebP até 5 MB). Mesmo desenho dos anexos: o navegador envia direto ao Storage (só a diretoria pode) e uma ação registra a oportunidade. A imagem é servida por `/oportunidades/[id]/cartaz`, que confere o membro e redireciona para um link temporário de 10 minutos.

## Documentos da liga

Mesmo desenho dos anexos das aulas, em bucket privado separado (`documentos`), legível só pela diretoria e pelo conselho. Registro em `documentos`; download por `/documentos/[id]`.

## Dados que não passam pelo repositório

Nomes de membros, professores, autores e revisores ficam só no banco. Cargas de dados com nomes de pessoas são feitas direto no banco, sem arquivo de migração; migrações trazem só estrutura e dados sem pessoas (como o cronograma do ciclo).

## Variáveis de ambiente

| Variável | Onde | Observação |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel (todos os ambientes) e `.env.local` | Pública |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel (todos os ambientes) e `.env.local` | Pública por desenho; a proteção é a RLS |
| `VAPID_PRIVATE_KEY` | Supabase → Edge Functions → Secrets | Segredo. Chave privada das notificações, par da chave pública em `src/lib/notificacoes-formato.ts`. Se for trocada, as duas mudam juntas e os aparelhos precisam ativar de novo |

Não há chave de serviço no app. A Edge Function usa a do próprio ambiente do Supabase.

## Configuração feita fora do repositório

- **Supabase → Authentication → URL Configuration:** a "Site URL" e as "Redirect URLs" precisam conter o endereço do app na Vercel (com `/auth/callback`), senão o link do e-mail não volta para o site.
- **Vercel:** projeto `lds-academy` no time BRUNA, funções em São Paulo (`gru1`), produção no branch `main` e preview nos demais.
- **Lista de membros:** mantida direto no banco até existir a tela de Gestão.

## Banco

Tabelas: `membros`, `ciclos`, `aulas`, `aula_leituras`, `biblioteca_itens`, `favoritos`, `competicoes`, `equipes`, `equipe_membros`, `eventos`, `avisos`, `perguntas`, `respostas`, `presencas`, `justificativas`, `ia_trechos`, `aula_materiais`, `producoes`, `producao_participantes`, `producao_entregas`, `artigo_andamento`, `documentos`, `professores`, `aula_planejamento`, `oportunidades`, `oportunidade_interessados`, `leituras_feitas`, `avaliacoes_aula`, `inscricoes_push`, `preferencias_notificacao`, `notificacoes`. Regras de acesso em `permissoes.md`.
