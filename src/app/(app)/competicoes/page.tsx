import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Competições" };

const BLOCOS: Bloco[] = [
  { titulo: "Sociecap, CMNA e outras", descricao: "As competições de que a liga participa." },
  { titulo: "Edital, regras e prazos", descricao: "Documentos oficiais e calendário de cada edição." },
  { titulo: "Casos e peças de edições anteriores", descricao: "Acervo para estudo e preparação." },
  { titulo: "Equipes", descricao: "Acesso restrito à equipe selecionada e à diretoria." },
  { titulo: "Trilha de preparação e treinos", descricao: "Roteiro de estudo e agenda de treinos da equipe." },
];

export default function CompeticoesPage() {
  return (
    <PaginaArea
      titulo="Competições"
      descricao="Editais e prazos das competições, com o espaço de trabalho de cada equipe."
      blocos={BLOCOS}
    />
  );
}
