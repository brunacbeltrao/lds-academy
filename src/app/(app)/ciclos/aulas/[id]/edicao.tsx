"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { registrarMaterial, salvarAula, type Resultado } from "./actions";

const LIMITE = 50 * 1024 * 1024;
function Aviso({ estado }: { estado: Resultado }) {
  if (!estado) return null;
  return (
    <p role="status" className={`aviso ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
      {estado.mensagem}
    </p>
  );
}

type Valores = { professor: string; professorBio: string; local: string; bibliografia: string };

export function FormularioAula({ aulaId, valores }: { aulaId: string; valores: Valores }) {
  const [estado, acao, salvando] = useActionState<Resultado, FormData>(salvarAula, null);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="aulaId" value={aulaId} />
      <div>
        <label htmlFor="professor" className="rotulo-campo">
          Professor(a) que deu a aula
        </label>
        <input id="professor" name="professor" defaultValue={valores.professor} maxLength={200} placeholder="Nome completo" className="campo" />
      </div>
      <div>
        <label htmlFor="professor_bio" className="rotulo-campo">
          Apresentação do professor
        </label>
        <textarea id="professor_bio" name="professor_bio" defaultValue={valores.professorBio} rows={4} maxLength={4000} placeholder="Escritório, formação e áreas de atuação" className="campo" />
      </div>
      <div>
        <label htmlFor="local" className="rotulo-campo">
          Local
        </label>
        <input id="local" name="local" defaultValue={valores.local} maxLength={200} className="campo" />
      </div>
      <div>
        <label htmlFor="bibliografia" className="rotulo-campo">
          Bibliografia indicada
        </label>
        <textarea id="bibliografia" name="bibliografia" defaultValue={valores.bibliografia} rows={6} maxLength={8000} placeholder="Uma referência por linha. Os PDFs são anexados logo abaixo." className="campo" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={salvando} className="botao">
          {salvando ? "Salvando…" : "Salvar aula"}
        </button>
        <Aviso estado={estado} />
      </div>
    </form>
  );
}

export function EnvioDeMateriais({ aulaId }: { aulaId: string }) {
  const router = useRouter();
  const entrada = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  const [estado, setEstado] = useState<Resultado>(null);

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const arquivos = Array.from(entrada.current?.files ?? []);
    if (arquivos.length === 0) {
      setEstado({ ok: false, mensagem: "Escolha ao menos um PDF." });
      return;
    }
    const invalido = arquivos.find((a) => a.type !== "application/pdf" || a.size > LIMITE);
    if (invalido) {
      setEstado({ ok: false, mensagem: `"${invalido.name}" não é um PDF de até 50 MB.` });
      return;
    }

    setEstado(null);
    const supabase = createClient();
    let enviados = 0;
    for (const [i, arquivo] of arquivos.entries()) {
      setEnviando(`Enviando ${i + 1} de ${arquivos.length}: ${arquivo.name}`);
      const caminho = `aulas/${aulaId}/${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage
        .from("materiais")
        .upload(caminho, arquivo, { contentType: "application/pdf", upsert: false });
      if (error) {
        setEstado({ ok: false, mensagem: `Não foi possível enviar "${arquivo.name}". ${enviados} de ${arquivos.length} enviados.` });
        break;
      }
      const titulo = arquivo.name.replace(/\.pdf$/i, "").replace(/[_]+/g, " ").trim() || "Anexo";
      const registro = await registrarMaterial({ aulaId, titulo, arquivo: caminho, tamanho: arquivo.size });
      if (!registro?.ok) {
        setEstado(registro ?? { ok: false, mensagem: "Não foi possível registrar o anexo." });
        break;
      }
      enviados += 1;
    }
    setEnviando(null);
    if (enviados === arquivos.length) {
      setEstado({ ok: true, mensagem: enviados === 1 ? "1 anexo adicionado." : `${enviados} anexos adicionados.` });
      if (entrada.current) entrada.current.value = "";
    }
    if (enviados > 0) router.refresh();
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <div>
        <label htmlFor="arquivos" className="rotulo-campo">
          Anexar PDFs da bibliografia
        </label>
        <input
          ref={entrada}
          id="arquivos"
          type="file"
          accept="application/pdf"
          multiple
          disabled={enviando !== null}
          className="block w-full cursor-pointer rounded-[0.625rem] border border-linha-forte bg-superficie text-sm text-grafite file:mr-4 file:min-h-11 file:cursor-pointer file:border-0 file:bg-transparent file:px-4 file:font-semibold file:text-vinho hover:border-grafite"
        />
        <p className="mt-1.5 text-sm text-grafite">Só PDF, até 50 MB por arquivo. O nome do arquivo vira o título do anexo.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={enviando !== null} className="botao">
          {enviando ? "Enviando…" : "Enviar anexos"}
        </button>
        {enviando ? (
          <p role="status" className="text-sm text-grafite">
            {enviando}
          </p>
        ) : (
          <Aviso estado={estado} />
        )}
      </div>
    </form>
  );
}
