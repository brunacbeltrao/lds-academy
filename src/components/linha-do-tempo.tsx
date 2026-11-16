import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export type Momento = "passado" | "proximo" | "futuro";

export type ItemDaLinha = {
  id: string;
  /** Dia do mês, com dois dígitos. */
  dia: string;
  /** Linha curta abaixo do dia (dia da semana ou ano). */
  apoio: string;
  /** Nome do mês: abre um novo grupo sempre que muda. */
  grupo: string;
  momento: Momento;
  href?: string;
  conteudo: ReactNode;
};

/**
 * Linha do tempo do ciclo: datas à esquerda, um trilho com marcos e os cartões à direita.
 * O que já passou fica esmaecido; o próximo leva o marco e o cartão em vinho suave.
 */
export function LinhaDoTempo({ itens }: { itens: ItemDaLinha[] }) {
  const grupos: { nome: string; itens: ItemDaLinha[] }[] = [];
  for (const item of itens) {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.nome === item.grupo) ultimo.itens.push(item);
    else grupos.push({ nome: item.grupo, itens: [item] });
  }

  return (
    <div className="flex flex-col gap-7">
      {grupos.map((g) => (
        <section key={g.nome} aria-label={g.nome}>
          <h3 className="mb-3 pl-[5.25rem] text-sm font-semibold text-grafite first-letter:uppercase sm:pl-[6.25rem]">{g.nome}</h3>
          <ol className="flex flex-col">
            {g.itens.map((item, i) => (
              <Linha key={item.id} item={item} ultimo={i === g.itens.length - 1} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Linha({ item, ultimo }: { item: ItemDaLinha; ultimo: boolean }) {
  const { momento } = item;
  const marco =
    momento === "proximo"
      ? "size-3 bg-vinho ring-4 ring-vinho-borda"
      : momento === "passado"
        ? "size-2 bg-linha-forte"
        : "size-2.5 border-2 border-linha-forte bg-fundo";

  const cartao = `flex min-w-0 flex-1 items-center gap-3 rounded-[0.875rem] border p-4 sm:p-5 ${
    momento === "proximo"
      ? "border-vinho-borda bg-vinho-suave"
      : momento === "passado"
        ? "border-linha/70 bg-superficie/55"
        : "border-linha bg-superficie shadow-cartao"
  }`;

  const corpo = (
    <>
      <div className="min-w-0 flex-1">{item.conteudo}</div>
      {item.href ? (
        <ChevronRight
          aria-hidden="true"
          className="seta size-5 shrink-0 text-linha-forte transition-colors group-hover:text-vinho"
          strokeWidth={1.75}
        />
      ) : null}
    </>
  );

  return (
    <li aria-current={momento === "proximo" ? "true" : undefined} className="grid grid-cols-[3rem_1.25rem_1fr] gap-x-2 sm:grid-cols-[3.5rem_1.75rem_1fr]">
      {/* Data */}
      <div className={`pt-4 text-right sm:pt-5 ${momento === "passado" ? "text-grafite" : "text-tinta"}`}>
        <p className="numeral text-[1.375rem] leading-none font-bold tracking-[-0.03em] sm:text-2xl">{item.dia}</p>
        <p className="mt-1 text-xs text-grafite">{item.apoio}</p>
      </div>

      {/* Trilho e marco */}
      <div aria-hidden="true" className="relative flex justify-center">
        <span className={`absolute top-0 w-px bg-linha ${ultimo ? "h-6 sm:h-7" : "bottom-0"}`} />
        <span className={`relative mt-[1.3rem] rounded-full sm:mt-[1.55rem] ${marco}`} />
      </div>

      {/* Cartão */}
      <div className={ultimo ? "" : "pb-2.5"}>
        {item.href ? (
          <Link href={item.href} className={`group cartao-link ${cartao}`}>
            {corpo}
          </Link>
        ) : (
          <div className={cartao}>{corpo}</div>
        )}
      </div>
    </li>
  );
}
