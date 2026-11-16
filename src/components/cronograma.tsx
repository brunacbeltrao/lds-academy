import { Paperclip } from "lucide-react";
import { ehHoje, formatarDiaDaSemana, jaPassou, partesDaData, rotuloEncontro, type Encontro } from "@/lib/ciclos";
import { LinhaDoTempo, type Momento } from "@/components/linha-do-tempo";

const FUSO = "America/Recife";
const nomeDoMes = (iso: string) => new Intl.DateTimeFormat("pt-BR", { timeZone: FUSO, month: "long" }).format(new Date(iso));

/** Cronograma do ciclo em linha do tempo; os encontros de aula levam à página da aula. */
export function Cronograma({ encontros, proximoId }: { encontros: Encontro[]; proximoId: string | null }) {
  return (
    <LinhaDoTempo
      itens={encontros.map((e) => {
        const momento: Momento = e.id === proximoId ? "proximo" : jaPassou(e) ? "passado" : "futuro";
        const passado = momento === "passado";
        return {
          id: e.id,
          dia: partesDaData(e.inicio).dia,
          apoio: formatarDiaDaSemana(e.inicio).replace("-feira", ""),
          grupo: nomeDoMes(e.inicio),
          momento,
          href: e.aulaId ? `/ciclos/aulas/${e.aulaId}` : undefined,
          conteudo: (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="selo">{rotuloEncontro(e)}</span>
                {momento === "proximo" ? <span className="selo selo-vinho">{ehHoje(e) ? "Hoje" : "Próximo"}</span> : null}
                {e.tipo === "aula" && e.materiais > 0 ? (
                  <span className="selo">
                    <Paperclip aria-hidden="true" className="size-3" />
                    {e.materiais} {e.materiais === 1 ? "anexo" : "anexos"}
                  </span>
                ) : null}
              </div>
              <h4 className={`h3 mt-2 ${passado ? "text-grafite" : ""}`}>{e.titulo}</h4>
              {e.professor ? (
                <p className="mt-0.5 text-[0.9375rem] text-grafite">
                  com <span className={`font-medium ${passado ? "" : "text-tinta"}`}>{e.professor}</span>
                </p>
              ) : e.tipo === "aula" ? (
                <p className="mt-0.5 text-[0.9375rem] text-grafite">Professor a informar</p>
              ) : null}
              {e.descricao ? <p className="mt-1 text-[0.9375rem] text-grafite">{e.descricao}</p> : null}
            </>
          ),
        };
      })}
    />
  );
}
