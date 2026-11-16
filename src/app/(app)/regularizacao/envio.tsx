"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIAS } from "@/lib/documentos";
import { createClient } from "@/lib/supabase/client";
import { registrarDocumento, type Resultado } from "./actions";

const LIMITE = 50 * 1024 * 1024;

export function EnvioDeDocumento() {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<Resultado>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const arquivo = dados.get("arquivo");
    const titulo = String(dados.get("titulo") ?? "").trim();
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      setEstado({ ok: false, mensagem: "Escolha o PDF do documento." });
      return;
    }
    if (arquivo.type !== "application/pdf" || arquivo.size > LIMITE) {
      setEstado({ ok: false, mensagem: "O arquivo precisa ser um PDF de até 50 MB." });
      return;
    }

    setEstado(null);
    setEnviando(true);
    const caminho = `${crypto.randomUUID()}.pdf`;
    const supabase = createClient();
    const { error } = await supabase.storage
      .from("documentos")
      .upload(caminho, arquivo, { contentType: "application/pdf", upsert: false });
    if (error) {
      setEnviando(false);
      setEstado({ ok: false, mensagem: "Não foi possível enviar o arquivo. Tente de novo." });
      return;
    }

    const resultado = await registrarDocumento({
      titulo: titulo || arquivo.name.replace(/\.pdf$/i, "").replace(/_+/g, " ").trim(),
      categoria: String(dados.get("categoria") ?? "outros"),
      descricao: String(dados.get("descricao") ?? ""),
      dataDocumento: String(dados.get("data") ?? ""),
      arquivo: caminho,
      tamanho: arquivo.size,
    });
    setEnviando(false);
    setEstado(resultado);
    if (resultado?.ok) {
      formulario.current?.reset();
      router.refresh();
    }
  }

  return (
    <form ref={formulario} onSubmit={enviar} className="prosa flex flex-col gap-5">
      <div>
        <label htmlFor="arquivo" className="rotulo-campo">
          Arquivo em PDF
        </label>
        <input
          id="arquivo"
          name="arquivo"
          type="file"
          accept="application/pdf"
          required
          disabled={enviando}
          className="block w-full cursor-pointer rounded-[0.625rem] border border-linha-forte bg-superficie text-sm text-grafite file:mr-4 file:min-h-11 file:cursor-pointer file:border-0 file:bg-transparent file:px-4 file:font-semibold file:text-vinho hover:border-grafite"
        />
        <p className="mt-1.5 text-sm text-grafite">Até 50 MB.</p>
      </div>
      <div>
        <label htmlFor="titulo" className="rotulo-campo">
          Título
        </label>
        <input id="titulo" name="titulo" maxLength={200} placeholder="Ex.: Edital do processo eleitoral 2026.2" className="campo" />
        <p className="mt-1.5 text-sm text-grafite">Em branco, usa o nome do arquivo.</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="categoria" className="rotulo-campo">
            Categoria
          </label>
          <select id="categoria" name="categoria" defaultValue="eleicoes" className="campo">
            {CATEGORIAS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.rotulo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="data" className="rotulo-campo">
            Data do documento
          </label>
          <input id="data" name="data" type="date" className="campo" />
        </div>
      </div>
      <div>
        <label htmlFor="descricao" className="rotulo-campo">
          Observação
        </label>
        <input id="descricao" name="descricao" maxLength={1000} placeholder="Opcional" className="campo" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enviando} className="botao">
          {enviando ? "Enviando…" : "Adicionar documento"}
        </button>
        {estado ? (
          <p role="status" className={`aviso surgir ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
            {estado.mensagem}
          </p>
        ) : null}
      </div>
    </form>
  );
}
