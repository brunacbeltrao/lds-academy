import Link from "next/link";
import { ChevronRight, Paperclip } from "lucide-react";
import { ehHoje, formatarDia, formatarDiaDaSemana, jaPassou, rotuloEncontro, type Encontro } from "@/lib/ciclos";

/** Cronograma do ciclo: um card por encontro; os de aula levam à página da aula. */
export function Cronograma({ encontros, proximoId }: { encontros: Encontro[]; proximoId: string | null }) {
  return (
    <ol className="flex flex-col gap-2.5">
      {encontros.map((e) => {
        const destaque = e.id === proximoId;
        const passado = jaPassou(e);
        const conteudo = (
          <>
            <div className="w-14 shrink-0 sm:w-16">
              <p className={`text-lg leading-tight font-bold tabular-nums ${passado ? "text-grafite" : "text-tinta"}`}>
                {formatarDia(e.inicio)}
              </p>
              <p className="text-xs text-grafite">{formatarDiaDaSemana(e.inicio).replace("-feira", "")}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="selo">{rotuloEncontro(e)}</span>
                {destaque ? <span className="selo selo-vinho">{ehHoje(e) ? "Hoje" : "Próximo"}</span> : null}
                {e.tipo === "aula" && e.materiais > 0 ? (
                  <span className="selo">
                    <Paperclip aria-hidden="true" className="size-3" />
                    {e.materiais} {e.materiais === 1 ? "anexo" : "anexos"}
                  </span>
                ) : null}
              </div>
              <h3 className="h3 mt-1.5">{e.titulo}</h3>
              {e.professor ? (
                <p className="mt-0.5 text-[0.9375rem] text-grafite">
                  com <span className="font-medium text-tinta">{e.professor}</span>
                </p>
              ) : e.tipo === "aula" ? (
                <p className="mt-0.5 text-[0.9375rem] text-grafite">Professor a informar</p>
              ) : null}
              {e.descricao ? <p className="mt-1 text-[0.9375rem] text-grafite">{e.descricao}</p> : null}
            </div>
            {e.aulaId ? <ChevronRight aria-hidden="true" className="size-5 shrink-0 self-center text-linha-forte transition-colors group-hover:text-vinho" /> : null}
          </>
        );
        const classes = `flex gap-4 rounded-[0.875rem] border p-4 sm:gap-5 sm:p-5 ${
          destaque ? "border-vinho-borda bg-vinho-suave" : "border-linha bg-superficie"
        }`;
        return (
          <li key={e.id} aria-current={destaque ? "true" : undefined}>
            {e.aulaId ? (
              <Link href={`/ciclos/aulas/${e.aulaId}`} className={`group ${classes} transition-colors duration-150 hover:border-linha-forte`}>
                {conteudo}
              </Link>
            ) : (
              <div className={classes}>{conteudo}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
