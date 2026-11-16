import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { ProximoEncontro } from "@/components/proximo-encontro";
import { getCicloAtual, proximoEncontro } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";

export const metadata: Metadata = { title: "Início" };

const BLOCOS: Bloco[] = [
  { titulo: "Leitura da semana", descricao: "Leitura indicada para o próximo encontro do Grupo de Estudos." },
  { titulo: "Avisos da diretoria", descricao: "Comunicados da diretoria, com os mais importantes fixados no topo." },
  { titulo: "Prazos de competições", descricao: "Inscrições, entregas de peças e rodadas que se aproximam." },
  { titulo: "Perguntas recentes", descricao: "As últimas dúvidas públicas do tira-dúvidas." },
  { titulo: "Minhas pendências", descricao: "Leituras por fazer, justificativas em análise e respostas aguardando validação." },
];

export default async function InicioPage() {
  const [membro, atual] = await Promise.all([getMembroAtual(), getCicloAtual()]);
  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;
  const hoje = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", weekday: "long", day: "numeric", month: "long" }).format(new Date());

  return (
    <PaginaArea
      titulo={`Olá, ${primeiroNome}`}
      descricao="O que vem a seguir na liga."
      contexto={<span className="inline-block first-letter:uppercase">{hoje}</span>}
      blocos={BLOCOS}
    >
      <ProximoEncontro proximo={proximo} ciclo={atual?.ciclo.codigo ?? null} />
    </PaginaArea>
  );
}
