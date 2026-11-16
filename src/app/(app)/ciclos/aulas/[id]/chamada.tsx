"use client";

import { useActionState, useMemo, useState } from "react";
import { STATUS_PRESENCA, type LinhaDaChamada, type StatusPresenca } from "@/lib/presenca-formato";
import { salvarChamada, type Resultado } from "./actions";

type Mapa = Record<string, StatusPresenca | null>;

function contar(mapa: Mapa) {
  const total = { presente: 0, falta: 0, justificada: 0, semRegistro: 0 };
  for (const status of Object.values(mapa)) {
    if (status) total[status] += 1;
    else total.semRegistro += 1;
  }
  return total;
}

function plural(n: number, um: string, varios: string) {
  return `${n} ${n === 1 ? um : varios}`;
}

/** Resumo da chamada em uma linha: "12 presentes · 2 faltas · 1 justificada · 3 sem registro". */
function Resumo({ mapa }: { mapa: Mapa }) {
  const t = contar(mapa);
  const partes = [
    plural(t.presente, "presente", "presentes"),
    plural(t.falta, "falta", "faltas"),
    plural(t.justificada, "justificada", "justificadas"),
  ];
  if (t.semRegistro > 0) partes.push(`${t.semRegistro} sem registro`);
  return <p className="text-[0.9375rem] text-grafite tabular-nums">{partes.join(" · ")}</p>;
}

function Nome({ linha }: { linha: LinhaDaChamada }) {
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span className="font-medium break-words text-tinta">{linha.nome}</span>
      {linha.papel === "diretoria" ? <span className="selo border border-linha bg-superficie">Diretoria</span> : null}
    </span>
  );
}

/**
 * Chamada da aula. A diretoria marca e salva; o conselho vê a mesma lista em modo leitura.
 * Os rádios enviam `presenca:<membroId>`; quem fica sem marcação não é gravado.
 */
export function Chamada({
  aulaId,
  linhas,
  editavel,
}: {
  aulaId: string;
  linhas: LinhaDaChamada[];
  editavel: boolean;
}) {
  const inicial = useMemo<Mapa>(() => Object.fromEntries(linhas.map((l) => [l.membroId, l.status])), [linhas]);
  const [mapa, setMapa] = useState<Mapa>(inicial);
  const [estado, acao, salvando] = useActionState<Resultado, FormData>(salvarChamada, null);

  const alterado = linhas.some((l) => mapa[l.membroId] !== l.status);
  const semRegistro = linhas.filter((l) => !mapa[l.membroId]).length;

  if (linhas.length === 0) {
    return <p className="text-grafite">Nenhum membro ativo na lista.</p>;
  }

  if (!editavel) {
    return (
      <>
        <Resumo mapa={inicial} />
        <ul className="mt-4 border-t border-linha">
          {linhas.map((l) => (
            <li key={l.membroId} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-linha py-3">
              <Nome linha={l} />
              <span className={l.status ? "text-tinta" : "text-grafite"}>
                {STATUS_PRESENCA.find((s) => s.id === l.status)?.rotulo ?? "Sem registro"}
              </span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <form action={acao}>
      <input type="hidden" name="aulaId" value={aulaId} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Resumo mapa={mapa} />
        {semRegistro > 0 ? (
          <button
            type="button"
            onClick={() =>
              setMapa((atual) => Object.fromEntries(Object.entries(atual).map(([id, s]) => [id, s ?? "presente"])))
            }
            className="min-h-11 rounded-[0.625rem] border border-linha-forte bg-superficie px-3.5 text-sm font-semibold text-tinta transition-colors hover:border-grafite"
          >
            {semRegistro === 1
              ? "Marcar 1 sem registro como presente"
              : `Marcar os ${semRegistro} sem registro como presentes`}
          </button>
        ) : null}
      </div>

      <ul className="mt-4 border-t border-linha-forte">
        {linhas.map((l) => (
          <li key={l.membroId} className="border-b border-linha-forte py-3">
            <fieldset className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <legend className="sr-only">Presença de {l.nome}</legend>
              <Nome linha={l} />
              <div className="grid shrink-0 grid-cols-3 gap-1 rounded-[0.75rem] border border-linha-forte bg-superficie p-1 sm:w-[21rem]">
                {STATUS_PRESENCA.map((s) => (
                  <label
                    key={s.id}
                    className="relative flex min-h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-tinta has-checked:bg-vinho-suave has-checked:font-semibold has-checked:text-vinho has-focus-visible:outline-2 has-focus-visible:outline-vinho"
                  >
                    <input
                      type="radio"
                      name={`presenca:${l.membroId}`}
                      value={s.id}
                      checked={mapa[l.membroId] === s.id}
                      onChange={() => setMapa((atual) => ({ ...atual, [l.membroId]: s.id }))}
                      className="sr-only"
                    />
                    {s.rotulo}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={salvando} className="botao">
          {salvando ? "Salvando…" : "Salvar chamada"}
        </button>
        {alterado && !salvando ? (
          <p role="status" className="text-sm text-grafite">
            Há alterações não salvas.
          </p>
        ) : estado ? (
          <p role="status" className={`aviso ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
            {estado.mensagem}
          </p>
        ) : null}
      </div>
    </form>
  );
}
