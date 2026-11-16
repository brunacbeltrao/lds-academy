# LDS Academy

Plataforma interna da Liga de Direito Societário e Mercado de Capitais da Faculdade de Direito do Recife (LDS·FDR). Tudo da liga em um só lugar, com acesso por papel.

@AGENTS.md

## Antes de mexer

Leia `docs/`: é a fonte das decisões de produto.

- `docs/sitemap.md`: as sete áreas do menu, a Gestão e o que cada uma contém.
- `docs/permissoes.md`: quem vê o quê (ligante × diretoria) e como isso vira RLS.
- `docs/decisoes.md`: o que está decidido e o que está em aberto. Não resolva um ponto em aberto por conta própria: pergunte.
- `docs/identidade-visual.md`: cores, fontes e regras de uso da marca.
- `docs/arquitetura.md`: stack, estrutura de pastas, login e operação.
- `docs/liga.md`: o que é a liga, cargos, regras do Grupo de Estudos e Código de Conduta.
- `docs/roteiro.md`: etapas feitas e por fazer.

## Regras fixas

1. **Nenhum PDF nem material da liga no repositório.** Os anexos das aulas ficam no Storage do Supabase (bucket privado) e o acervo geral no Drive. O `.gitignore` bloqueia `*.pdf`.
2. **Segredos só em variáveis de ambiente** (Vercel e Supabase). Nunca em código, commit, doc ou migração. O repositório é público. No navegador só entram a URL e a chave publicável do Supabase; chave de serviço, se um dia for necessária, só no servidor.
3. **Nenhum dado pessoal no repositório**: nomes e e-mails de membros, professores, autores e revisores vivem só no banco. Cargas de dados com nomes de pessoas não viram arquivo de migração.
4. **Toda tabela nasce com RLS ligado e políticas explícitas**, na mesma migração. Funções de apoio às políticas ficam no schema `privado`, fora da API. Depois de qualquer mudança de esquema, rode o verificador de segurança do Supabase (advisors) e zere os avisos.
5. **Toda mudança de estrutura do banco é uma migração** em `supabase/migrations/`, com o mesmo SQL aplicado no projeto. Não altere o banco sem gravar o arquivo.
6. **Permissão se confere no servidor e no banco.** Esconder um item do menu não é controle de acesso: a Gestão chama `exigirGestao()`, toda ação de escrita da gestão chama `exigirDiretoria()` e a RLS repete a regra. O conselheiro lê tudo e não escreve nada.
7. **Interface em português do Brasil**, clara e direta, sem emoji. Código (nomes de tabelas, rotas, funções de domínio) também em português.
8. **Visual**: siga `docs/identidade-visual.md`. Uma só fonte (Figtree), fundo claro, vinho só como destaque, sem títulos em serifa ou itálico, sem rótulos em caixa alta, sem faixa colorida lateral em cartões. Use as classes de `src/app/globals.css` e as peças de `src/components/ui.tsx`. Nunca redesenhar ou recolorir o brasão.

## Comandos

```bash
npm run dev     # desenvolvimento (precisa de .env.local; ver .env.example)
npm run build   # build de produção
npm run lint    # ESLint
```

## Fluxo de trabalho

- Trabalhe em um branch e abra um pull request para `main`. A Vercel publica um preview a cada push e a produção a cada merge em `main`.
- Antes de entregar: `npm run lint`, `npm run build` e uma conferência visual no computador e no celular (390px). Como as páginas exigem login, a parte visual fica em componentes que recebem os dados por parâmetro (`conteudo.tsx`), o que permite conferi-los com dados de exemplo numa página temporária.
