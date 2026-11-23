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
- **Acervo por tema e com datas:** a aba Acervo agrupa os ciclos encerrados pelo tema (título do ciclo); temas com um só ciclo ficam em "Outros temas". Cada ciclo mostra o cronograma do calendário oficial, com as datas, e à parte as aulas do Drive que não aparecem no calendário. Datas registradas para 2024.1, 2024.2 e 2025.1-2 (migração `20261116001300_datas_do_acervo.sql`); os demais ciclos ainda não têm calendário.
- **Justificativa de falta:** só para aulas do ciclo em curso (página, ação no servidor e RLS). Aulas de ciclos encerrados mostram a data, mas não a presença.

## Fluxo do mini-artigo (novembro de 2026)

Etapas: vaga aberta → tema → redação → rascunho → revisão → ajustes → conferência final → publicação. A fase de cada artigo é calculada pelo banco a partir do que já aconteceu.

- **Diretor acadêmico:** só ele designa o revisor, registra o parecer de revisor de fora, decide depois de um parecer "Reescrever" e faz a conferência final. Decorre do cargo de diretor acadêmico (ver "Cargos da diretoria"). Abrir vagas, mudar datas e marcar como publicado ficam com qualquer membro da diretoria.
- **Revisor de fora da liga:** não entra no site. Recebe o link do Docs pelo diretor acadêmico, que registra o parecer por ele.
- **Rascunho:** entregue como link do Google Docs, com permissão de comentário. O site grava a data da primeira entrega e diz se foi no prazo ou com quantos dias de atraso.
- **Designação do revisor:** a qualquer momento, e cobrada até a entrega do rascunho, para a semana de revisão não começar sem revisor. Os autores não podem revisar o próprio texto.
- **Parecer "Reescrever":** o diretor acadêmico decide caso a caso: segue para ajustes na mesma semana ou volta para a redação, com novo prazo (e, se preciso, nova data de publicação).
- **Quem vê o andamento:** rascunho, parecer e ajustes só para a dupla, o revisor, a diretoria e o conselho. Os demais ligantes veem o calendário, o tema e a fase.
- **Tema:** a dupla registra na página do artigo; o site avisa se outro artigo já usou um tema parecido. O diretor acadêmico pode recusar, com motivo.
- **Reserva:** um artigo pode passar pelo fluxo sem data marcada, para cobrir uma vaga perdida.
- **Avisos:** enquanto não houver e-mail, cada pendência aparece em "Minhas pendências" (Início) e na fila da Produção.
- **Publicado:** o artigo aparece na Biblioteca, em "Artigos produzidos pela liga", com o link do LinkedIn.

## Novas áreas (novembro de 2026)

- **App instalável (PWA):** a plataforma pode ser instalada no celular e no computador. Sem conexão, mostra uma página de aviso; nada da plataforma fica guardado no aparelho.
- **Planejamento do ciclo:** qualquer membro da diretoria planeja (sem nível próprio para o diretor acadêmico; o ponto 2 abaixo segue em aberto). O cronograma nasce em rascunho e só aparece aos ligantes depois de publicado. Convites e notas ficam só com a diretoria e o conselho.
- **Banco de professores:** na área da diretoria, com contato e histórico. A página da aula continua guardando o nome e a apresentação do professor, porque os ligantes não leem o banco. Carga inicial feita no banco a partir das aulas de 2026.2 com um só professor; as aulas dadas em dupla ficaram sem ficha, para a diretoria decidir.
- **Mural de oportunidades:** só a diretoria publica. Cartaz em imagem opcional, lista de quem vai opcional (com limite de vagas) e destaque das abertas no Início. A oportunidade sai das abertas no dia seguinte ao prazo (ou à data do evento); sem data, fica até a diretoria remover.

- **Depois da aula:** slides e apostila entram como links (Drive, Canva), não como arquivos; o resumo é texto livre. A seção aparece quando há conteúdo ou depois que a aula passou.

- **Leitura feita:** o membro marca na página da aula ou no Início; vale só para aulas do ciclo em curso. A bibliografia do próximo encontro aparece no Início, e a leitura vira pendência na semana da aula.
- **Avaliação da aula:** nota de 1 a 5 e comentário opcional, a partir do horário de início da aula, só no ciclo em curso; dá para corrigir depois. As telas da diretoria e do conselho mostram as avaliações sem o nome de quem avaliou; o banco guarda o vínculo, para haver uma avaliação por pessoa e permitir a correção. A nota média aparece também na ficha do professor. Aula não avaliada vira pendência por uma semana.
- **Relatório do ciclo:** página na Gestão (diretoria e conselho), com versão de impressão. Percentuais de leitura usam a lista atual de membros ativos, sem o conselho; perguntas e oportunidades contam pelo período do ciclo.

- **Notificações no celular:** por Web Push, sem aplicativo de loja. Cada membro ativa por aparelho e escolhe as categorias (avisos, lembretes, respostas e justificativas, oportunidades e, para a diretoria, a fila do que espera decisão). Os lembretes saem às 9h: véspera da aula (com a pergunta sobre a leitura para quem não marcou), dia seguinte para avaliar, véspera da entrega de carrossel ou do rascunho de mini-artigo e véspera do prazo das oportunidades marcadas com "Vou". O conselho não recebe, porque não participa. O aviso de faltas perto do limite não entrou: depende do ponto 6.

- **Trilha de estudos:** item próprio no menu (`/trilha`), com a ordem de aprendizado da liga. Segue o livro *Direito das Companhias* (2ª ed., Forense, 2017): cada tópico cita título, capítulo, parágrafos e páginas, sem anexar o livro (ver ponto 7). As referências da Parte I foram sugeridas a partir do sumário e cabem à diretoria conferir; o livro trata só das companhias, então limitadas e manipulação de mercado têm só pontos de partida. Cada tópico liga às aulas da plataforma (acervo e ciclo atual) e às pastas do Drive da ordem de aprendizado. O membro marca o tópico como estudado; a diretoria e o conselho veem quantos marcaram. O conteúdo (títulos e links do Drive) foi carregado direto no banco, fora das migrações, porque o repositório é público.

## Cargos da diretoria (novembro de 2026)

- **Cargos:** diretor-presidente, diretor vice-presidente, diretor acadêmico e diretor de relações institucionais, nessa ordem. Ficam em `membros.cargo_diretoria`, só para quem tem o papel diretoria, com um ocupante ativo por cargo (o banco recusa o segundo). Quem ocupa cada cargo é gravado direto no banco, fora das migrações.
- **Onde aparece:** ao lado do nome no menu e em Meu perfil (no lugar de "Diretoria"), em Gestão → Membros e na aba Cargos de A Liga, em "Diretoria atual".
- **Diretor acadêmico:** deixou de ser uma marcação à parte. A coluna `membros.diretor_academico` passou a ser calculada a partir do cargo, então as regras do mini-artigo seguem iguais. Os outros cargos não dão permissões próprias: a diretoria continua sem níveis.
- **Troca de cargo:** em Gestão → Membros, campo "Cargo na diretoria". Para passar um cargo a outra pessoa, tire-o primeiro de quem o ocupa.

- **Menu por grupos:** o menu se organiza pelo que a pessoa vai fazer ali (Estudar, Praticar e Diretoria), com "Início" solto no topo. O Calendário fica em Estudar e Oportunidades em Praticar. "Minha trajetória" vai para o pé do menu, junto de Meu perfil, e "A Liga" para o rodapé. Detalhes em `sitemap.md`.

## Em aberto

1. **A IA vai ler os PDFs do Drive?** Se sim, a base precisa dos arquivos em si, e não só de links. Disso depende também o modelo de embeddings: a coluna `ia_trechos.embedding` está sem dimensão fixa até essa escolha.
2. **Aceitar justificativas dá ao diretor acadêmico uma permissão própria: isso vira um nível?** Hoje qualquer membro da diretoria pode decidir.
3. **Em quanto tempo a diretoria valida uma resposta antes de a dúvida ficar parada?**
4. **Envio de e-mail.** Com o login por senha, o e-mail só sai em Esqueci a senha. As notificações no celular cobrem os avisos do dia a dia, mas não chegam a quem não ativou. O serviço padrão do Supabase manda poucos por hora; se os pedidos de nova senha ficarem frequentes, configurar um serviço de envio próprio (SMTP).
5. **Proteção de acesso da Vercel.** O projeto está com a "Vercel Authentication" ligada em todos os endereços `vercel.app`: só entra quem está logado na conta da Vercel. Serve para a fase de construção, mas impede o acesso dos ligantes. Antes de abrir, definir entre um domínio próprio da liga ou liberar o endereço de produção.
6. **Faltas: avisos.** Definir o que a plataforma faz quando o membro se aproxima das três faltas sem justificativa (aviso ao membro, alerta à diretoria).
7. **Direitos autorais dos anexos.** Os PDFs de bibliografia ficam restritos aos membros, mas trechos e livros inteiros têm regras diferentes. Definir o que pode ser anexado.
8. **Atraso de mais de 2 dias no rascunho: o artigo muda de data sozinho ou o diretor confirma?** Hoje o site sugere o próximo espaço livre (a primeira segunda-feira da grade quinzenal sem artigo) e qualquer membro da diretoria confirma ou escolhe outra data; sem confirmação, a data não muda.
9. **Datas a confirmar.** A aula extra de Litígios Societários foi registrada em 06/11 (data deduzida das mensagens). A aula de Atos Constitutivos teve dois professores e só um foi identificado.
10. **Calendários do acervo a confirmar.** (a) Datas que não caem numa quarta-feira, registradas como estão nos calendários: 30/07/2024 (Rinha, 2024.1), 19/11/2024 e 25/11/2024 (2024.2) e 22/07/2025 (2025.1-2). (b) 2025.1-2: o calendário repete "Aula 13 - Acordo de Sócios e Governança Corporativa" em 12/11/2025; a linha não foi registrada. A Aula 06 (Due Diligence) está no Drive mas não no calendário. (c) 2024.1: o calendário traz blocos de tema (Disputas de M&A, Fundos de Investimento etc.) que não batem com as aulas do Drive; o cronograma ficou sem ligação com as aulas. (d) 2024.2: a partir de 12/02/2025 o calendário diverge da numeração do Drive (a Aula 10 do Drive é Introdução ao M&A, que não aparece no calendário); as aulas sem correspondência ficaram só no cronograma.
