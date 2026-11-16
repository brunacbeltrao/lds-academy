# Quem vê o quê

Três papéis: **ligante** (associado acadêmico), **diretoria** (associado diretor) e **conselheiro** (associado conselheiro). A diretoria não tem níveis por enquanto (ver `decisoes.md`).

**Acesso de diretoria** (`membros.acesso_diretoria`): dá a um ligante as permissões da diretoria sem mudar o cargo exibido, para quem ajuda a manter a plataforma. A diretoria liga e desliga em Gestão → Membros. No banco, `privado.is_diretoria()` aceita o cargo ou o acesso; no app, `getMembroAtual()` devolve `papel` (efetivo) e `cargo` (exibido).

**Conselheiro:** lê tudo o que a diretoria lê, em todas as áreas e na Gestão, e não escreve nada: não pergunta, não responde, não justifica, não favorita e não gere. No banco, isso são as políticas `*_conselho_ler` e a função `privado.pode_participar()`, exigida em toda escrita de participação.

| Área | Ligante | Diretoria |
| --- | --- | --- |
| Início | Vê avisos, prazos e pendências | Publica avisos |
| Calendário | Consulta e sincroniza | Cria e edita eventos |
| Ciclos e aulas | Lê todos os ciclos, inclusive os anteriores | Planeja ciclos e publica aulas |
| Biblioteca | Busca, lê (links do Drive) e favorita | Cadastra links do Drive e classifica |
| Competições | Só quem está na equipe selecionada | Toda a diretoria acompanha; cria edições e monta equipes |
| Tira-dúvidas | Pergunta (pública ou privada) e responde as públicas | Valida respostas, responde as privadas e modera |
| Produção | Consulta calendário e orientações. Nos seus artigos: registra o tema, envia o rascunho e conclui os ajustes; como revisor, registra o parecer | Abre vagas, muda datas, marca como publicado. Só o diretor acadêmico designa revisores, recusa temas, decide sobre "Reescrever" e faz a conferência final |
| A Liga | Lê | Lê |
| Oportunidades | Lê o mural e marca "Vou" quando há lista | Publica, edita, fixa e remove; vê os nomes da lista (o conselho também vê) |
| Regularização | Sem acesso | Mantém os documentos da liga |
| Professores | Sem acesso | Mantém o banco de professores (o conselho lê) |
| Planejamento do ciclo | Vê o cronograma depois de publicado | Monta o cronograma em rascunho, publica e inicia o ciclo (qualquer membro da diretoria; o conselho lê) |
| Gestão | Sem acesso | Acesso total |

## Como isso está no banco (RLS)

Todas as tabelas têm RLS. As políticas usam funções do schema `privado` (`is_membro()`, `is_diretoria()`, `membro_atual_id()`, `is_da_equipe()`, `pode_ver_pergunta()`), que não ficam expostas na API.

| Tabela | Ligante | Diretoria |
| --- | --- | --- |
| `membros` (nome, papel, situação) | Lê todas, para ver os colegas | Lê e gere todas |
| `membros_acesso` (e-mail de acesso) | Lê só o próprio | Lê e gere todos (o conselho lê) |
| `ciclos`, `biblioteca_itens`, `aula_leituras`, `avisos`, `competicoes` | Lê | Lê e escreve |
| `eventos` | Lê os publicados (`publicado`); os rascunhos do planejamento ficam ocultos | Lê e escreve todos (o conselho lê todos) |
| `professores` | Sem acesso | Lê e escreve (o conselho lê) |
| `aula_planejamento` (convite e notas da aula) | Sem acesso | Lê e escreve (o conselho lê) |
| `oportunidades` e cartazes do bucket `mural` | Lê | Lê, publica, edita e apaga |
| `oportunidade_interessados` | Lê todas (para contar); entra e sai só com o próprio nome, se a oportunidade pede lista e há vaga (`privado.tem_vaga()`) | Lê e tira qualquer um |
| `aulas` | Lê as publicadas | Lê e escreve todas |
| `aula_materiais` e arquivos do bucket `materiais` | Lê e baixa | Envia, registra e apaga |
| `producoes` | Lê; o autor altera só o tema do próprio artigo, até a entrega do rascunho | Lê e escreve (revisor de fora e recusa de tema: só o diretor acadêmico) |
| `producao_participantes` | Lê | Lê e escreve (revisor de artigo: só o diretor acadêmico; ninguém revisa o próprio texto) |
| `producao_entregas` | Lê, envia e apaga as próprias se participa da publicação | Lê, envia e apaga |
| `artigo_andamento` | Só se participa do artigo: o autor envia o rascunho e conclui ajustes; o revisor registra o parecer | Lê tudo; o diretor acadêmico registra parecer por revisor de fora, decide a reescrita e libera (o conselho lê) |

O fluxo do mini-artigo usa gatilhos no banco (`privado.producoes_antes_de_gravar`, `privado.artigo_andamento_antes_de_gravar`, `privado.participantes_conferir`) que conferem quem altera cada campo, carimbam datas e autoria e recalculam a fase. A função `privado.is_diretor_academico()` exige a marcação de diretor acadêmico e permissões de diretoria.
| `documentos` e arquivos do bucket `documentos` | Sem acesso | Envia, registra e apaga (o conselho lê) |
| `favoritos` | Só os próprios | Só os próprios |
| `perfis` e arquivos do bucket `fotos` | Lê as fotos de todos; envia, troca e apaga só a própria | Igual ao ligante |
| `equipes`, `equipe_membros` | Só das equipes de que participa | Lê e gere todas |
| `perguntas` | Lê as públicas e as próprias; cria as suas | Lê todas; edita e apaga |
| `respostas` | Lê as validadas e as próprias; responde só a perguntas públicas, sempre como pendente | Lê todas; cria, valida, recusa e apaga |
| `presencas` | Lê as próprias | Registra e lê todas |
| `justificativas` | Envia e acompanha as próprias | Lê todas e decide |
| `ia_trechos` | Sem acesso | Lê e escreve |

Quem não está logado não lê nada. Quem está logado mas foi desativado na lista (`ativo = false`) também não: as funções exigem membro ativo, e o app encerra a sessão.

## No app

- O proxy (`src/proxy.ts`) manda para `/login` quem não tem sessão.
- `getMembroAtual()` confere, a cada requisição, se a sessão pertence a um membro ativo.
- A Gestão chama `exigirGestao()` (diretoria e conselho). Toda ação que altera dados de gestão chama `exigirDiretoria()`.
- O menu só mostra "Gestão" à diretoria e ao conselho, mas isso é conveniência, não segurança.
