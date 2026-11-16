import type { Metadata } from "next";
import { Cronograma } from "@/components/cronograma";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { formatarDia, getCicloAtual, proximoEncontro } from "@/lib/ciclos";

export const metadata: Metadata = { title: "Ciclos e aulas" };

const BLOCOS: Bloco[] = [
  { titulo: "Próximo ciclo", descricao: "2027.1 · M&A." },
  { titulo: "Ciclos anteriores", descricao: "Acervo por tema, aberto a todos os membros." },
  { titulo: "Página da aula", descricao: "Slides, leituras e apostila de cada encontro." },
];

export default async function CiclosPage() {
  const atual = await getCicloAtual();
  const proximo = atual ? proximoEncontro(atual.encontros) : null;
  const aulas = atual?.encontros.filter((e) => e.tipo === "aula").length ?? 0;

  return (
    <PaginaArea
      rotulo="Ciclos e aulas"
      titulo="Ciclos e aulas"
      descricao="O ciclo em curso, o próximo e o acervo dos ciclos anteriores, aberto a todos os membros."
      blocos={BLOCOS}
    >
      <section aria-labelledby="ciclo-atual" className="mt-10">
        {atual ? (
          <>
            <p className="rotulo text-grafite">Ciclo atual · {atual.ciclo.codigo}</p>
            <h2 id="ciclo-atual" className="titulo mt-1 text-3xl">
              {atual.ciclo.titulo}
            </h2>
            <p className="mt-2 mb-6 text-grafite">
              {atual.ciclo.inicio && atual.ciclo.fim
                ? `De ${formatarDia(atual.ciclo.inicio + "T12:00:00-03:00")} a ${formatarDia(atual.ciclo.fim + "T12:00:00-03:00")} · `
                : ""}
              {aulas} aulas · encontros às 20h, nas salas da FDR
            </p>
            <Cronograma encontros={atual.encontros} proximoId={proximo?.id ?? null} />
          </>
        ) : (
          <p className="border border-filete bg-papel p-6 text-grafite">Nenhum ciclo em curso no momento.</p>
        )}
      </section>
    </PaginaArea>
  );
}
