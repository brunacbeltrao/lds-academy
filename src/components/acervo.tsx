import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Cartao, DestinoDoCartao, Grade, Secao } from "@/components/ui";
import { periodoDoCiclo, rotuloAula, rotuloDoCiclo } from "@/lib/ciclos";

export type CicloDoAcervo = {
  id: string;
  codigo: string;
  titulo: string;
  inicio: string | null;
  fim: string | null;
  descricao: string | null;
  aulas: number;
};

export type LinhaDoAcervo = {
  id: string;
  titulo: string;
  tipo: "aula" | "evento" | "competicao" | "prazo" | "outro";
  inicio: string;
  aula: { id: string; numero: number | null } | null;
};

const OUTROS = "Outros temas";

/** Ciclos encerrados agrupados por tema, cada um com o período e o número de aulas. */
export function AcervoPorTema({ grupos }: { grupos: { tema: string; id: string; ciclos: CicloDoAcervo[] }[] }) {
  return grupos.map((grupo) => (
    <Secao key={grupo.id} id={grupo.id} titulo={grupo.tema}>
      <Grade>
        {grupo.ciclos.map((c) => {
          const periodo = periodoDoCiclo(c.inicio, c.fim);
          return (
            <Cartao key={c.id} href={`/ciclos/acervo/${c.codigo}`}>
              <p className="numeral text-sm font-semibold text-vinho">{rotuloDoCiclo(c.codigo)}</p>
              {grupo.tema === OUTROS ? <h3 className="h3 mt-1">{c.titulo}</h3> : null}
              <p className={`text-sm text-grafite first-letter:uppercase ${grupo.tema === OUTROS ? "mt-1" : "mt-0.5"}`}>
                {periodo ?? "Datas não registradas"}
              </p>
              {c.descricao ? <p className="mt-2 line-clamp-3 text-[0.9375rem] text-tinta">{c.descricao}</p> : null}
              <p className="mt-3 text-sm text-grafite">
                {c.aulas} {c.aulas === 1 ? "aula" : "aulas"} no acervo
              </p>
              <DestinoDoCartao rotulo={periodo ? "Ver o cronograma" : "Ver as aulas"} />
            </Cartao>
          );
        })}
      </Grade>
    </Secao>
  ));
}

const FUSO = "America/Recife";

function dataCompleta(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(iso));
}

function diaDaSemana(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, weekday: "short" }).format(new Date(iso)).replace(".", "");
}

function rotuloDaLinha(e: LinhaDoAcervo): string {
  if (e.tipo !== "aula") return "Evento";
  if (!e.aula) return "Aula";
  return rotuloAula(e.aula.numero);
}

/** Cronograma de um ciclo anterior: data, rótulo e título; leva à aula quando ela existe no acervo. */
export function CronogramaDoAcervo({ cronograma }: { cronograma: LinhaDoAcervo[] }) {
  return (
    <ol className="cartao divide-y divide-linha overflow-hidden">
      {cronograma.map((e) => {
        const conteudo = (
          <>
            <div className="w-24 shrink-0 sm:w-28">
              <p className="numeral text-[0.9375rem] font-semibold text-tinta">{dataCompleta(e.inicio)}</p>
              <p className="text-sm text-grafite">{diaDaSemana(e.inicio)}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${e.tipo === "aula" ? "text-vinho" : "text-grafite"}`}>{rotuloDaLinha(e)}</p>
              <p className="mt-0.5 font-medium text-tinta">{e.titulo}</p>
            </div>
            {e.aula ? (
              <ChevronRight aria-hidden="true" className="seta size-5 shrink-0 self-center text-grafite transition-colors group-hover:text-vinho" />
            ) : null}
          </>
        );
        const classes = "flex gap-4 px-4 py-3.5 sm:gap-6 sm:px-5";
        return (
          <li key={e.id}>
            {e.aula ? (
              <Link href={`/ciclos/aulas/${e.aula.id}`} className={`group ${classes} transition-colors hover:bg-sutil`}>
                {conteudo}
              </Link>
            ) : (
              <div className={`${classes} ${e.tipo === "aula" ? "" : "bg-sutil/60"}`}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
