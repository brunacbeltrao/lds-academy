export type ItemMenu = { href: string; rotulo: string; resumo: string; gestao?: boolean };

/** As áreas do menu principal (docs/sitemap.md) e a Gestão, da diretoria e do conselho. */
export const MENU: ItemMenu[] = [
  { href: "/", rotulo: "Início", resumo: "Próxima aula, avisos, prazos e pendências." },
  { href: "/calendario", rotulo: "Calendário", resumo: "Aulas, eventos e competições do ciclo." },
  { href: "/ciclos", rotulo: "Ciclos e aulas", resumo: "Ciclo atual, próximos e o acervo dos anteriores." },
  { href: "/biblioteca", rotulo: "Biblioteca", resumo: "Doutrina, legislação, jurisprudência e apostilas." },
  { href: "/competicoes", rotulo: "Competições", resumo: "Sociecap, CMNA e outras; materiais da equipe." },
  { href: "/oportunidades", rotulo: "Oportunidades", resumo: "Vagas de estágio, cursos, eventos e concursos divulgados pela diretoria." },
  { href: "/producao", rotulo: "Produção", resumo: "Carrosséis do Instagram e mini-artigos do LinkedIn." },
  { href: "/tira-duvidas", rotulo: "Tira-dúvidas", resumo: "Perguntas públicas ou privadas, validadas pela diretoria." },
  { href: "/trajetoria", rotulo: "Minha trajetória", resumo: "Presença, leituras, perguntas e equipes." },
  { href: "/a-liga", rotulo: "A Liga", resumo: "O que é a liga, regras do Grupo de Estudos e Código de Conduta." },
  { href: "/regularizacao", rotulo: "Regularização", resumo: "Documentos da liga: estatuto, eleições, atas e registros.", gestao: true },
  { href: "/professores", rotulo: "Professores", resumo: "Banco de professores: contatos, temas e aulas dadas.", gestao: true },
  { href: "/gestao", rotulo: "Gestão", resumo: "Membros, frequência, planejamento e curadoria.", gestao: true },
];
