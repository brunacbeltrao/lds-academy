import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Calendário" };

const BLOCOS: Bloco[] = [
  { titulo: "Visão mensal e semanal", descricao: "Alternância entre o mês inteiro e a semana em detalhe." },
  { titulo: "Filtro por ciclo e tipo", descricao: "Seleção por ciclo e por tipo de compromisso." },
  { titulo: "Aulas, eventos e competições", descricao: "Todos os compromissos da liga, criados e editados pela diretoria." },
  { titulo: "Sincronizar com Google Agenda", descricao: "Assinatura do calendário da liga na agenda pessoal." },
];

export default function CalendarioPage() {
  return (
    <PaginaArea
      titulo="Calendário"
      descricao="Aulas, eventos e competições da liga em um só calendário."
      blocos={BLOCOS}
    />
  );
}
