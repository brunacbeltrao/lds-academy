# Mapa do site

Entrada única: **LDS Academy**, com login por lista de membros. Fonte: quadro "LDS Academy: mapa do site" (novembro de 2026).

## Menu principal (ligantes e diretoria)

| Área | Rota | Conteúdo previsto |
| --- | --- | --- |
| Início | `/` | Próxima aula e leitura · Avisos da diretoria · Prazos de competições · Perguntas recentes · Minhas pendências |
| Calendário | `/calendario` | Visão mensal e semanal · Filtro por ciclo e tipo · Aulas, eventos e competições · Sincronizar com Google Agenda |
| Ciclos e aulas | `/ciclos` | Ciclo atual: 2026.2, Introdução ao Societário · Próximo ciclo: 2027.1, M&A · Ciclos anteriores, abertos a todos · Página da aula: slides, leituras e apostila |
| Biblioteca | `/biblioteca` | Doutrina por tema, autor e ciclo · Legislação e jurisprudência · Apostilas da liga · Artigos produzidos pela liga · Busca e favoritos |
| Competições | `/competicoes` | Sociecap, CMNA e outras · Edital, regras e prazos · Casos e peças de edições anteriores · Equipes: acesso só da equipe e da diretoria · Trilha de preparação e treinos |
| Tira-dúvidas | `/tira-duvidas` | Feed público por ciclo e tema · Perguntar, em público ou privado · Respostas dos ligantes (nas públicas) · Rascunho da IA com base na biblioteca · Validação da diretoria antes de publicar |
| Minha trajetória | `/trajetoria` | Presença, faltas e justificativas (limite de 3) · Leituras e aulas concluídas · Minhas perguntas e respostas · Minhas equipes de competição |

## Gestão (só diretoria)

Rota `/gestao`. Não aparece no menu do ligante e é bloqueada no servidor.

- Membros e papéis (lista oficial)
- Frequência e justificativas (decide o acadêmico)
- Planejamento do ciclo
- Curadoria da biblioteca e da base da IA
- Edições e equipes de competição
- Fila: validar respostas e responder privadas
- Avisos e relatórios do ciclo

## Outras rotas

- `/login`: pedido do link de acesso.
- `/auth/callback`: retorno do link de acesso.
- `/auth/sair`: encerra a sessão.
