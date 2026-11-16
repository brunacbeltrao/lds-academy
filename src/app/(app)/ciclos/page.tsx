import type { Metadata } from "next";
import Link from "next/link";
import { CartaoEncontro } from "@/components/cartao-encontro";
import { AcervoPorTema } from "@/components/acervo";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, Pagina, Vazio, type Aba } from "@/components/ui";
import { acervoPorTema, getCicloAtual, getCiclos, getEncontrosDoCiclo, jaPassou, periodoDoCiclo, proximoEncontro, type CicloResumo } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";

export const metadata: Metadata = { title: "Ciclos e aulas" };

export default async function CiclosPage({ searchParams }: PageProps<"/ciclos">) {
  const [{ aba }, atual, ciclos, membro] = await Promise.all([searchParams, getCicloAtual(), getCiclos(), getMembroAtual()]);
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
          <div className="flex flex-col gap-10">
            {planejados.map((c) => (
              <ProximoCiclo key={c.id} ciclo={c} gestao={membro.papel !== "ligante"} />
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

/** Próximo ciclo: o tema e, depois que a diretoria publica, o cronograma em cartões. */
async function ProximoCiclo({ ciclo: c, gestao }: { ciclo: CicloResumo; gestao: boolean }) {
  const encontros = c.cronograma_publicado ? await getEncontrosDoCiclo(c.id) : [];
  const periodo = periodoDoCiclo(c.inicio, c.fim);
  return (
    <section aria-labelledby={`ciclo-${c.codigo}`}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-sm font-medium text-grafite">
            Ciclo {c.codigo}
            {periodo ? ` · ${periodo}` : ""}
          </p>
          <h2 id={`ciclo-${c.codigo}`} className="h2 mt-0.5">
            {c.titulo}
          </h2>
          {c.descricao ? <p className="prosa mt-1 text-grafite">{c.descricao}</p> : null}
        </div>
        {gestao ? (
          <Link href={`/gestao/planejamento/${c.codigo}`} className="botao botao-secundario">
            Abrir o planejamento
          </Link>
        ) : null}
      </div>
      {encontros.length > 0 ? (
        <Grade>
          {encontros.map((e) => (
            <CartaoEncontro key={e.id} encontro={e} proximo={false} />
          ))}
        </Grade>
      ) : (
        <p className="cartao p-5 text-[0.9375rem] text-tinta">
          O cronograma ainda está em planejamento pela diretoria.{" "}
          <Link href="/ciclos?aba=acervo" className="link">
            Estudar pelos ciclos anteriores
          </Link>
        </p>
      )}
    </section>
  );
}
