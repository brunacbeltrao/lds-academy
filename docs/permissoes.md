# Quem vê o quê

Três papéis: **ligante** (associado acadêmico), **diretoria** (associado diretor) e **conselheiro** (associado conselheiro). A diretoria não tem níveis por enquanto (ver `decisoes.md`).

**Conselheiro:** lê tudo o que a diretoria lê, em todas as áreas e na Gestão, e não escreve nada: não pergunta, não responde, não justifica, não favorita e não gere. No banco, isso são as políticas `*_conselho_ler` e a função `privado.pode_participar()`, exigida em toda escrita de participação.

| Área | Ligante | Diretoria |
| --- | --- | --- |
| Início | Vê avisos, prazos e pendências | Publica avisos |
| Calendário | Consulta e sincroniza | Cria e edita eventos |
| Ciclos e aulas | Lê todos os ciclos, inclusive os anteriores; vê a própria presença em cada aula | Planeja ciclos, publica aulas e faz a chamada |
| Biblioteca | Busca, lê (links do Drive) e favorita | Cadastra links do Drive e classifica |
| Competições | Só quem está na equipe selecionada | Toda a diretoria acompanha; cria edições e monta equipes |
| Tira-dúvidas | Pergunta (pública ou privada) e responde as públicas | Valida respostas, responde as privadas e modera |
| Produção | Consulta calendário e orientações | Mantém o calendário |
| A Liga | Lê | Lê |
| Regularização | Sem acesso | Mantém os documentos da liga |
| Gestão | Sem acesso | Acesso total |

## Como isso está no banco (RLS)

Todas as tabelas têm RLS. As políticas usam funções do schema `privado` (`is_membro()`, `is_diretoria()`, `membro_atual_id()`, `is_da_equipe()`, `pode_ver_pergunta()`), que não ficam expostas na API.

| Tabela | Ligante | Diretoria |
| --- | --- | --- |
| `membros` | Lê só a própria linha | Lê e gere todas |
| `ciclos`, `biblioteca_itens`, `aula_leituras`, `eventos`, `avisos`, `competicoes` | Lê | Lê e escreve |
| `aulas` | Lê as publicadas | Lê e escreve todas |
| `aula_materiais` e arquivos do bucket `materiais` | Lê e baixa | Envia, registra e apaga |
| `producoes` | Lê | Lê e escreve |
| `documentos` e arquivos do bucket `documentos` | Sem acesso | Envia, registra e apaga (o conselho lê) |
| `favoritos` | Só os próprios | Só os próprios |
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
