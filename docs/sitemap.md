# Mapa do site

Entrada única: **LDS Academy**, com login por lista de membros. Fonte: quadro "LDS Academy: mapa do site" (novembro de 2026).

## Menu principal (todos os membros)

| Área | Rota | Conteúdo previsto |
| --- | --- | --- |
| Início | `/` | Próxima aula e leitura · Avisos da diretoria · Prazos de competições · Perguntas recentes · Minhas pendências |
| Calendário | `/calendario` | Visão mensal e semanal · Filtro por ciclo e tipo · Aulas, eventos e competições · Sincronizar com Google Agenda |
| Ciclos e aulas | `/ciclos` | Ciclo atual: 2026.2, Ciclo-base de Direito Societário · Próximo ciclo: 2027.1, M&A · Ciclos anteriores, abertos a todos · Página da aula: slides, leituras e apostila |
| Biblioteca | `/biblioteca` | Doutrina por tema, autor e ciclo · Legislação e jurisprudência · Apostilas da liga · Artigos produzidos pela liga · Busca e favoritos |
| Competições | `/competicoes` | Sociecap, CMNA e outras · Edital, regras e prazos · Casos e peças de edições anteriores · Equipes: acesso só da equipe e da diretoria · Trilha de preparação e treinos |
| Produção | `/producao` | Carrosséis do Instagram · Mini-artigos do LinkedIn · Orientações · Banco de temas |
| Tira-dúvidas | `/tira-duvidas` | Feed público por ciclo e tema · Perguntar, em público ou privado · Respostas dos ligantes (nas públicas) · Rascunho da IA com base na biblioteca · Validação da diretoria antes de publicar |
| Minha trajetória | `/trajetoria` | Presença, faltas e justificativas (limite de 3) · Leituras e aulas concluídas · Minhas perguntas e respostas · Minhas equipes de competição |
| A Liga | `/a-liga` | O que é a LDS·FDR · Cargos · Regras do Grupo de Estudos · Eventos · Código de Conduta |

As abas "Produção" e "A Liga" não estavam no mapa original; foram acrescentadas em novembro de 2026.

## Gestão (diretoria e conselho)

Não aparece no menu do ligante e é bloqueada no servidor. A diretoria gere; o conselho só lê.

### Regularização (`/regularizacao`)

Os documentos da liga em PDF, por categoria: Estatuto e regimento · Eleições (editais, propostas, resultados) · Atas e assembleias · Registros e cadastros · Outros. A diretoria envia e remove; o conselho lê. Download por `/documentos/[id]`.

### Gestão (`/gestao`)

- Membros e papéis (lista oficial)
- Frequência e justificativas (decide o acadêmico)
- Planejamento do ciclo
- Curadoria da biblioteca e da base da IA
- Edições e equipes de competição
- Fila: validar respostas e responder privadas
- Avisos e relatórios do ciclo

## Outras rotas

- `/ciclos/aulas/[id]`: página da aula, com professor, bibliografia, anexos, pasta do Drive, presença e justificativa de falta; a diretoria edita ali mesmo.
- `/ciclos/acervo/[codigo]`: um ciclo anterior, com o cronograma datado (quando há calendário) e as aulas do Drive. Na aba Acervo de `/ciclos`, os ciclos ficam agrupados por tema.
- `/producao/[id]`: página de uma publicação. Nos mini-artigos, o fluxo completo: etapas, prazos, o que cada pessoa faz agora (tema, rascunho, revisor, parecer, ajustes, conferência, publicação) e o andamento. Nos carrosséis, entregas e edição pela diretoria.
- `/tira-duvidas/[id]`: pergunta, respostas, validação e resposta da diretoria.
- `/conta`: meu perfil: foto (bucket privado `fotos`, visível aos membros) e troca de senha. Abre pelo nome no rodapé do menu.
- `/conta/senha`: nova senha, destino do link de Esqueci a senha.
- `/materiais/[id]/ler` e `/documentos/[id]/ler`: leitura do PDF no próprio site, com tela cheia e download.
- `/materiais/[id]`: download de um anexo, por link temporário.
- `/login`: entrar, primeiro acesso (criar senha) e esqueci a senha.
- `/auth/callback`: retorno do link de nova senha.
- `/auth/sair`: encerra a sessão.
