# Decisões

## Decidido (mapa do site, novembro de 2026)

- **Tira-dúvidas:** o autor escolhe entre pergunta pública ou privada.
- **Pergunta pública:** qualquer ligante responde e a diretoria valida.
- **Pergunta privada:** vai direto à diretoria.
- **IA:** rascunha com base na biblioteca, e a resposta só aparece depois de validada.
- **Competições:** só a equipe selecionada acessa, com toda a diretoria acompanhando.
- **Biblioteca:** links do Drive, sem upload de livros.
- **Ciclos anteriores:** abertos a todos, como acervo por tema.
- **Diretoria:** sem níveis por enquanto. A exceção é a função de diretor acadêmico no fluxo do mini-artigo (ver abaixo).
- **Presença:** registrada; o diretor acadêmico aceita ou recusa justificativas. Limite de 3 faltas sem justificativa (ver `liga.md`).

## Decidido na Etapa 1 (fundação)

- **Stack:** Next.js na Vercel e Supabase (Postgres, Auth, RLS, pgvector). Tudo na nuvem.
- **Login:** e-mail e senha (novembro de 2026; substituiu o link por e-mail, que esbarrava no limite de envios). Só cria conta quem tem e-mail na lista de membros: a diretoria informa o e-mail de cada um, e o banco recusa os demais. Os nomes podem entrar na lista antes dos e-mails. O e-mail só é usado em Esqueci a senha.
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

- **Links do Drive:** biblioteca e acervo de ciclos apontam para o Drive original da liga (pasta "Grupo de Estudos", com a Biblioteca e os semestres, e a pasta do ciclo de M&A de 2025). Quando a pasta exata de uma aula não está visível na busca do Drive, o link leva à pasta do semestre. Os materiais de eventos e as competições ainda apontam para a cópia da diretoria, até a liga informar as pastas originais.

## Fluxo do mini-artigo (novembro de 2026)

Etapas: vaga aberta → tema → redação → rascunho → revisão → ajustes → conferência final → publicação. A fase de cada artigo é calculada pelo banco a partir do que já aconteceu.

- **Diretor acadêmico:** só ele designa o revisor, registra o parecer de revisor de fora, decide depois de um parecer "Reescrever" e faz a conferência final. É uma marcação na lista de membros (Gestão), válida só para quem tem permissões de diretoria. Abrir vagas, mudar datas e marcar como publicado ficam com qualquer membro da diretoria.
- **Revisor de fora da liga:** não entra no site. Recebe o link do Docs pelo diretor acadêmico, que registra o parecer por ele.
- **Rascunho:** entregue como link do Google Docs, com permissão de comentário. O site grava a data da primeira entrega e diz se foi no prazo ou com quantos dias de atraso.
- **Designação do revisor:** a qualquer momento, e cobrada até a entrega do rascunho, para a semana de revisão não começar sem revisor. Os autores não podem revisar o próprio texto.
- **Parecer "Reescrever":** o diretor acadêmico decide caso a caso: segue para ajustes na mesma semana ou volta para a redação, com novo prazo (e, se preciso, nova data de publicação).
- **Quem vê o andamento:** rascunho, parecer e ajustes só para a dupla, o revisor, a diretoria e o conselho. Os demais ligantes veem o calendário, o tema e a fase.
- **Tema:** a dupla registra na página do artigo; o site avisa se outro artigo já usou um tema parecido. O diretor acadêmico pode recusar, com motivo.
- **Reserva:** um artigo pode passar pelo fluxo sem data marcada, para cobrir uma vaga perdida.
- **Avisos:** enquanto não houver e-mail, cada pendência aparece em "Minhas pendências" (Início) e na fila da Produção.
- **Publicado:** o artigo aparece na Biblioteca, em "Artigos produzidos pela liga", com o link do LinkedIn.

## Em aberto

1. **A IA vai ler os PDFs do Drive?** Se sim, a base precisa dos arquivos em si, e não só de links. Disso depende também o modelo de embeddings: a coluna `ia_trechos.embedding` está sem dimensão fixa até essa escolha.
2. **Aceitar justificativas dá ao diretor acadêmico uma permissão própria: isso vira um nível?** Hoje qualquer membro da diretoria pode decidir.
3. **Em quanto tempo a diretoria valida uma resposta antes de a dúvida ficar parada?**
4. **Envio de e-mail.** Com o login por senha, o e-mail só sai em Esqueci a senha. O serviço padrão do Supabase manda poucos por hora; se os pedidos de nova senha ficarem frequentes, configurar um serviço de envio próprio (SMTP).
5. **Proteção de acesso da Vercel.** O projeto está com a "Vercel Authentication" ligada em todos os endereços `vercel.app`: só entra quem está logado na conta da Vercel. Serve para a fase de construção, mas impede o acesso dos ligantes. Antes de abrir, definir entre um domínio próprio da liga ou liberar o endereço de produção.
6. **Faltas: avisos.** Definir o que a plataforma faz quando o membro se aproxima das três faltas sem justificativa (aviso ao membro, alerta à diretoria).
7. **Direitos autorais dos anexos.** Os PDFs de bibliografia ficam restritos aos membros, mas trechos e livros inteiros têm regras diferentes. Definir o que pode ser anexado.
8. **Atraso de mais de 2 dias no rascunho: o artigo muda de data sozinho ou o diretor confirma?** Hoje o site sugere o próximo espaço livre (a primeira segunda-feira da grade quinzenal sem artigo) e qualquer membro da diretoria confirma ou escolhe outra data; sem confirmação, a data não muda.
9. **Datas a confirmar.** A aula extra de Litígios Societários foi registrada em 06/11 (data deduzida das mensagens). A aula de Atos Constitutivos teve dois professores e só um foi identificado.
