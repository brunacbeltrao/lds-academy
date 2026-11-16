import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";

export const metadata: Metadata = { title: "Tira-dúvidas" };

const BLOCOS: Bloco[] = [
  { titulo: "Feed público", descricao: "Dúvidas públicas, por ciclo e tema." },
  { titulo: "Perguntar", descricao: "Em público, para toda a liga, ou em privado, direto à diretoria." },
  { titulo: "Respostas dos ligantes", descricao: "Qualquer ligante responde às perguntas públicas." },
  { titulo: "Rascunho da IA", descricao: "Proposta de resposta com base na biblioteca da liga." },
  { titulo: "Validação da diretoria", descricao: "Nenhuma resposta aparece antes de ser validada." },
];

export default function TiraDuvidasPage() {
  return (
    <PaginaArea
      titulo="Tira-dúvidas"
      descricao="Perguntas públicas ou privadas. Toda resposta passa pela diretoria antes de ser publicada."
      blocos={BLOCOS}
    />
  );
}
