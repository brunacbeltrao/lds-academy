# Decisões

## Decidido (mapa do site, novembro de 2026)

- **Tira-dúvidas:** o autor escolhe entre pergunta pública ou privada.
- **Pergunta pública:** qualquer ligante responde e a diretoria valida.
- **Pergunta privada:** vai direto à diretoria.
- **IA:** rascunha com base na biblioteca, e a resposta só aparece depois de validada.
- **Competições:** só a equipe selecionada acessa, com toda a diretoria acompanhando.
- **Biblioteca:** links do Drive, sem upload de livros.
- **Ciclos anteriores:** abertos a todos, como acervo por tema.
- **Diretoria:** sem níveis por enquanto.
- **Presença:** registrada; o diretor acadêmico aceita ou recusa justificativas. Limite de 3 faltas.

## Decidido na Etapa 1 (fundação)

- **Stack:** Next.js na Vercel e Supabase (Postgres, Auth, RLS, pgvector). Tudo na nuvem.
- **Login:** link de acesso por e-mail, sem senha, restrito à lista de membros. Quem não está na lista não consegue criar conta: o banco recusa.
- **Identidade visual:** padrão de novembro de 2026 do design system (vinho `#A7002E`, bege `#EBECE0`, Playfair Display e Raleway). O padrão anterior (Cormorant Garamond, Source Serif 4, Inter) não é usado.
- **Repositório:** sem PDFs, sem segredos e sem dados pessoais.
- **Supabase:** projeto `lds-academy`, região de São Paulo (`sa-east-1`), na organização pessoal da Bruna.

## Em aberto

1. **A IA vai ler os PDFs do Drive?** Se sim, a base precisa dos arquivos em si, e não só de links. Disso depende também o modelo de embeddings: a coluna `ia_trechos.embedding` está sem dimensão fixa até essa escolha.
2. **Aceitar justificativas dá ao diretor acadêmico uma permissão própria: isso vira um nível?** Hoje qualquer membro da diretoria pode decidir.
3. **Em quanto tempo a diretoria valida uma resposta antes de a dúvida ficar parada?**
4. **Envio de e-mail do login.** O serviço de e-mail padrão do Supabase serve só para testes (poucos envios por hora). Antes de abrir aos ligantes, definir um serviço de envio próprio ou outro método de login.
5. **Proteção de acesso da Vercel.** O projeto está com a "Vercel Authentication" ligada em todos os endereços `vercel.app`: só entra quem está logado na conta da Vercel. Serve para a fase de construção, mas impede o acesso dos ligantes. Antes de abrir, definir entre um domínio próprio da liga ou liberar o endereço de produção.
