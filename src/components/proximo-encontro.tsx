import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin } from "lucide-react";
import {
  ehHoje,
  formatarDataLonga,
  formatarHora,
  rotuloEncontro,
  type Encontro,
} from "@/lib/ciclos";

/** Painel do Início: o encontro de hoje ou o próximo. É o único bloco em vinho cheio da plataforma. */
export function ProximoEncontro({
  proximo,
  ciclo,
}: {
  proximo: Encontro | null;
  ciclo: string | null;
}) {
  const destino = proximo?.aulaId
    ? `/ciclos/aulas/${proximo.aulaId}`
    : "/ciclos";
  return (
    <section
      aria-labelledby="proximo-encontro"
      className="rounded-2xl bg-vinho p-6 text-white sm:p-8"
    >
      {proximo ? (
        <>
          <p className="text-sm font-semibold text-white/85">
            {ehHoje(proximo) ? "Encontro de hoje" : "Próximo encontro"} ·{" "}
            {rotuloEncontro(proximo)}
            {ciclo ? ` · Ciclo ${ciclo}` : ""}
          </p>
          <h2
            id="proximo-encontro"
            className="mt-2 text-2xl leading-tight font-bold tracking-[-0.015em] sm:text-[1.75rem]"
          >
            {proximo.titulo}
          </h2>
          {proximo.professor ? (
            <p className="mt-1.5 text-white/90">com {proximo.professor}</p>
          ) : null}
          <ul className="mt-5 flex flex-col gap-2 text-[0.9375rem] sm:flex-row sm:flex-wrap sm:gap-x-6">
            <li className="flex items-center gap-2">
              <CalendarDays
                aria-hidden="true"
                className="size-[1.125rem] shrink-0 text-white/80"
                strokeWidth={1.75}
              />
              <span>
                <span className="inline-block first-letter:uppercase">
                  {formatarDataLonga(proximo.inicio)}
                </span>
                , às {formatarHora(proximo.inicio)}
              </span>
            </li>
            {proximo.local ? (
              <li className="flex items-center gap-2">
                <MapPin
                  aria-hidden="true"
                  className="size-[1.125rem] shrink-0 text-white/80"
                  strokeWidth={1.75}
                />
                {proximo.local}
              </li>
            ) : null}
          </ul>
          <Link
            href={destino}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[0.625rem] bg-white px-4 text-[0.9375rem] font-semibold text-vinho transition-colors hover:bg-vinho-suave focus-visible:outline-white"
          >
            {proximo.aulaId
              ? "Ver professor e bibliografia"
              : "Ver o cronograma"}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </>
      ) : (
        <>
          <h2 id="proximo-encontro" className="text-xl font-bold">
            Não há encontros marcados
          </h2>
          <Link
            href="/ciclos"
            className="mt-4 inline-block font-semibold underline underline-offset-4"
          >
            Ver ciclos e aulas
          </Link>
        </>
      )}
    </section>
  );
}
