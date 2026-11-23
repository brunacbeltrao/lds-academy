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

### Organização do menu (decidida em novembro de 2026, ainda não aplicada)

O menu se agrupa pelo que a pessoa vai fazer ali. "Minha trajetória" e "A Liga" saem da lista principal: a trajetória fica junto do nome e do papel do membro, no pé do menu, e "A Liga" vai para o rodapé do menu. As rotas continuam as mesmas.

```
Início

Estudar
  Ciclos e aulas
  Biblioteca
  Tira-dúvidas

Praticar
  Competições
  Produção

Minha rotina
  Calendário

Diretoria (só diretoria e conselho)
  Regularização
  Gestão

Pé do menu: nome e papel do membro, com acesso a Minha trajetória · A Liga · Sair
```

- Títulos de grupo em texto normal, menores e mais claros que os itens, nunca em caixa alta.
- Grupos fixos, sem abrir e fechar, no computador e na gaveta do celular.
- Ligante e diretoria veem os mesmos grupos; a diretoria ganha só o bloco "Diretoria" no fim.

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

- `/ciclos/aulas/[id]`: página da aula, com professor, bibliografia e anexos; a diretoria edita ali mesmo.
- `/materiais/[id]`: download de um anexo, por link temporário.
- `/login`: pedido do link de acesso.
- `/auth/callback`: retorno do link de acesso.
- `/auth/sair`: encerra a sessão.
