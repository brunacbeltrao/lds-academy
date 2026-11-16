"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AreaDeTexto, Campo, Escolha, Marcar } from "@/components/formulario";
import { ROTULO_TIPO, type Oportunidade } from "@/lib/oportunidades-formato";
import { createClient } from "@/lib/supabase/client";
import { salvarOportunidade, type ResultadoDaOportunidade } from "./actions";

const LIMITE = 5 * 1024 * 1024;
const EXTENSAO: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/** "AAAA-MM-DD" e "HH:MM" no fuso de Recife, para preencher os campos na edição. */
function partes(iso: string | null): { dia: string; hora: string } {
  if (!iso) return { dia: "", hora: "" };
  const d = new Date(iso);
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Recife" }).format(d);
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Recife", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return { dia, hora };
}

/**
 * Publicar ou editar uma oportunidade. O cartaz vai direto do navegador ao Storage (a RLS só deixa
 * a diretoria enviar) e depois a ação do servidor registra tudo.
 */
export function FormularioDaOportunidade({ oportunidade }: { oportunidade?: Oportunidade }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState<ResultadoDaOportunidade | null>(null);
  const [pedeLista, setPedeLista] = useState(oportunidade?.pede_lista ?? false);
  const quando = partes(oportunidade?.quando ?? null);
  const prefixo = oportunidade ? "editar" : "nova";

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    const arquivo = dados.get("cartaz");
    const temArquivo = arquivo instanceof File && arquivo.size > 0;
    if (temArquivo && (!EXTENSAO[arquivo.type] || arquivo.size > LIMITE)) {
      setEstado({ ok: false, mensagem: "O cartaz precisa ser uma imagem JPG, PNG ou WebP de até 5 MB." });
      return;
    }

    setEstado(null);
    setEnviando(true);
    let cartazNovo = "";
    if (temArquivo) {
      const caminho = `${crypto.randomUUID()}.${EXTENSAO[arquivo.type]}`;
      const { error } = await createClient().storage.from("mural").upload(caminho, arquivo, { contentType: arquivo.type, upsert: false });
      if (error) {
        setEnviando(false);
        setEstado({ ok: false, mensagem: "Não foi possível enviar o cartaz. Tente de novo." });
        return;
      }
      cartazNovo = caminho;
    }

    const valor = (campo: string) => String(dados.get(campo) ?? "");
    const resultado = await salvarOportunidade({
      id: oportunidade?.id,
      tipo: valor("tipo"),
      titulo: valor("titulo"),
      organizacao: valor("organizacao"),
      descricao: valor("descricao"),
      link: valor("link"),
      contato: valor("contato"),
      local: valor("local"),
      dia: valor("dia"),
      hora: valor("hora"),
      prazo: valor("prazo"),
      pedeLista: dados.get("pede_lista") === "sim",
      vagas: valor("vagas"),
      fixada: dados.get("fixada") === "sim",
      cartazNovo,
      tirarCartaz: dados.get("tirar_cartaz") === "sim",
    });
    setEnviando(false);
    setEstado(resultado);
    if (!resultado.ok) return;
    if (!oportunidade && resultado.id) {
      router.push(`/oportunidades/${resultado.id}`);
      return;
    }
    router.refresh();
  }

  return (
    <form ref={formulario} onSubmit={enviar} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Escolha
        nome="tipo"
        rotulo="Tipo"
        prefixo={prefixo}
        padrao={oportunidade?.tipo ?? "estagio"}
        opcoes={Object.entries(ROTULO_TIPO).map(([valor, rotulo]) => ({ valor, rotulo }))}
      />
      <Campo nome="organizacao" rotulo="Quem oferece" maxLength={200} padrao={oportunidade?.organizacao ?? undefined} placeholder="Escritório, instituto, outra liga" prefixo={prefixo} />
      <Campo nome="titulo" rotulo="Título" obrigatorio maxLength={200} padrao={oportunidade?.titulo} placeholder="Ex.: Estágio em Direito Empresarial" prefixo={prefixo} className="sm:col-span-2" />
      <AreaDeTexto
        nome="descricao"
        rotulo="Descrição"
        obrigatorio
        linhas={7}
        maxLength={6000}
        padrao={oportunidade?.descricao}
        placeholder="Cole aqui o texto da divulgação: requisitos, bolsa, carga horária, programa"
        prefixo={prefixo}
        className="sm:col-span-2"
      />
      <Campo nome="prazo" rotulo="Prazo para se inscrever ou enviar" tipo="date" padrao={oportunidade?.prazo ?? undefined} prefixo={prefixo} ajuda="Depois dessa data, vai para Encerradas." />
      <div className="grid grid-cols-[1fr_8.5rem] gap-3">
        <Campo nome="dia" rotulo="Data do evento" tipo="date" padrao={quando.dia || undefined} prefixo={prefixo} />
        <Campo nome="hora" rotulo="Hora" tipo="time" padrao={quando.hora || undefined} prefixo={prefixo} />
      </div>
      <Campo nome="local" rotulo="Local" maxLength={300} padrao={oportunidade?.local ?? undefined} placeholder="Endereço, sala ou “online”" prefixo={prefixo} />
      <Campo nome="contato" rotulo="Contato" maxLength={300} padrao={oportunidade?.contato ?? undefined} placeholder="E-mail para o currículo, por exemplo" prefixo={prefixo} />
      <Campo nome="link" rotulo="Link de inscrição ou mais informações" tipo="url" maxLength={1000} padrao={oportunidade?.link ?? undefined} placeholder="https://…" prefixo={prefixo} className="sm:col-span-2" />

      <div className="sm:col-span-2">
        <label htmlFor={`${prefixo}-cartaz`} className="rotulo-campo">
          Cartaz <span className="font-normal text-grafite">(opcional)</span>
        </label>
        <input
          id={`${prefixo}-cartaz`}
          name="cartaz"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={enviando}
          className="block w-full cursor-pointer rounded-[0.625rem] border border-linha-forte bg-superficie text-sm text-grafite file:mr-4 file:min-h-11 file:cursor-pointer file:border-0 file:bg-transparent file:px-4 file:font-semibold file:text-vinho hover:border-grafite"
        />
        <p className="mt-1.5 text-sm text-grafite">
          Imagem JPG, PNG ou WebP de até 5 MB: o card da divulgação ou a foto do cartaz.
          {oportunidade?.cartazVersao ? " Enviar outra substitui a atual." : ""}
        </p>
        {oportunidade?.cartazVersao ? <Marcar nome="tirar_cartaz" rotulo="Tirar o cartaz atual" /> : null}
      </div>

      <div className="flex flex-col gap-1 sm:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-tinta">
          <input
            type="checkbox"
            name="pede_lista"
            value="sim"
            checked={pedeLista}
            onChange={(e) => setPedeLista(e.currentTarget.checked)}
            className="size-[1.125rem] accent-vinho"
          />
          Pedir lista de quem vai (botão “Vou” para os membros)
        </label>
        {pedeLista ? (
          <Campo
            nome="vagas"
            rotulo="Vagas"
            tipo="number"
            min="1"
            max="10000"
            padrao={oportunidade?.vagas ?? undefined}
            prefixo={prefixo}
            ajuda="Em branco, sem limite. Com limite, a lista fecha quando as vagas acabam."
            className="max-w-xs"
          />
        ) : null}
        <Marcar nome="fixada" rotulo="Fixar no topo do mural" padrao={oportunidade?.fixada ?? false} />
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={enviando} className="botao">
          {enviando ? "Enviando…" : oportunidade ? "Salvar alterações" : "Publicar no mural"}
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
