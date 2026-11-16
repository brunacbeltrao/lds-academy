"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Estado } from "@/lib/estado";

type Acao = (estado: Estado, formData: FormData) => Promise<Estado>;

/**
 * Formulário ligado a uma ação do servidor: mostra o resultado abaixo e, se der certo,
 * pode limpar os campos (resetar) para o próximo envio.
 */
export function Formulario({
  acao,
  children,
  className = "flex flex-col gap-4",
  resetar = false,
  confirmar,
}: {
  acao: Acao;
  children: ReactNode;
  className?: string;
  resetar?: boolean;
  /** Pergunta antes de enviar (ações que apagam). */
  confirmar?: string;
}) {
  const [estado, despachar] = useActionState<Estado, FormData>(acao, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok && resetar) ref.current?.reset();
  }, [estado, resetar]);

  return (
    <form
      ref={ref}
      action={despachar}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={className}
    >
      {children}
      {estado ? (
        <p role="status" className={`aviso surgir ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
          {estado.mensagem}
        </p>
      ) : null}
    </form>
  );
}

/** Formulário de uma linha só (um botão): sem caixa de mensagem, só o erro, se houver. */
export function AcaoRapida({
  acao,
  children,
  confirmar,
  className = "",
}: {
  acao: Acao;
  children: ReactNode;
  confirmar?: string;
  className?: string;
}) {
  const [estado, despachar] = useActionState<Estado, FormData>(acao, null);
  return (
    <form
      action={despachar}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={`inline-flex flex-col ${className}`}
    >
      {children}
      {estado && !estado.ok ? (
        <span role="status" className="mt-1 text-xs font-medium text-vinho-escuro">
          {estado.mensagem}
        </span>
      ) : null}
    </form>
  );
}

export function BotaoEnviar({
  children,
  enviando = "Salvando…",
  variante = "principal",
  className = "",
}: {
  children: ReactNode;
  enviando?: string;
  variante?: "principal" | "secundario" | "discreto";
  className?: string;
}) {
  const { pending } = useFormStatus();
  const estilo =
    variante === "principal"
      ? "botao"
      : variante === "secundario"
        ? "botao botao-secundario"
        : "inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-grafite transition-colors hover:bg-sutil hover:text-tinta disabled:opacity-60";
  return (
    <button type="submit" disabled={pending} className={`${estilo} ${className}`}>
      {pending ? enviando : children}
    </button>
  );
}

type BaseCampo = { nome: string; rotulo: string; ajuda?: string; obrigatorio?: boolean; className?: string; prefixo?: string };

export function Campo({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  className = "",
  tipo = "text",
  padrao,
  prefixo,
  ...resto
}: BaseCampo & { tipo?: string; padrao?: string | number; placeholder?: string; maxLength?: number; min?: string; max?: string }) {
  const campoId = prefixo ? `${prefixo}-${nome}` : nome;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="rotulo-campo">
        {rotulo}
        {obrigatorio ? null : <span className="font-normal text-grafite"> (opcional)</span>}
      </label>
      <input
        id={campoId}
        name={nome}
        type={tipo}
        required={obrigatorio}
        defaultValue={padrao}
        aria-describedby={ajuda ? `${campoId}-ajuda` : undefined}
        className="campo"
        {...resto}
      />
      {ajuda ? (
        <p id={`${campoId}-ajuda`} className="mt-1.5 text-sm text-grafite">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

export function AreaDeTexto({
  nome,
  rotulo,
  ajuda,
  obrigatorio,
  className = "",
  padrao,
  linhas = 4,
  placeholder,
  maxLength,
  prefixo,
}: BaseCampo & { padrao?: string; linhas?: number; placeholder?: string; maxLength?: number }) {
  const campoId = prefixo ? `${prefixo}-${nome}` : nome;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="rotulo-campo">
        {rotulo}
        {obrigatorio ? null : <span className="font-normal text-grafite"> (opcional)</span>}
      </label>
      <textarea
        id={campoId}
        name={nome}
        rows={linhas}
        required={obrigatorio}
        defaultValue={padrao}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-describedby={ajuda ? `${campoId}-ajuda` : undefined}
        className="campo leading-relaxed"
      />
      {ajuda ? (
        <p id={`${campoId}-ajuda`} className="mt-1.5 text-sm text-grafite">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

export function Escolha({
  nome,
  rotulo,
  ajuda,
  obrigatorio = true,
  className = "",
  padrao,
  opcoes,
  prefixo,
}: BaseCampo & { padrao?: string; opcoes: { valor: string; rotulo: string }[] }) {
  const campoId = prefixo ? `${prefixo}-${nome}` : nome;
  return (
    <div className={className}>
      <label htmlFor={campoId} className="rotulo-campo">
        {rotulo}
      </label>
      <select id={campoId} name={nome} required={obrigatorio} defaultValue={padrao} className="campo appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22 stroke=%22%23635a5c%22 stroke-width=%221.75%22><path d=%22m5 7.5 5 5 5-5%22/></svg>')] bg-[length:1.125rem] bg-[right_0.75rem_center] bg-no-repeat pr-10">
        {opcoes.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.rotulo}
          </option>
        ))}
      </select>
      {ajuda ? <p className="mt-1.5 text-sm text-grafite">{ajuda}</p> : null}
    </div>
  );
}

export function Marcar({ nome, rotulo, padrao = false, valor = "sim" }: { nome: string; rotulo: string; padrao?: boolean; valor?: string }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-[0.9375rem] text-tinta">
      <input type="checkbox" name={nome} value={valor} defaultChecked={padrao} className="size-[1.125rem] accent-vinho" />
      {rotulo}
    </label>
  );
}
