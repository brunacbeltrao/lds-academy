import Link from "next/link";
import { Painel } from "@/components/ui";
import { curta } from "@/lib/datas";
import type { PrazoDaProducao } from "@/lib/prazos-producao";

/**
 * Painel do Início. Cada membro vê os próprios prazos (como autor ou revisor);
 * a diretoria e o conselho veem também os do resto da liga, para acompanhar.
 */
export function PrazosDaProducao({ meus, daLiga, gestao }: { meus: PrazoDaProducao[]; daLiga: PrazoDaProducao[]; gestao: boolean }) {
  return (
    <Painel titulo={gestao ? "Prazos da produção" : "Seus prazos da produção"} link={{ href: "/producao", rotulo: "Produção" }}>
      {gestao ? (
        <>
          {meus.length > 0 ? <Grupo titulo="Seus" itens={meus} /> : null}
          <Grupo titulo="Da liga" itens={daLiga} vazio="Nenhum outro prazo próximo." separado={meus.length > 0} />
        </>
      ) : meus.length > 0 ? (
        <Lista itens={meus} className="-my-2" />
      ) : (
        <p className="text-[0.9375rem] text-grafite">Você não tem prazos de produção pela frente.</p>
      )}
    </Painel>
  );
}

function Grupo({ titulo, itens, vazio, separado = false }: { titulo: string; itens: PrazoDaProducao[]; vazio?: string; separado?: boolean }) {
  return (
    <div className={separado ? "mt-4 border-t border-linha pt-3" : undefined}>
      <h3 className="mb-1 text-sm font-medium text-grafite">{titulo}</h3>
      {itens.length > 0 ? <Lista itens={itens} className="-mb-2" /> : <p className="text-[0.9375rem] text-grafite">{vazio}</p>}
    </div>
  );
}

function Lista({ itens, className }: { itens: PrazoDaProducao[]; className: string }) {
  return (
    <ul className={`divide-y divide-linha ${className}`}>
      {itens.map((p) => (
        <li key={p.id}>
          <Link href={`/producao/${p.id}`} className="group flex items-baseline justify-between gap-3 py-2.5">
            <span className="min-w-0">
              <span className="block font-medium text-tinta group-hover:text-vinho">{p.titulo}</span>
              <span className="block truncate text-sm text-grafite">{p.tema ?? "Tema a definir"}</span>
            </span>
            <span className="shrink-0 text-right text-sm">
              <span className="numeral block font-semibold text-tinta">{curta(p.data)}</span>
              <span className="text-grafite">{p.rotulo}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
