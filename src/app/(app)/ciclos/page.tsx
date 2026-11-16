import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Ciclos e aulas" };

const BLOCOS: Bloco[] = [
  { titulo: "Ciclo atual", descricao: "2026.2 · Introdução ao Societário." },
  { titulo: "Próximo ciclo", descricao: "2027.1 · M&A." },
  { titulo: "Ciclos anteriores", descricao: "Acervo por tema, aberto a todos os membros." },
  { titulo: "Página da aula", descricao: "Slides, leituras e apostila de cada encontro." },
];

export default function CiclosPage() {
  return (
    <PaginaArea
      rotulo="Ciclos e aulas"
      titulo="Ciclos e aulas"
      descricao="O ciclo em curso, o próximo e o acervo dos ciclos anteriores, aberto a todos os membros."
      blocos={BLOCOS}
    />
  );
}
