/** Orientações de produção, tiradas dos calendários oficiais da liga (2026.2). */

export const TIPOS_DE_POST: [string, string][] = [
  ["Grupo de Estudos", "Conteúdos ligados aos encontros semanais e aos tópicos-base da liga."],
  ["Conteúdo", "Temas de Direito Empresarial e Societário, com foco na teoria geral do societário."],
  ["Timing post", "Postagens que aproveitam assuntos atuais (notícias) ou muito recorrentes."],
  ["Artigo", "Produção dos próprios membros, para reconhecimento e engajamento."],
];

export const ORIENTACOES_CARROSSEL: string[] = [
  "O post sai sempre às terças-feiras. A entrega é até a segunda-feira anterior, às 18h, para permitir a revisão interna. A diretoria lembra cada dupla no sábado que antecede a postagem.",
  "O modelo no Canva é enviado no privado de cada dupla perto da data do post. Deve-se sempre fazer uma cópia, sem editar o original.",
  "Usar as bibliografias disponibilizadas pela Diretoria e presentes no Drive, com a possibilidade de complementar com outras fontes confiáveis.",
  "Evitar o uso de IA para construir o conteúdo; no máximo, para organizar ideias, sugerir títulos ou tornar o texto mais atrativo. O uso para conteúdo pode gerar inconsistências e erros.",
  "A intenção do post não é ser atrativo: é gerar ativo de conhecimento para a liga e criar conteúdo de autoridade. O leitor deve ter interesse em ler, mas o mais relevante é que compreenda.",
  "Sempre que possível, encaixar uma notícia atual no tema e, a partir dela, contextualizar a aplicação prática. Sem notícia relacionada, segue-se a estrutura tradicional de apresentação do conteúdo.",
  "Havendo notícia muito relevante, mesmo fora do tema, comunicar à diretoria, em especial à diretoria acadêmica, para avaliar realocação ou aproveitamento.",
];

export const ORIENTACOES_ARTIGO: { titulo: string; itens: string[] }[] = [
  {
    titulo: "Fluxo de cada artigo",
    itens: [
      "Redação (2 semanas): a dupla escolhe o tema dentro do direito societário ou do mercado de capitais e o comunica à Diretoria Acadêmica já no início do ciclo, para evitar repetição entre duplas.",
      "Entrega do rascunho: até o domingo que encerra a segunda semana, em .docx ou Google Docs com permissão de comentário, enviado à Diretoria Acadêmica e ao revisor designado.",
      "Revisão (até 1 semana): sugere-se que o revisor devolva o parecer até a quinta-feira e a dupla conclua os ajustes até o domingo, prazo final para a versão aprovada.",
      "Publicação: na segunda-feira seguinte ao fim da revisão. Como redação e revisão se sobrepõem entre ciclos, há uma publicação a cada 2 semanas.",
      "Atrasos: rascunho com mais de 2 dias de atraso perde a vaga e é deslocado para o próximo espaço livre. Recomenda-se manter um artigo de reserva pronto.",
      "Todos os prazos correm em dias corridos, incluindo fins de semana, feriados, férias e recesso, sem suspensão nem prorrogação.",
    ],
  },
  {
    titulo: "Orientações para a redação",
    itens: [
      "Extensão: mini-artigo de 800 a 1.200 palavras como referência (2 a 3 páginas), com título atrativo e um resumo de 2 a 3 linhas no início. Não há limite máximo formal.",
      "Estrutura sugerida: introdução com o problema ou a atualidade do tema; desenvolvimento com base legal, doutrina e, quando houver, jurisprudência (STJ, TJPE, pareceres e processos da CVM); conclusão com o posicionamento da dupla; referências.",
      "Fontes: mínimo de 5 referências confiáveis (lei, doutrina, jurisprudência ou normas da CVM e da B3), com conferência da vigência da legislação citada.",
      "Citações e referências no padrão ABNT (NBR 10520 e NBR 6023). Citações diretas curtas, sempre com autoria e página.",
      "Originalidade: texto inédito, sem cópia nem paráfrase excessiva. Se houver apoio de IA, a dupla deve verificar cada citação, artigo de lei e julgado, pois erros e referências inexistentes são comuns; o texto não deve ter aparência de gerado por IA.",
      "Autoria: identificar os autores com nome, curso, período e vínculo com a liga. Os autores autorizam a publicação e a divulgação nos canais da liga.",
    ],
  },
  {
    titulo: "Orientações para o revisor",
    itens: [
      "O revisor pode ser membro da liga, professor, egresso ou pós-graduando; nunca um dos autores. Recomenda-se alternar os revisores ao longo do semestre.",
      "Critérios: correção e atualidade jurídica; clareza, coesão e argumentação; adequação à extensão e à estrutura; gramática e ortografia; ABNT e conferência das fontes; originalidade; pertinência ao público da liga.",
      "Forma: comentários no modo de revisão e um parecer curto com uma de três conclusões: Aprovado, Aprovado com ajustes ou Reescrever.",
      "A Diretoria Acadêmica faz a conferência final do texto ajustado antes de liberar a publicação.",
    ],
  },
  {
    titulo: "Publicação e divulgação",
    itens: [
      "Publicação no canal oficial da liga, com padrão visual, título, nomes dos autores e, se for o caso, o crédito de revisão.",
      "Horário fixo de publicação (por exemplo, segunda-feira às 10h), para criar hábito no público e facilitar a divulgação pelos autores e membros.",
    ],
  },
];

export const BANCO_DE_TEMAS: [string, string, string][] = [
  ["Dever de diligência e business judgment rule", "Administradores", "Limites da responsabilidade do administrador por decisões de negócio"],
  ["Conflito de interesses e abuso do direito de voto", "Sociedades anônimas", "Art. 115 da Lei 6.404/76 e a atuação da CVM"],
  ["Acordo de acionistas", "Sociedades anônimas", "Execução específica e vinculação dos administradores"],
  ["Desconsideração da personalidade jurídica", "Teoria geral", "Art. 50 do Código Civil e a Lei de Liberdade Econômica"],
  ["Dissolução parcial de sociedade", "Sociedade limitada", "Apuração de haveres no CPC/2015"],
  ["Holding familiar e planejamento sucessório", "Direito societário", "Vantagens, riscos e uso abusivo"],
  ["Ofertas públicas de aquisição (OPA)", "Mercado de capitais", "Hipóteses obrigatórias e proteção do minoritário"],
  ["Responsabilidade do acionista controlador", "Sociedades anônimas", "Abuso de poder de controle (art. 117)"],
  ["Direito de recesso", "Sociedades anônimas", "Hipóteses legais e cálculo do reembolso"],
  ["Sociedade Anônima do Futebol (SAF)", "Direito societário", "Lei 14.193/2021 e a captação de investimento"],
  ["Crowdfunding de investimento", "Mercado de capitais", "Regulação da CVM para pequenas empresas"],
  ["Insider trading e manipulação de mercado", "Mercado de capitais", "Elementos do ilícito e atuação sancionadora da CVM"],
  ["Governança corporativa e ESG", "Compliance", "Deveres de informação e riscos de greenwashing"],
  ["Arbitragem societária", "Resolução de conflitos", "Cláusula compromissória em estatutos e contratos sociais"],
  ["Fusões e aquisições: cláusulas MAC e earn-out", "M&A", "Redação contratual e riscos na prática"],
  ["Tokenização e ativos digitais como valores mobiliários", "Mercado de capitais", "Critério de classificação como valor mobiliário"],
  ["Recuperação judicial e reflexos societários", "Insolvência", "Papel dos sócios e dos administradores"],
  ["Proteção do acionista minoritário", "Sociedades anônimas", "Instrumentos legais e mecanismos de voz e saída"],
  ["Reforma tributária e estrutura societária", "Tributário e societário", "Efeitos sobre holdings, reorganizações e distribuição de lucros"],
  ["Sociedade limitada e regência supletiva da Lei das S.A.", "Sociedade limitada", "Quando e como a lei das S.A. se aplica às limitadas"],
];
