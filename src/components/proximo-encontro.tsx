import Link from "next/link";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { ehHoje, formatarDiaDaSemana, formatarHora, partesDaData, rotuloEncontro, type Encontro } from "@/lib/ciclos";

const FUSO = "America/Recife";

/** "hoje", "amanhã" ou "em N dias", contando dias de calendário no fuso da liga. */
function distancia(iso: string, agora = new Date()): string {
  const dia = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: FUSO }).format(d);
  const dias = Math.round((Date.parse(dia(new Date(iso))) - Date.parse(dia(agora))) / 86_400_000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

/**
 * Painel do Início: o encontro de hoje ou o próximo. É o único bloco em vinho cheio da plataforma.
 * A data aparece como uma folha de calendário, o objeto que organiza a vida da liga.
 */
export function ProximoEncontro({ proximo, ciclo }: { proximo: Encontro | null; ciclo: string | null }) {
  if (!proximo) {
    return (
      <section aria-labelledby="proximo-encontro" className="cartao flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <h2 id="proximo-encontro" className="h3">
            Não há encontros marcados
          </h2>
          <p className="mt-1 text-grafite">Quando a diretoria publicar o próximo ciclo, ele aparece aqui.</p>
        </div>
        <Link href="/ciclos" className="botao botao-secundario group shrink-0">
          Ver ciclos e aulas
          <ArrowRight aria-hidden="true" className="seta size-4" />
        </Link>
      </section>
    );
  }

  const destino = proximo.aulaId ? `/ciclos/aulas/${proximo.aulaId}` : "/ciclos";
  const { dia, mes } = partesDaData(proximo.inicio);
  const semana = formatarDiaDaSemana(proximo.inicio).replace("-feira", "");
  const hoje = ehHoje(proximo);

  return (
    <section
      aria-labelledby="proximo-encontro"
      className="relative isolate overflow-hidden rounded-[1.25rem] bg-vinho text-white"
    >
      {/* Luz suave no canto: dá profundidade ao vinho sem mudar a cor da marca. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(120%_90%_at_100%_0%,rgb(255_255_255/0.12),transparent_55%),radial-gradient(90%_80%_at_0%_100%,var(--lds-vinho-profundo),transparent_70%)]"
      />

      <div className="flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
        {/* Folha de calendário */}
        <div
          aria-hidden="true"
          className="flex w-[5.5rem] shrink-0 flex-col items-center self-start overflow-hidden rounded-2xl bg-white text-tinta sm:w-24"
        >
          <span className="w-full bg-vinho-escuro py-1 text-center text-xs font-semibold text-white/90">{mes}</span>
          <span className="numeral pt-1.5 text-[2.75rem] leading-none font-extrabold tracking-[-0.04em] sm:text-5xl">{dia}</span>
          <span className="pt-1 pb-2.5 text-xs font-medium text-grafite">{semana}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-white/80">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 font-semibold text-white">
              {hoje ? (
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/80 motion-reduce:hidden" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                </span>
              ) : null}
              {hoje ? "Encontro de hoje" : `Próximo encontro, ${distancia(proximo.inicio)}`}
            </span>
            <span>{rotuloEncontro(proximo)}</span>
            {ciclo ? <span aria-hidden="true">·</span> : null}
            {ciclo ? <span>Ciclo {ciclo}</span> : null}
          </p>

          <h2 id="proximo-encontro" className="mt-3 text-[1.625rem] leading-[1.15] font-bold tracking-[-0.022em] sm:text-[2rem]">
            {proximo.titulo}
          </h2>
          {proximo.professor ? <p className="mt-1.5 text-[1.0625rem] text-white/85">com {proximo.professor}</p> : null}

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <ul className="flex flex-col gap-1.5 text-[0.9375rem] text-white/90 sm:flex-row sm:flex-wrap sm:gap-x-5">
              <li className="flex items-center gap-2">
                <Clock aria-hidden="true" className="size-4 shrink-0 text-white/70" strokeWidth={1.75} />
                <span>
                  <span className="sr-only">
                    {semana}, {dia} de {mes},{" "}
                  </span>
                  às {formatarHora(proximo.inicio)}
                </span>
              </li>
              {proximo.local ? (
                <li className="flex items-center gap-2">
                  <MapPin aria-hidden="true" className="size-4 shrink-0 text-white/70" strokeWidth={1.75} />
                  {proximo.local}
                </li>
              ) : null}
            </ul>
            <Link
              href={destino}
              className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[0.625rem] bg-white px-4 text-[0.9375rem] font-semibold text-vinho transition-[background-color,transform] duration-150 ease-saida hover:bg-vinho-suave focus-visible:outline-white active:scale-[0.97] sm:self-auto"
            >
              {proximo.aulaId ? "Ver professor e bibliografia" : "Ver o cronograma"}
              <ArrowRight aria-hidden="true" className="seta size-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
