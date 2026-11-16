import {
  ehHoje,
  formatarDia,
  formatarDiaDaSemana,
  jaPassou,
  rotuloEncontro,
  type Encontro,
} from "@/lib/ciclos";

/** Cronograma do ciclo: uma linha por encontro, com o de hoje ou o próximo em destaque. */
export function Cronograma({ encontros, proximoId }: { encontros: Encontro[]; proximoId: string | null }) {
  return (
    <ol className="border-t border-filete">
      {encontros.map((e) => {
        const destaque = e.id === proximoId;
        const passado = jaPassou(e);
        return (
          <li
            key={e.id}
            aria-current={destaque ? "true" : undefined}
            className={`grid grid-cols-[5.75rem_1fr] gap-x-4 border-b border-filete px-3 py-4 sm:grid-cols-[5rem_6.5rem_1fr_auto] sm:items-baseline sm:px-4 ${
              destaque ? "border-l-4 border-l-vinho bg-rosa" : "border-l-4 border-l-transparent"
            }`}
          >
            <div className="row-span-2 sm:row-span-1">
              <p className={`text-lg font-bold tabular-nums ${passado ? "text-grafite" : "text-tinta"}`}>
                {formatarDia(e.inicio)}
              </p>
              <p className="text-xs text-grafite sm:hidden">{formatarDiaDaSemana(e.inicio)}</p>
            </div>
            <p className="rotulo text-grafite">
              {rotuloEncontro(e)}
              <span className="hidden font-normal normal-case tracking-normal sm:block">
                {formatarDiaDaSemana(e.inicio)}
              </span>
            </p>
            <p className={`col-start-2 sm:col-start-3 ${passado ? "text-grafite" : "font-semibold text-tinta"}`}>
              {e.titulo}
            </p>
            <p className="rotulo col-start-2 mt-1 text-vinho sm:col-start-4 sm:mt-0 sm:text-right">
              {destaque ? (ehHoje(e) ? "Hoje" : "Próximo") : passado ? <span className="text-grafite">Realizado</span> : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
