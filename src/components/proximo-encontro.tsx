import Link from "next/link";
import { ArrowRight, Clock, MapPin, Paperclip } from "lucide-react";
import { ehHoje, rotuloEncontro, type Encontro } from "@/lib/ciclos";
import { hora, longa, quando } from "@/lib/datas";

/**
 * Próximo encontro do Grupo de Estudos. Sem efeitos: o que importa é quando, onde e o quê.
 * A régua embaixo mostra o andamento do ciclo, um traço por encontro.
 */
export function ProximoEncontro({
  proximo,
  ciclo,
  encontros,
}: {
  proximo: Encontro | null;
  ciclo: string | null;
  encontros: Encontro[];
}) {
  if (!proximo) {
    return (
      <section aria-labelledby="proximo-encontro" className="cartao flex flex-col justify-between gap-4 p-5 sm:p-6 lg:col-span-2">
        <div>
          <p className="text-sm font-medium text-grafite">Grupo de Estudos</p>
          <h2 id="proximo-encontro" className="mt-1 text-xl font-bold tracking-[-0.015em] text-tinta">
            O ciclo terminou
          </h2>
          <p className="mt-1 text-grafite">O próximo cronograma aparece aqui assim que a diretoria publicar.</p>
        </div>
        <Link href="/ciclos?aba=proximo" className="botao botao-secundario group self-start">
          Ver o próximo ciclo
          <ArrowRight aria-hidden="true" className="seta size-4" />
        </Link>
      </section>
    );
  }

  const hoje = ehHoje(proximo);
  const destino = proximo.aulaId ? `/ciclos/aulas/${proximo.aulaId}` : "/ciclos";
  const posicao = encontros.findIndex((e) => e.id === proximo.id);

  return (
    <section aria-labelledby="proximo-encontro" className="cartao flex flex-col p-5 sm:p-6 lg:col-span-2">
      <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-grafite">
        <span className={hoje ? "font-semibold text-vinho" : "text-tinta"}>{hoje ? "Hoje" : `Próximo encontro, ${quando(proximo.inicio)}`}</span>
        <span aria-hidden="true">·</span>
        <span>{rotuloEncontro(proximo)}</span>
        {ciclo ? (
          <>
            <span aria-hidden="true">·</span>
            <span>Ciclo {ciclo}</span>
          </>
        ) : null}
      </p>

      <h2 id="proximo-encontro" className="mt-2 text-[1.5rem] leading-[1.15] font-bold tracking-[-0.022em] text-balance text-tinta sm:text-[1.875rem]">
        {proximo.titulo}
      </h2>
      <p className="mt-1.5 text-grafite">{proximo.professor ? `com ${proximo.professor}` : proximo.tipo === "aula" ? "Professor a confirmar" : proximo.descricao}</p>

      <ul className="mt-5 flex flex-col gap-1.5 text-[0.9375rem] text-tinta sm:flex-row sm:flex-wrap sm:gap-x-6">
        <li className="flex items-center gap-2">
          <Clock aria-hidden="true" className="size-4 shrink-0 text-grafite" strokeWidth={1.75} />
          <span className="first-letter:uppercase">{`${longa(proximo.inicio)}, às ${hora(proximo.inicio)}`}</span>
        </li>
        {proximo.local ? (
          <li className="flex items-center gap-2">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-grafite" strokeWidth={1.75} />
            {proximo.local}
          </li>
        ) : null}
        {proximo.materiais > 0 ? (
          <li className="flex items-center gap-2">
            <Paperclip aria-hidden="true" className="size-4 shrink-0 text-grafite" strokeWidth={1.75} />
            {proximo.materiais} {proximo.materiais === 1 ? "anexo" : "anexos"}
          </li>
        ) : null}
      </ul>

      <div className="mt-6 flex flex-col gap-5 border-t border-linha pt-5 sm:flex-row sm:items-center sm:justify-between">
        {encontros.length > 1 ? (
          <div className="min-w-0 flex-1">
            <p className="text-sm text-grafite">
              Encontro <span className="numeral font-semibold text-tinta">{posicao + 1}</span> de{" "}
              <span className="numeral">{encontros.length}</span> do ciclo
            </p>
            <ol aria-hidden="true" className="mt-2 flex max-w-sm gap-1">
              {encontros.map((e, i) => (
                <li
                  key={e.id}
                  className={`h-1.5 flex-1 rounded-full ${i < posicao ? "bg-vinho/70" : i === posicao ? "bg-vinho" : "bg-linha"}`}
                />
              ))}
            </ol>
          </div>
        ) : null}
        <Link href={destino} className="botao group self-start sm:self-auto">
          {proximo.aulaId ? "Abrir a aula" : "Ver o cronograma"}
          <ArrowRight aria-hidden="true" className="seta size-4" />
        </Link>
      </div>
    </section>
  );
}
