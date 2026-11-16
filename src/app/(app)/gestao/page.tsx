import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { exigirDiretoria } from "@/lib/membro";

export const metadata: Metadata = { title: "Gestão" };

const BLOCOS: Bloco[] = [
  { titulo: "Membros e papéis", descricao: "A lista oficial, que define quem acessa a plataforma." },
  { titulo: "Frequência e justificativas", descricao: "Registro de presença; o diretor acadêmico aceita ou recusa justificativas." },
  { titulo: "Planejamento do ciclo", descricao: "Cronograma, aulas e leituras." },
  { titulo: "Curadoria da biblioteca e da base da IA", descricao: "Cadastro e classificação dos links do Drive." },
  { titulo: "Edições e equipes de competição", descricao: "Criação de edições e montagem das equipes." },
  { titulo: "Fila do tira-dúvidas", descricao: "Validar respostas e responder às perguntas privadas." },
  { titulo: "Avisos e relatórios do ciclo", descricao: "Publicação de avisos e acompanhamento do ciclo." },
];

export default async function GestaoPage() {
  await exigirDiretoria();
  return (
    <PaginaArea
      rotulo="Gestão · só diretoria"
      titulo="Gestão"
      descricao="Administração da liga: membros, frequência, planejamento e curadoria."
      blocos={BLOCOS}
    />
  );
}
