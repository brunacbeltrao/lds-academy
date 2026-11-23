import type { Metadata } from "next";
import Link from "next/link";
import { MinhasEntregas } from "@/components/minhas-entregas";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { ProximoEncontro } from "@/components/proximo-encontro";
import { getCicloAtual, proximoEncontro } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { getProducoes } from "@/lib/producao";
import { hojeEmRecife, minhasEntregas } from "@/lib/producao-formato";

export const metadata: Metadata = { title: "Início" };

const BLOCOS: Bloco[] = [
  { titulo: "Leitura da semana", descricao: "Leitura indicada para o próximo encontro do Grupo de Estudos." },
  { titulo: "Avisos da diretoria", descricao: "Comunicados da diretoria, com os mais importantes fixados no topo." },
  { titulo: "Prazos de competições", descricao: "Inscrições, entregas de peças e rodadas que se aproximam." },
  { titulo: "Perguntas recentes", descricao: "As últimas dúvidas públicas do tira-dúvidas." },
  { titulo: "Minhas pendências", descricao: "Leituras por fazer, justificativas em análise e respostas aguardando validação." },
];

/** Quantas entregas de produção o Início mostra; o resto fica na Produção. */
const ENTREGAS_NO_INICIO = 3;

export default async function InicioPage() {
  const [membro, atual, producoes] = await Promise.all([getMembroAtual(), getCicloAtual(), getProducoes()]);
  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;
  const hoje = hojeEmRecife();
  const entregas = minhasEntregas(producoes, membro.nome, hoje);

  return (
    <PaginaArea titulo={`Olá, ${primeiroNome}`} descricao="O que vem a seguir na liga." blocos={BLOCOS}>
      <ProximoEncontro proximo={proximo} ciclo={atual?.ciclo.codigo ?? null} />
      {entregas.length > 0 ? (
        <section aria-labelledby="suas-entregas" className="mt-10">
          <h2 id="suas-entregas" className="h2">
            Suas entregas de produção
          </h2>
          <div className="mt-4">
            <MinhasEntregas entregas={entregas.slice(0, ENTREGAS_NO_INICIO)} hoje={hoje} base="/producao" />
          </div>
          <Link href="/producao#suas-entregas" className="link mt-4 inline-flex min-h-11 items-center">
            {entregas.length > ENTREGAS_NO_INICIO ? `Ver todas as ${entregas.length} entregas` : "Ver o calendário de produção"}
          </Link>
        </section>
      ) : null}
    </PaginaArea>
  );
}
