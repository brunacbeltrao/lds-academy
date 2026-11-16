import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { CabecalhoDaPagina, Cartao, DestinoDoCartao, Grade, Pagina, Vazio } from "@/components/ui";
import { getCiclo, rotuloAula } from "@/lib/ciclos";
import { curta } from "@/lib/datas";

export const metadata: Metadata = { title: "Acervo" };

export default async function CicloDoAcervoPage({ params }: PageProps<"/ciclos/acervo/[codigo]">) {
  const { codigo } = await params;
  const dados = await getCiclo(decodeURIComponent(codigo));
  if (!dados) notFound();
  const { ciclo, aulas } = dados;

  return (
    <Pagina larga>
      <Link href="/ciclos?aba=acervo" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Acervo
      </Link>
      <CabecalhoDaPagina
        contexto={`Ciclo ${ciclo.codigo.replace("-", " e ")}`}
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
      {aulas.length === 0 ? (
        <Vazio titulo="Sem aulas cadastradas" />
      ) : (
        <Grade>
          {aulas.map((a) => {
            const href = a.data ? `/ciclos/aulas/${a.id}` : (a.pasta_url ?? undefined);
            return (
              <Cartao key={a.id} href={href} externo={!a.data && Boolean(a.pasta_url)} className="min-h-36">
                <p className="text-sm font-semibold text-vinho">
                  {rotuloAula(a.numero)}
                  {a.data ? <span className="numeral font-normal text-grafite"> · {curta(a.data)}</span> : null}
                </p>
                <h2 className="h3 mt-1">{a.titulo}</h2>
                {a.professor ? <p className="mt-1 text-[0.9375rem] text-grafite">com {a.professor}</p> : null}
                {href ? <DestinoDoCartao rotulo={a.data ? "Abrir a aula" : "Materiais no Drive"} externo={!a.data} /> : null}
              </Cartao>
            );
          })}
        </Grade>
      )}
    </Pagina>
  );
}
