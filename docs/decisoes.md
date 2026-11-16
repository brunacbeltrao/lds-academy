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
- **Presença:** registrada; o diretor acadêmico aceita ou recusa justificativas. Limite de 3 faltas sem justificativa (ver `liga.md`).

## Decidido na Etapa 1 (fundação)

- **Stack:** Next.js na Vercel e Supabase (Postgres, Auth, RLS, pgvector). Tudo na nuvem.
- **Login:** link de acesso por e-mail, sem senha, restrito à lista de membros. Quem não está na lista não consegue criar conta: o banco recusa.
- **Identidade visual:** começou com o padrão de novembro de 2026 do design system (Playfair Display e Raleway) e foi substituída pela identidade própria para tela descrita mais abaixo.
- **Repositório:** sem PDFs, sem segredos e sem dados pessoais.
- **Supabase:** projeto `lds-academy`, região de São Paulo (`sa-east-1`), na organização pessoal da Bruna.

## Decidido depois da fundação

- **Conselheiros:** entram na plataforma com um papel próprio, que lê tudo em modo leitura (inclusive Gestão, perguntas privadas, equipes e frequência) e não escreve nada.
- **Conteúdo institucional:** aba "A Liga" (`/a-liga`), com o que é a liga, cargos, regras do Grupo de Estudos, eventos e Código de Conduta. O texto fica no código da página.
- **Justificativas:** aceitas antes ou depois da aula.
- **Ciclo 2026.2:** chama-se "Ciclo-base de Direito Societário", como no cronograma oficial.

- **Bibliografia das aulas:** cada aula tem professor, apresentação, bibliografia em texto e **anexos em PDF enviados à plataforma** (não links). Os arquivos ficam no Storage do Supabase, em bucket privado, e nunca no repositório. A Biblioteca geral segue prevista com links do Drive.
- **Produção:** nova área com o calendário dos carrosséis do Instagram (terças-feiras) e dos mini-artigos do LinkedIn (quinzenais, às segundas), com autores, prazos e orientações.
- **Visual:** a plataforma tem identidade própria para tela (ver `identidade-visual.md`): fonte Figtree, fundo bege da liga, vinho só como destaque. O design system da liga segue valendo para redes e apostila.
- **Cronograma real:** em 16/09 foi a aula de Acordo de Acionistas e em 23/09 a de Atos Constitutivos (invertidas em relação ao cronograma impresso). Houve uma aula extra de Litígios Societários numa sexta-feira.

- **Regularização:** aba da diretoria (conselho em leitura) com os documentos da liga em PDF, por categoria. Os arquivos ficam no Storage, em bucket privado próprio, fora do alcance dos ligantes.

- **Chamada:** fica na página de cada aula e abre no dia da aula. Entram todos os membros ativos que frequentam o Grupo de Estudos (ligantes e diretoria); o conselho só lê. Por enquanto, a diretoria marca "justificada" direto na chamada; o fluxo de justificativas enviadas pelo ligante virá com a Minha trajetória.
- **Depois da aula:** slides e apostila entram como links (Drive, Canva), não como arquivos; o resumo é texto livre.
- **Avisos:** publicados pela diretoria no próprio Início. Fixados aparecem no topo; dos demais, os quatro mais recentes ficam abertos e o resto em "Avisos anteriores". O nome de quem publicou não aparece, porque o ligante não lê a lista de membros.

## Em aberto

1. **A IA vai ler os PDFs do Drive?** Se sim, a base precisa dos arquivos em si, e não só de links. Disso depende também o modelo de embeddings: a coluna `ia_trechos.embedding` está sem dimensão fixa até essa escolha.
2. **Aceitar justificativas dá ao diretor acadêmico uma permissão própria: isso vira um nível?** Hoje qualquer membro da diretoria pode decidir.
3. **Em quanto tempo a diretoria valida uma resposta antes de a dúvida ficar parada?**
4. **Envio de e-mail do login.** O serviço de e-mail padrão do Supabase serve só para testes (poucos envios por hora). Antes de abrir aos ligantes, definir um serviço de envio próprio ou outro método de login.
5. **Proteção de acesso da Vercel.** O projeto está com a "Vercel Authentication" ligada em todos os endereços `vercel.app`: só entra quem está logado na conta da Vercel. Serve para a fase de construção, mas impede o acesso dos ligantes. Antes de abrir, definir entre um domínio próprio da liga ou liberar o endereço de produção.
6. **Faltas: avisos.** Definir o que a plataforma faz quando o membro se aproxima das três faltas sem justificativa (aviso ao membro, alerta à diretoria).
7. **Direitos autorais dos anexos.** Os PDFs de bibliografia ficam restritos aos membros, mas trechos e livros inteiros têm regras diferentes. Definir o que pode ser anexado.
8. **Edição da Produção.** O calendário de carrosséis e mini-artigos é só leitura; temas, autores, revisores e status ainda são alterados direto no banco. Falta a tela de edição para a diretoria.
9. **Datas a confirmar.** A aula extra de Litígios Societários foi registrada em 06/11 (data deduzida das mensagens). A aula de Atos Constitutivos teve dois professores e só um foi identificado.
