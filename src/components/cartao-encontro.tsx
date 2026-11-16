import { FolderOpen, Paperclip } from "lucide-react";
import { Cartao } from "@/components/ui";
import { ehHoje, jaPassou, rotuloEncontro, type Encontro } from "@/lib/ciclos";
import { curta, hora, semana } from "@/lib/datas";

/** Cartão de um encontro do ciclo; os de aula levam à página da aula. */

export function CartaoEncontro({ encontro: e, proximo }: { encontro: Encontro; proximo: boolean }) {
  const passado = jaPassou(e);
  const conteudo = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="numeral text-sm text-grafite">
          <span className="font-semibold text-tinta">{curta(e.inicio)}</span> · {semana(e.inicio)} · {hora(e.inicio)}
        </p>
        {proximo ? (
          <span className="selo selo-vinho">{ehHoje(e) ? "Hoje" : "Próxima"}</span>
        ) : passado ? (
          <span className="selo">Realizada</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm font-semibold text-vinho">{rotuloEncontro(e)}</p>
      <h3 className={`h3 mt-0.5 ${passado && !proximo ? "text-grafite" : ""}`}>{e.titulo}</h3>
      <p className="mt-1 text-[0.9375rem] text-grafite">
        {e.professor ? `com ${e.professor}` : e.tipo === "aula" ? "Professor a confirmar" : (e.descricao ?? e.local)}
      </p>
      {e.tipo === "aula" ? (
        <p className="mt-auto flex items-center gap-3 pt-4 text-sm text-grafite">
          <span className="inline-flex items-center gap-1">
            <Paperclip aria-hidden="true" className="size-3.5" />
            {e.materiais} {e.materiais === 1 ? "anexo" : "anexos"}
          </span>
          {e.local ? (
            <span className="inline-flex items-center gap-1 truncate">
              <FolderOpen aria-hidden="true" className="size-3.5" />
              {e.local}
            </span>
          ) : null}
        </p>
      ) : null}
    </>
  );
  return e.aulaId ? (
    <Cartao href={`/ciclos/aulas/${e.aulaId}`} destaque={proximo} className="min-h-44">
      {conteudo}
    </Cartao>
  ) : (
    <Cartao destaque={proximo} className="min-h-44 bg-sutil/60">
      {conteudo}
    </Cartao>
  );
}
