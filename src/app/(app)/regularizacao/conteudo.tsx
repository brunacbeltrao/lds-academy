import Link from "next/link";
import { Download, FileText } from "lucide-react";
import { CabecalhoDaPagina, Pagina, Recolhivel } from "@/components/ui";
import { formatarTamanho } from "@/lib/ciclos";
import { CATEGORIAS, formatarDataDoDocumento, type Documento } from "@/lib/documentos";
import { apagarDocumento } from "./actions";
import { EnvioDeDocumento } from "./envio";

/** Regularização: os documentos da liga, por categoria. A diretoria envia; o conselho só lê. */
export function ConteudoDaRegularizacao({ documentos, diretoria }: { documentos: Documento[]; diretoria: boolean }) {
  const grupos = CATEGORIAS.map((c) => ({ ...c, itens: documentos.filter((d) => d.categoria === c.id) }));
  const comDocumentos = grupos.filter((g) => g.itens.length > 0);
  const vazias = grupos.filter((g) => g.itens.length === 0);

  return (
    <Pagina>
      <CabecalhoDaPagina
        titulo="Regularização"
        descricao="Os documentos da liga em um só lugar: estatuto, eleições, atas e registros. Acesso restrito à diretoria e ao conselho."
      />

      {diretoria ? (
        <div className="mb-10">
          <Recolhivel titulo="Adicionar documento">
            <EnvioDeDocumento />
          </Recolhivel>
        </div>
      ) : null}

      {comDocumentos.length === 0 ? (
        <p className="cartao p-5 text-grafite">
          Nenhum documento ainda.{diretoria ? " Use “Adicionar documento” para enviar o primeiro." : ""}
        </p>
      ) : (
        comDocumentos.map((grupo) => (
          <section key={grupo.id} aria-labelledby={`cat-${grupo.id}`} className="mb-10">
            <h2 id={`cat-${grupo.id}`} className="h2">
              {grupo.rotulo}
            </h2>
            <ul className="mt-4 flex flex-col gap-2">
              {grupo.itens.map((d) => (
                <li key={d.id} className="cartao flex items-center gap-3 p-3 pr-2 sm:gap-4 sm:p-4 sm:pr-3">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-vinho-suave text-vinho">
                    <FileText className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/documentos/${d.id}/ler`} className="block font-medium break-words text-tinta underline-offset-4 hover:text-vinho hover:underline">
                      {d.titulo}
                    </Link>
                    <p className="text-sm text-grafite">
                      {[formatarDataDoDocumento(d.data_documento), "PDF", formatarTamanho(d.tamanho), d.descricao].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <a
                    href={`/documentos/${d.id}`}
                    aria-label={`Baixar ${d.titulo}`}
                    title="Baixar"
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg text-grafite transition-colors hover:bg-sutil hover:text-vinho"
                  >
                    <Download aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />
                  </a>
                  {diretoria ? (
                    <form action={apagarDocumento}>
                      <input type="hidden" name="documentoId" value={d.id} />
                      <button
                        type="submit"
                        aria-label={`Remover o documento ${d.titulo}`}
                        className="min-h-10 rounded-lg px-3 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-vinho-escuro"
                      >
                        Remover
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      {vazias.length > 0 && comDocumentos.length > 0 ? (
        <p className="text-sm text-grafite">Sem documentos em: {vazias.map((g) => g.rotulo).join(", ")}.</p>
      ) : null}
    </Pagina>
  );
}
