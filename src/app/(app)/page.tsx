import type { Metadata } from "next";
import Link from "next/link";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import {
  ehHoje,
  formatarDataLonga,
  formatarHora,
  getCicloAtual,
  proximoEncontro,
  rotuloEncontro,
} from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";

export const metadata: Metadata = { title: "Início" };

const BLOCOS: Bloco[] = [
  { titulo: "Leitura da semana", descricao: "Leitura indicada para o próximo encontro do Grupo de Estudos." },
  { titulo: "Avisos da diretoria", descricao: "Comunicados publicados pela diretoria, com os mais importantes fixados no topo." },
  { titulo: "Prazos de competições", descricao: "Inscrições, entregas de peças e rodadas que se aproximam." },
  { titulo: "Perguntas recentes", descricao: "As últimas dúvidas públicas do tira-dúvidas, por ciclo e tema." },
  { titulo: "Minhas pendências", descricao: "Leituras por fazer, justificativas em análise e respostas aguardando validação." },
];

export default async function InicioPage() {
  const [membro, atual] = await Promise.all([getMembroAtual(), getCicloAtual()]);
  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;

  return (
    <PaginaArea
      rotulo="Início"
      titulo={`Boas-vindas, ${primeiroNome}`}
      descricao="O que importa nesta semana na liga: o próximo encontro, os avisos da diretoria e os seus prazos."
      blocos={BLOCOS}
    >
      <section aria-labelledby="proximo-encontro" className="mt-8 border-l-4 border-vinho bg-rosa p-6">
        <p className="rotulo text-vinho">
          {proximo ? (ehHoje(proximo) ? "Encontro de hoje" : "Próximo encontro") : "Próximo encontro"}
          {proximo && atual ? ` · ${rotuloEncontro(proximo)} · Ciclo ${atual.ciclo.codigo}` : ""}
        </p>
        {proximo ? (
          <>
            <h2 id="proximo-encontro" className="titulo mt-2 text-3xl">
              {proximo.titulo}
            </h2>
            <p className="mt-2 text-tinta">
              <span className="first-letter:uppercase">{formatarDataLonga(proximo.inicio)}</span>, às{" "}
              {formatarHora(proximo.inicio)} · FDR
            </p>
          </>
        ) : (
          <h2 id="proximo-encontro" className="mt-2 text-lg text-tinta">
            Não há encontros marcados.
          </h2>
        )}
        <Link href="/ciclos" className="mt-4 inline-block text-vinho underline underline-offset-4 hover:text-vinho-profundo">
          Ver o cronograma do ciclo
        </Link>
      </section>
    </PaginaArea>
  );
}
