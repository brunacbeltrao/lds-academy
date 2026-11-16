import { Pin } from "lucide-react";
import { TextoLivre } from "@/components/texto";
import { Recolhivel } from "@/components/ui";
import type { Aviso } from "@/lib/avisos";
import { formatarDataCompleta } from "@/lib/ciclos";
import { alternarFixado, apagarAviso } from "./actions";
import { FormularioAviso } from "./aviso-formulario";

/** Quantos avisos não fixados aparecem abertos; os demais ficam em "Avisos anteriores". */
const RECENTES = 4;

const BOTAO_DISCRETO =
  "inline-flex min-h-11 cursor-pointer items-center rounded-lg px-3 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-vinho-escuro";

function ItemAviso({ aviso, diretoria }: { aviso: Aviso; diretoria: boolean }) {
  return (
    <article
      aria-labelledby={`aviso-${aviso.id}`}
      className={aviso.fixado ? "rounded-[0.875rem] border border-vinho-borda bg-vinho-suave p-4 sm:p-5" : "border-b border-linha py-5"}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {aviso.fixado ? (
          <span className="selo selo-vinho">
            <Pin aria-hidden="true" className="size-3" strokeWidth={2} />
            Fixado
          </span>
        ) : null}
        <p className="text-sm text-grafite">
          <time dateTime={aviso.publicadoEm}>{formatarDataCompleta(aviso.publicadoEm)}</time>
        </p>
      </div>
      <h3 id={`aviso-${aviso.id}`} className="h3 mt-1.5">
        {aviso.titulo}
      </h3>
      <TextoLivre texto={aviso.corpo} className="mt-2 text-tinta" />

      {diretoria ? (
        <div className="-ml-3 mt-3 flex flex-wrap items-center gap-1">
          <form action={alternarFixado}>
            <input type="hidden" name="avisoId" value={aviso.id} />
            <input type="hidden" name="fixar" value={aviso.fixado ? "nao" : "sim"} />
            <button type="submit" className={BOTAO_DISCRETO}>
              {aviso.fixado ? "Desafixar" : "Fixar no topo"}
            </button>
          </form>
          <form action={apagarAviso}>
            <input type="hidden" name="avisoId" value={aviso.id} />
            <button type="submit" aria-label={`Remover o aviso ${aviso.titulo}`} className={BOTAO_DISCRETO}>
              Remover
            </button>
          </form>
          <details className="group open:basis-full">
            <summary className={`${BOTAO_DISCRETO} list-none [&::-webkit-details-marker]:hidden`}>
              <span className="group-open:hidden">Editar</span>
              <span className="hidden group-open:inline">Fechar edição</span>
            </summary>
            <div className="prosa mt-3 ml-3 rounded-[0.875rem] border border-linha bg-superficie p-4 sm:p-5">
              <FormularioAviso valores={{ id: aviso.id, titulo: aviso.titulo, corpo: aviso.corpo, fixado: aviso.fixado }} />
            </div>
          </details>
        </div>
      ) : null}
    </article>
  );
}

/** Avisos da diretoria no Início. A diretoria publica, corrige, fixa e remove ali mesmo. */
export function Avisos({ avisos, diretoria }: { avisos: Aviso[]; diretoria: boolean }) {
  const fixados = avisos.filter((a) => a.fixado);
  const outros = avisos.filter((a) => !a.fixado);
  const recentes = outros.slice(0, RECENTES);
  const anteriores = outros.slice(RECENTES);

  return (
    <section aria-labelledby="avisos" className="mt-12">
      <h2 id="avisos" className="h2">
        Avisos da diretoria
      </h2>

      {diretoria ? (
        <div className="mt-4">
          <Recolhivel titulo="Publicar aviso">
            <div className="prosa">
              <FormularioAviso />
            </div>
          </Recolhivel>
        </div>
      ) : null}

      {avisos.length === 0 ? (
        <p className="mt-4 text-grafite">Nenhum aviso no momento.</p>
      ) : (
        <>
          {fixados.length > 0 ? (
            <div className="mt-5 flex flex-col gap-3">
              {fixados.map((a) => (
                <ItemAviso key={a.id} aviso={a} diretoria={diretoria} />
              ))}
            </div>
          ) : null}
          {recentes.length > 0 ? (
            <div className={fixados.length > 0 ? "mt-2" : "mt-1"}>
              {recentes.map((a) => (
                <ItemAviso key={a.id} aviso={a} diretoria={diretoria} />
              ))}
            </div>
          ) : null}
          {anteriores.length > 0 ? (
            <div className="mt-5">
              <Recolhivel titulo={`Avisos anteriores (${anteriores.length})`}>
                <div className="-mt-5 [&>article:last-child]:border-b-0 [&>article:last-child]:pb-0">
                  {anteriores.map((a) => (
                    <ItemAviso key={a.id} aviso={a} diretoria={diretoria} />
                  ))}
                </div>
              </Recolhivel>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
