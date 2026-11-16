import type { Metadata } from "next";
import Link from "next/link";
import { CartaoEncontro } from "@/components/cartao-encontro";
import { AcervoPorTema } from "@/components/acervo";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, Pagina, Vazio, type Aba } from "@/components/ui";
import { acervoPorTema, getCicloAtual, getCiclos, jaPassou, proximoEncontro } from "@/lib/ciclos";

export const metadata: Metadata = { title: "Ciclos e aulas" };

export default async function CiclosPage({ searchParams }: PageProps<"/ciclos">) {
  const [{ aba }, atual, ciclos] = await Promise.all([searchParams, getCicloAtual(), getCiclos()]);
  const planejados = ciclos.filter((c) => c.status === "planejado");
  const encerrados = ciclos.filter((c) => c.status === "encerrado");

  const abas: Aba[] = [
    { id: "atual", rotulo: atual ? `Ciclo ${atual.ciclo.codigo}` : "Ciclo atual" },
    { id: "proximo", rotulo: "Próximo ciclo" },
    { id: "acervo", rotulo: "Acervo", contagem: encerrados.length },
  ];
  const ativa = abaAtual(aba, abas);

  return (
    <Pagina larga>
      <CabecalhoDaPagina titulo="Ciclos e aulas" descricao="O cronograma do Grupo de Estudos, as aulas de cada ciclo e o acervo dos semestres anteriores." />
      <Abas base="/ciclos" atual={ativa} itens={abas} />

      {ativa === "atual" ? <CicloAtual atual={atual} /> : null}

      {ativa === "proximo" ? (
        planejados.length === 0 ? (
          <Vazio titulo="Nenhum ciclo planejado" texto="Quando a diretoria planejar o próximo ciclo, o tema e as aulas aparecem aqui." />
        ) : (
          <div className="flex flex-col gap-3">
            {planejados.map((c) => (
              <section key={c.id} className="cartao p-5 sm:p-7">
                <p className="text-sm font-medium text-grafite">Ciclo {c.codigo} · em planejamento</p>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.02em] text-tinta">{c.titulo}</h2>
                {c.descricao ? <p className="prosa mt-2 text-grafite">{c.descricao}</p> : null}
                <p className="mt-4 text-[0.9375rem] text-tinta">
                  {c.aulas > 0 ? `${c.aulas} aulas já cadastradas.` : "O cronograma ainda não foi publicado."}{" "}
                  <Link href="/ciclos?aba=acervo#tema-fusoes-e-aquisicoes" className="link">
                    Estudar pelos ciclos anteriores de M&A
                  </Link>
                </p>
              </section>
            ))}
          </div>
        )
      ) : null}

      {ativa === "acervo" ? (
        <>
          <p className="prosa mb-2 text-grafite">
            Os semestres anteriores, por tema: o cronograma com as datas de cada encontro e os materiais das aulas, que ficam no Drive da liga.
          </p>
          <AcervoPorTema grupos={acervoPorTema(encerrados)} />
        </>
      ) : null}
    </Pagina>
  );
}

function CicloAtual({ atual }: { atual: Awaited<ReturnType<typeof getCicloAtual>> }) {
  if (!atual) return <Vazio titulo="Nenhum ciclo em curso" texto="O cronograma do próximo ciclo aparece aqui quando for publicado." />;
  const proximo = proximoEncontro(atual.encontros);
  const aulas = atual.encontros.filter((e) => e.tipo === "aula").length;
  const realizadas = atual.encontros.filter((e) => e.tipo === "aula" && jaPassou(e)).length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h2 className="h2">{atual.ciclo.titulo}</h2>
          {atual.ciclo.descricao ? <p className="prosa mt-1 text-grafite">{atual.ciclo.descricao}</p> : null}
        </div>
        <p className="numeral text-[0.9375rem] text-grafite">
          {realizadas} de {aulas} aulas realizadas
        </p>
      </div>
      <Grade>
        {atual.encontros.map((e) => (
          <CartaoEncontro key={e.id} encontro={e} proximo={e.id === proximo?.id} />
        ))}
      </Grade>
    </>
  );
}
