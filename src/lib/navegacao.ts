export type ItemMenu = { href: string; rotulo: string; resumo: string; soDiretoria?: boolean };

/** As sete áreas do menu principal (docs/sitemap.md) e a Gestão, só da diretoria. */
export const MENU: ItemMenu[] = [
  { href: "/", rotulo: "Início", resumo: "Próxima aula, avisos, prazos e pendências." },
  { href: "/calendario", rotulo: "Calendário", resumo: "Aulas, eventos e competições do ciclo." },
  { href: "/ciclos", rotulo: "Ciclos e aulas", resumo: "Ciclo atual, próximos e o acervo dos anteriores." },
  { href: "/biblioteca", rotulo: "Biblioteca", resumo: "Doutrina, legislação, jurisprudência e apostilas." },
  { href: "/competicoes", rotulo: "Competições", resumo: "Sociecap, CMNA e outras; materiais da equipe." },
  { href: "/tira-duvidas", rotulo: "Tira-dúvidas", resumo: "Perguntas públicas ou privadas, validadas pela diretoria." },
  { href: "/trajetoria", rotulo: "Minha trajetória", resumo: "Presença, leituras, perguntas e equipes." },
  { href: "/gestao", rotulo: "Gestão", resumo: "Membros, frequência, planejamento e curadoria.", soDiretoria: true },
];
