import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { getMembroAtual } from "@/lib/membro";

export const metadata: Metadata = { title: "Início" };

const BLOCOS: Bloco[] = [
  { titulo: "Próxima aula e leitura", descricao: "Data, tema e leitura indicada para o próximo encontro do Grupo de Estudos." },
  { titulo: "Avisos da diretoria", descricao: "Comunicados publicados pela diretoria, com os mais importantes fixados no topo." },
  { titulo: "Prazos de competições", descricao: "Inscrições, entregas de peças e rodadas que se aproximam." },
  { titulo: "Perguntas recentes", descricao: "As últimas dúvidas públicas do tira-dúvidas, por ciclo e tema." },
  { titulo: "Minhas pendências", descricao: "Leituras por fazer, justificativas em análise e respostas aguardando validação." },
];

export default async function InicioPage() {
  const membro = await getMembroAtual();
  const primeiroNome = membro.nome.split(" ")[0];
  return (
    <PaginaArea
      rotulo="Início"
      titulo={`Boas-vindas, ${primeiroNome}`}
      descricao="O que importa nesta semana na liga: a próxima aula, os avisos da diretoria e os seus prazos."
      blocos={BLOCOS}
    />
  );
}
