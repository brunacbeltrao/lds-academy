import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Minha trajetória" };

const BLOCOS: Bloco[] = [
  { titulo: "Presença, faltas e justificativas", descricao: "Frequência no ciclo, com limite de três faltas." },
  { titulo: "Leituras e aulas concluídas", descricao: "Progresso no ciclo atual e nos anteriores." },
  { titulo: "Minhas perguntas e respostas", descricao: "Histórico no tira-dúvidas." },
  { titulo: "Minhas equipes de competição", descricao: "Equipes de que o membro participa." },
];

export default function TrajetoriaPage() {
  return (
    <PaginaArea
      titulo="Minha trajetória"
      descricao="O registro individual de participação na liga."
      blocos={BLOCOS}
    />
  );
}
