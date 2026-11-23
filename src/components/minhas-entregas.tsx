import { diaDaSemana, formatarData, quantoFalta, type Entrega } from "@/lib/producao-formato";

/** Âncora de uma publicação no calendário da Produção. */
export function ancoraDaProducao(id: string): string {
  return `producao-${id}`;
}

/**
 * Próximas entregas do membro na Produção (autoria e revisão), cada uma levando à publicação no calendário.
 * `base` é o caminho da página do calendário: vazio quando a lista já está nela.
 */
export function MinhasEntregas({ entregas, hoje, base = "" }: { entregas: Entrega[]; hoje: string; base?: string }) {
  const ano = hoje.slice(0, 4);
  return (
    <ol className="flex flex-col gap-2.5">
      {entregas.map(({ producao: p, papel, etapa, prazo }) => {
        const falta = quantoFalta(prazo, hoje);
        const urgente = falta === "hoje" || falta === "amanhã";
        const artigo = p.tipo === "artigo";
        return (
          <li key={`${p.id}-${papel}`}>
            <a
              href={`${base}#${ancoraDaProducao(p.id)}`}
              className={`flex gap-4 rounded-[0.875rem] border p-4 transition-colors sm:gap-5 sm:p-5 ${
                urgente ? "border-vinho-borda bg-vinho-suave hover:border-vinho/40" : "border-linha bg-superficie hover:border-linha-forte hover:bg-sutil"
              }`}
            >
              <div className="w-14 shrink-0 sm:w-16">
                <p className="text-lg leading-tight font-bold text-tinta tabular-nums">
                  {prazo.slice(8, 10)}/{prazo.slice(5, 7)}
                </p>
                <p className="text-xs text-grafite">{prazo.slice(0, 4) !== ano ? prazo.slice(0, 4) : diaDaSemana(prazo)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="selo">
                    {artigo ? "Artigo" : "Post"} {String(p.numero ?? "").padStart(2, "0")}
                  </span>
                  <span className="selo selo-suave border border-vinho-borda">{papel === "autoria" ? "Autoria" : "Revisão"}</span>
                  {p.status === "atrasado" ? <span className="selo selo-vinho">Atrasado</span> : null}
                </div>
                <h3 className="h3 mt-1.5">
                  {etapa} <span className="font-normal whitespace-nowrap text-grafite">· {falta}</span>
                </h3>
                <p className="mt-0.5 text-[0.9375rem] text-tinta">{p.tema ?? "Tema a definir"}</p>
                {etapa !== "Publicação" ? (
                  <p className="mt-1 text-sm text-grafite">
                    {artigo ? "LinkedIn" : "Instagram"}, publicação em {diaDaSemana(p.publicacao)}, {formatarData(p.publicacao, ano)}
                  </p>
                ) : null}
              </div>
            </a>
          </li>
        );
      })}
    </ol>
  );
}
