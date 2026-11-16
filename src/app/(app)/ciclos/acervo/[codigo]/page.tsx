import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CronogramaDoAcervo } from "@/components/acervo";
import { CabecalhoDaPagina, Cartao, DestinoDoCartao, Grade, Pagina, Secao, Vazio } from "@/components/ui";
import { getCiclo, periodoDoCiclo, rotuloAula, rotuloDoCiclo } from "@/lib/ciclos";

export const metadata: Metadata = { title: "Acervo" };

export default async function CicloDoAcervoPage({ params }: PageProps<"/ciclos/acervo/[codigo]">) {
  const { codigo } = await params;
  const dados = await getCiclo(decodeURIComponent(codigo));
  if (!dados) notFound();
  const { ciclo, cronograma, semData } = dados;
  const periodo = periodoDoCiclo(ciclo.inicio, ciclo.fim);
  const aulasNoCronograma = cronograma.filter((e) => e.tipo === "aula").length;

  return (
    <Pagina larga>
      <Link href="/ciclos?aba=acervo" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Acervo
      </Link>
      <CabecalhoDaPagina
        contexto={
          <>
            Ciclo {rotuloDoCiclo(ciclo.codigo)}
            {periodo ? <span className="first-letter:uppercase"> · {periodo}</span> : null}
          </>
        }
        titulo={ciclo.titulo}
        descricao={ciclo.descricao ?? undefined}
        acoes={
          ciclo.pasta_url ? (
            <a href={ciclo.pasta_url} target="_blank" rel="noopener noreferrer" className="botao botao-secundario">
              Pasta do semestre
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : null
        }
      />

      {cronograma.length > 0 ? (
        <Secao
          id="cronograma"
          titulo="Cronograma"
          descricao={`${aulasNoCronograma} ${aulasNoCronograma === 1 ? "aula" : "aulas"} e ${cronograma.length - aulasNoCronograma} ${
            cronograma.length - aulasNoCronograma === 1 ? "evento" : "eventos"
          }, conforme o calendário oficial do semestre.`}
        >
          <CronogramaDoAcervo cronograma={cronograma} />
        </Secao>
      ) : null}

      {semData.length > 0 ? (
        <Secao
          id="aulas"
          titulo={cronograma.length > 0 ? "Outras aulas no Drive" : "Aulas"}
          descricao={
            cronograma.length > 0
              ? "Aulas com material no Drive que não aparecem no calendário do semestre."
              : "O calendário deste semestre ainda não foi registrado. As aulas abaixo levam aos materiais no Drive."
          }
        >
          <Grade>
            {semData.map((a) => (
              <Cartao key={a.id} href={a.pasta_url ?? undefined} externo={Boolean(a.pasta_url)} className="min-h-32">
                <p className="text-sm font-semibold text-vinho">{rotuloAula(a.numero)}</p>
                <h3 className="h3 mt-1">{a.titulo}</h3>
                {a.professor ? <p className="mt-1 text-[0.9375rem] text-grafite">com {a.professor}</p> : null}
                {a.pasta_url ? <DestinoDoCartao rotulo="Materiais no Drive" externo /> : null}
              </Cartao>
            ))}
          </Grade>
        </Secao>
      ) : null}

      {cronograma.length === 0 && semData.length === 0 ? <Vazio titulo="Sem aulas cadastradas" /> : null}
    </Pagina>
  );
}
