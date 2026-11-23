# Mapa do site

Entrada única: **LDS Academy**, com login por lista de membros. Fonte: quadro "LDS Academy: mapa do site" (novembro de 2026).

## Menu principal (todos os membros)

| Área | Rota | Conteúdo previsto |
| --- | --- | --- |
| Início | `/` | Próxima aula e leitura · Avisos da diretoria · Prazos de competições · Perguntas recentes · Minhas pendências |
| Calendário | `/calendario` | Visão mensal e semanal · Filtro por ciclo e tipo · Aulas, eventos e competições · Sincronizar com Google Agenda |
| Ciclos e aulas | `/ciclos` | Ciclo atual: 2026.2, Ciclo-base de Direito Societário · Próximo ciclo: 2027.1, M&A · Ciclos anteriores, abertos a todos · Página da aula: slides, leituras e apostila |
| Trilha de estudos | `/trilha` | A ordem de aprendizado da liga, em partes (Direito Societário Básico, Fusões e Aquisições, Contabilidade Empresarial, Outros Temas Essenciais) · Cada tópico com a leitura no livro *Direito das Companhias*, as aulas da plataforma e as pastas do Drive · Progresso de cada membro (marcar como estudado) · A diretoria edita na própria página |
| Biblioteca | `/biblioteca` | Doutrina por tema, autor e ciclo · Legislação e jurisprudência · Apostilas da liga · Artigos produzidos pela liga · Busca e favoritos |
| Competições | `/competicoes` | Sociecap, CMNA e outras · Edital, regras e prazos · Casos e peças de edições anteriores · Equipes: acesso só da equipe e da diretoria · Trilha de preparação e treinos |
| Oportunidades | `/oportunidades` | Mural de vagas de estágio, cursos, eventos, concursos e conteúdos · Abertas e encerradas pelo prazo · Filtro por tipo · Cartaz em imagem · Lista de quem vai (botão "Vou") · As abertas aparecem no Início |
| Produção | `/producao` | Carrosséis do Instagram · Mini-artigos do LinkedIn · Orientações · Banco de temas |
| Tira-dúvidas | `/tira-duvidas` | Feed público por ciclo e tema · Perguntar, em público ou privado · Respostas dos ligantes (nas públicas) · Rascunho da IA com base na biblioteca · Validação da diretoria antes de publicar |
| Minha trajetória | `/trajetoria` | Presença, faltas e justificativas (limite de 3) · Leituras e aulas concluídas · Minhas perguntas e respostas · Minhas equipes de competição |
| A Liga | `/a-liga` | O que é a LDS·FDR · Cargos · Regras do Grupo de Estudos · Eventos · Código de Conduta |

As abas "Produção", "A Liga", "Oportunidades" e "Trilha de estudos" não estavam no mapa original; foram acrescentadas em novembro de 2026.

### Organização do menu (decidida em novembro de 2026, ainda não aplicada)

O menu se agrupa pelo que a pessoa vai fazer ali. "Minha trajetória" e "A Liga" saem da lista principal: a trajetória vai para o pé do menu, junto de Meu perfil (nome e cargo do membro), e "A Liga" para o rodapé do menu. As rotas continuam as mesmas.

```
Início

Estudar
  Calendário
  Ciclos e aulas
  Trilha de estudos
  Biblioteca
  Tira-dúvidas

Praticar
  Competições
  Produção
  Oportunidades

Diretoria (só diretoria e conselho)
  Regularização
  Professores
  Gestão

Pé do menu: Meu perfil (nome e cargo) · Minha trajetória · A Liga · Sair
```

- Títulos de grupo em texto normal, menores e mais claros que os itens, nunca em caixa alta.
- Grupos fixos, sem abrir e fechar, no computador e na gaveta do celular.
- Ligante e diretoria veem os mesmos grupos; a diretoria ganha só o bloco "Diretoria" no fim.

## Gestão (diretoria e conselho)

Não aparece no menu do ligante e é bloqueada no servidor. A diretoria gere; o conselho só lê.

### Regularização (`/regularizacao`)

Os documentos da liga em PDF, por categoria: Estatuto e regimento · Eleições (editais, propostas, resultados) · Atas e assembleias · Registros e cadastros · Outros. A diretoria envia e remove; o conselho lê. Download por `/documentos/[id]`.

### Professores (`/professores`)

Banco de professores: quem já deu ou pode dar aula, com instituição, temas, contato (e-mail, WhatsApp, LinkedIn), apresentação, observações da diretoria e as aulas dadas na liga. Busca por nome, tema ou escritório. Ficha em `/professores/[id]`. A diretoria cadastra e edita; o conselho lê.

### Relatório do ciclo (`/gestao/relatorio`)

Resumo de um ciclo (o atual, ou outro escolhido): aulas realizadas, presença média, leitura feita, nota média das aulas, aula por aula (presença, leitura, nota e material pós-aula), membros perto do limite de faltas, justificativas, produção publicada, perguntas e oportunidades no período, e os comentários das avaliações sem nomes. Pode ser impresso ou salvo em PDF (o menu some na impressão). Diretoria e conselho.

### Planejamento do ciclo (`/gestao/planejamento`)

A diretoria cria o próximo ciclo e monta o cronograma em rascunho (`/gestao/planejamento/[codigo]`): aulas e eventos, preenchimento automático das quartas-feiras, professor do banco, situação do convite (a convidar, convite enviado, confirmado, recusou) e notas internas. Depois publica para os ligantes (aba Próximo ciclo e Calendário) e, no começo do semestre, inicia o ciclo, que vira o atual; o anterior vai para o acervo. O conselho lê.

### Gestão (`/gestao`)

- Membros, papéis e cargos da diretoria (lista oficial)
- Frequência e justificativas (decide o acadêmico)
- Planejamento do ciclo
- Curadoria da biblioteca e da base da IA
- Edições e equipes de competição
- Fila: validar respostas e responder privadas
- Avisos e relatórios do ciclo

## Outras rotas

- `/ciclos/aulas/[id]`: página da aula, com professor, bibliografia (e o botão "Fiz a leitura"), anexos, pasta do Drive, depois da aula, avaliação da aula, presença e justificativa de falta; para a diretoria e o conselho, o retorno da aula (leituras e avaliações, sem nomes); a diretoria edita ali mesmo.
- `/ciclos/acervo/[codigo]`: um ciclo anterior, com o cronograma datado (quando há calendário) e as aulas do Drive. Na aba Acervo de `/ciclos`, os ciclos ficam agrupados por tema.
- `/producao/[id]`: página de uma publicação. Nos mini-artigos, o fluxo completo: etapas, prazos, o que cada pessoa faz agora (tema, rascunho, revisor, parecer, ajustes, conferência, publicação) e o andamento. Nos carrosséis, entregas e edição pela diretoria.
- `/tira-duvidas/[id]`: pergunta, respostas, validação e resposta da diretoria.
- `/conta`: meu perfil: foto (bucket privado `fotos`, visível aos membros), notificações no celular (ativar por aparelho, escolher categorias, últimas notificações) e troca de senha. Abre pelo nome no rodapé do menu.
- `/conta/senha`: nova senha, destino do link de Esqueci a senha.
- `/materiais/[id]/ler` e `/documentos/[id]/ler`: leitura do PDF no próprio site, com tela cheia e download.
- `/materiais/[id]`: download de um anexo, por link temporário.
- `/oportunidades/[id]`: uma oportunidade, com cartaz, prazo, link, contato, botão "Vou" e, para a diretoria e o conselho, a lista de quem vai; a diretoria edita ali mesmo.
- `/oportunidades/[id]/cartaz`: imagem do cartaz, por link temporário.
- `/offline.html`: página mostrada pelo app instalado quando não há internet.
- `/login`: entrar, primeiro acesso (criar senha) e esqueci a senha.
- `/auth/callback`: retorno do link de nova senha.
- `/auth/sair`: encerra a sessão.
