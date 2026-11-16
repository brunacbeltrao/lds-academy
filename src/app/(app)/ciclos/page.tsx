import type { Metadata } from "next";
import { Cronograma } from "@/components/cronograma";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { formatarDia, getCicloAtual, proximoEncontro } from "@/lib/ciclos";

export const metadata: Metadata = { title: "Ciclos e aulas" };

const BLOCOS: Bloco[] = [
  { titulo: "Próximo ciclo", descricao: "2027.1 · M&A." },
  { titulo: "Ciclos anteriores", descricao: "Acervo por tema, aberto a todos os membros." },
];

export default async function CiclosPage() {
  const atual = await getCicloAtual();
  const proximo = atual ? proximoEncontro(atual.encontros) : null;
  const aulas = atual?.encontros.filter((e) => e.tipo === "aula").length ?? 0;

  return (
    <PaginaArea titulo="Ciclos e aulas" descricao="O cronograma do ciclo em curso, com professor, bibliografia e anexos de cada aula." blocos={BLOCOS}>
      <section aria-labelledby="ciclo-atual">
        {atual ? (
          <>
            <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
              <h2 id="ciclo-atual" className="h2">
                {atual.ciclo.titulo}
              </h2>
              <p className="numeral text-[0.9375rem] text-grafite">
                Ciclo {atual.ciclo.codigo}
                {atual.ciclo.inicio && atual.ciclo.fim
                  ? ` · ${formatarDia(atual.ciclo.inicio + "T12:00:00-03:00")} a ${formatarDia(atual.ciclo.fim + "T12:00:00-03:00")}`
                  : ""}
                {` · ${aulas} aulas`}
              </p>
            </div>
            <Cronograma encontros={atual.encontros} proximoId={proximo?.id ?? null} />
          </>
        ) : (
          <p className="cartao p-5 text-grafite">Nenhum ciclo em curso no momento.</p>
        )}
      </section>
    </PaginaArea>
  );
}
