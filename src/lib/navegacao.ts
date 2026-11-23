/**
 * Onde o item aparece no menu (docs/sitemap.md, "Organização do menu"):
 * solto no topo, num grupo com título, no pé do menu (junto de Meu perfil) ou no bloco da diretoria.
 */
export type GrupoMenu = "topo" | "estudar" | "praticar" | "pe" | "diretoria";

export type ItemMenu = { href: string; rotulo: string; resumo: string; grupo: GrupoMenu; gestao?: boolean };

/** Títulos dos grupos, na ordem em que aparecem. */
export const GRUPOS_COM_TITULO: { grupo: GrupoMenu; titulo: string }[] = [
  { grupo: "estudar", titulo: "Estudar" },
  { grupo: "praticar", titulo: "Praticar" },
];

/** As áreas do menu, já na ordem de exibição, e a Gestão, da diretoria e do conselho. */
export const MENU: ItemMenu[] = [
  { href: "/", rotulo: "Início", resumo: "Próxima aula, avisos, prazos e pendências.", grupo: "topo" },
  { href: "/calendario", rotulo: "Calendário", resumo: "Aulas, eventos e competições do ciclo.", grupo: "estudar" },
  { href: "/ciclos", rotulo: "Ciclos e aulas", resumo: "Ciclo atual, próximos e o acervo dos anteriores.", grupo: "estudar" },
  { href: "/trilha", rotulo: "Trilha de estudos", resumo: "A ordem dos temas para estudar, com a leitura no livro e as aulas de cada um.", grupo: "estudar" },
  { href: "/biblioteca", rotulo: "Biblioteca", resumo: "Doutrina, legislação, jurisprudência e apostilas.", grupo: "estudar" },
  { href: "/tira-duvidas", rotulo: "Tira-dúvidas", resumo: "Perguntas públicas ou privadas, validadas pela diretoria.", grupo: "estudar" },
  { href: "/competicoes", rotulo: "Competições", resumo: "Sociecap, CMNA e outras; materiais da equipe.", grupo: "praticar" },
  { href: "/producao", rotulo: "Produção", resumo: "Carrosséis do Instagram e mini-artigos do LinkedIn.", grupo: "praticar" },
  { href: "/oportunidades", rotulo: "Oportunidades", resumo: "Vagas de estágio, cursos, eventos e concursos divulgados pela diretoria.", grupo: "praticar" },
  { href: "/trajetoria", rotulo: "Minha trajetória", resumo: "Presença, leituras, perguntas e equipes.", grupo: "pe" },
  { href: "/a-liga", rotulo: "A Liga", resumo: "O que é a liga, regras do Grupo de Estudos e Código de Conduta.", grupo: "pe" },
  { href: "/regularizacao", rotulo: "Regularização", resumo: "Documentos da liga: estatuto, eleições, atas e registros.", grupo: "diretoria", gestao: true },
  { href: "/professores", rotulo: "Professores", resumo: "Banco de professores: contatos, temas e aulas dadas.", grupo: "diretoria", gestao: true },
  { href: "/gestao", rotulo: "Gestão", resumo: "Membros, frequência, planejamento e curadoria.", grupo: "diretoria", gestao: true },
];
