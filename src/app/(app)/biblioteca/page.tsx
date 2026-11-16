import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Biblioteca" };

const BLOCOS: Bloco[] = [
  { titulo: "Doutrina", descricao: "Por tema, autor e ciclo." },
  { titulo: "Legislação e jurisprudência", descricao: "Dispositivos e julgados de referência." },
  { titulo: "Apostilas da liga", descricao: "Material didático do Grupo de Estudos." },
  { titulo: "Artigos produzidos pela liga", descricao: "Produção dos membros." },
  { titulo: "Busca e favoritos", descricao: "Pesquisa em todo o acervo e lista pessoal de favoritos." },
];

export default function BibliotecaPage() {
  return (
    <PaginaArea
      titulo="Biblioteca"
      descricao="O acervo da liga, organizado por tema, autor e ciclo. Os itens abrem no Drive da liga."
      blocos={BLOCOS}
    />
  );
}
