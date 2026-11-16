import Link from "next/link";
import { CalendarClock, Pin, Users } from "lucide-react";
import { enderecoDoCartaz, prazoProximo, SELO_TIPO, textoDoPrazo, type Oportunidade } from "@/lib/oportunidades-formato";

/** Cartão do mural: cartaz (quando há), tipo, prazo, título, quem oferece e quantos vão. */
export function CartaoOportunidade({ oportunidade: o, compacto = false }: { oportunidade: Oportunidade; compacto?: boolean }) {
  const prazo = textoDoPrazo(o);
  const cartaz = enderecoDoCartaz(o);
  return (
    <Link href={`/oportunidades/${o.id}`} className={`group cartao cartao-link flex overflow-hidden ${compacto ? "flex-row" : "flex-col"}`}>
      {cartaz && !compacto ? (
        <div className="aspect-[4/3] overflow-hidden border-b border-linha bg-sutil">
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Storage por link temporário */}
          <img src={cartaz} alt="" loading="lazy" className="size-full object-cover object-top transition-transform duration-300 ease-saida group-hover:scale-[1.02]" />
        </div>
      ) : null}
      <div className={`flex min-w-0 flex-1 flex-col ${compacto ? "p-3.5" : "p-4 sm:p-5"}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          {o.fixada ? (
            <span className="selo selo-suave">
              <Pin aria-hidden="true" className="size-3" strokeWidth={2} />
              Fixada
            </span>
          ) : null}
          <span className="selo">{SELO_TIPO[o.tipo]}</span>
          {!o.aberta ? <span className="selo">Encerrada</span> : null}
        </div>
        <h3 className={`mt-2 font-semibold text-tinta ${compacto ? "text-[0.9375rem] leading-snug" : "h3"}`}>{o.titulo}</h3>
        {o.organizacao ? <p className="text-sm text-grafite">{o.organizacao}</p> : null}
        {!compacto ? <p className="mt-2 line-clamp-3 text-[0.9375rem] text-grafite">{o.descricao}</p> : null}
        {prazo || o.pede_lista ? (
          <div className={`flex flex-wrap gap-x-4 gap-y-1 text-sm ${compacto ? "mt-1.5" : "mt-auto pt-4"}`}>
            {prazo ? (
              <span className={`inline-flex items-center gap-1.5 ${prazoProximo(o) ? "font-semibold text-vinho" : "text-grafite"}`}>
                <CalendarClock aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                {prazo}
              </span>
            ) : null}
            {o.pede_lista ? (
              <span className={`inline-flex items-center gap-1.5 ${o.euVou ? "font-semibold text-vinho" : "text-grafite"}`}>
                <Users aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                {o.euVou ? "Você vai" : `${o.interessados.length} ${o.interessados.length === 1 ? "vai" : "vão"}`}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Link>
  );
}
