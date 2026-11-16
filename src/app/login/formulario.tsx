"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { criarConta, entrar, recuperarSenha, type EstadoLogin } from "./actions";

type Modo = "entrar" | "primeiro" | "recuperar";

/** Login por e-mail e senha: entrar, primeiro acesso (criar a senha) e recuperar a senha. */
export function FormularioLogin({ erroInicial }: { erroInicial?: string }) {
  const [modo, setModo] = useState<Modo>("entrar");

  return (
    <div>
      {modo !== "recuperar" ? (
        <div role="group" aria-label="Como você quer entrar" className="relative mb-7 grid grid-cols-2 rounded-xl bg-sutil p-1 ring-1 ring-linha">
          {/* Pílula que desliza entre as abas (receita "tabs sliding"). */}
          <span
            aria-hidden="true"
            className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-[0.625rem] bg-superficie shadow-cartao ring-1 ring-linha transition-transform duration-300 ease-saida ${
              modo === "primeiro" ? "translate-x-full" : "translate-x-0"
            }`}
          />
          {(
            [
              ["entrar", "Entrar"],
              ["primeiro", "Primeiro acesso"],
            ] as const
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              aria-pressed={modo === valor}
              onClick={() => setModo(valor)}
              className={`relative z-10 min-h-10 rounded-[0.625rem] text-sm font-semibold transition-colors duration-150 ${
                modo === valor ? "text-tinta" : "text-grafite hover:text-tinta"
              }`}
            >
              {rotulo}
            </button>
          ))}
        </div>
      ) : null}

      <div key={modo} className="surgir">
        {modo === "entrar" ? <Entrar erroInicial={erroInicial} aoEsquecer={() => setModo("recuperar")} /> : null}
        {modo === "primeiro" ? <PrimeiroAcesso /> : null}
        {modo === "recuperar" ? <Recuperar aoVoltar={() => setModo("entrar")} /> : null}
      </div>
    </div>
  );
}

function Entrar({ erroInicial, aoEsquecer }: { erroInicial?: string; aoEsquecer: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(
    entrar,
    erroInicial ? { ok: false, mensagem: erroInicial } : null,
  );
  return (
    <form action={acao} className="flex flex-col gap-4">
      <CampoEmail />
      <CampoSenha id="senha" rotulo="Senha" autoComplete="current-password" />
      <button type="submit" disabled={enviando} className="botao mt-1 w-full">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      <button type="button" onClick={aoEsquecer} className="link self-start text-sm">
        Esqueci a senha
      </button>
      <Aviso estado={estado} />
    </form>
  );
}

function PrimeiroAcesso() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(criarConta, null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <p className="text-[0.9375rem] text-grafite">
        Use o e-mail que você informou à diretoria. A plataforma reconhece o seu nome pela lista da liga.
      </p>
      <CampoEmail />
      <CampoSenha id="senha" rotulo="Crie uma senha" autoComplete="new-password" ajuda="Pelo menos 8 caracteres." />
      <CampoSenha id="confirmacao" rotulo="Repita a senha" autoComplete="new-password" />
      <button type="submit" disabled={enviando} className="botao mt-1 w-full">
        {enviando ? "Criando a conta…" : "Criar conta"}
      </button>
      <Aviso estado={estado} />
    </form>
  );
}

function Recuperar({ aoVoltar }: { aoVoltar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(recuperarSenha, null);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <div>
        <h3 className="h3">Criar uma nova senha</h3>
        <p className="mt-1 text-[0.9375rem] text-grafite">Enviamos para o seu e-mail um link para escolher outra senha.</p>
      </div>
      <CampoEmail />
      <button type="submit" disabled={enviando} className="botao mt-1 w-full">
        {enviando ? "Enviando…" : "Enviar link"}
      </button>
      <button type="button" onClick={aoVoltar} className="link self-start text-sm">
        Voltar para entrar
      </button>
      <Aviso estado={estado} />
    </form>
  );
}

function CampoEmail() {
  return (
    <div>
      <label htmlFor="email" className="rotulo-campo">
        E-mail
      </label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="nome@exemplo.com" className="campo" />
    </div>
  );
}

export function CampoSenha({ id, rotulo, autoComplete, ajuda }: { id: string; rotulo: string; autoComplete: string; ajuda?: string }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={visivel ? "text" : "password"}
          required
          minLength={autoComplete === "new-password" ? 8 : undefined}
          autoComplete={autoComplete}
          aria-describedby={ajuda ? `${id}-ajuda` : undefined}
          className="campo pr-12"
        />
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Esconder senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[0.625rem] text-grafite transition-colors hover:text-tinta"
        >
          {visivel ? <EyeOff aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} /> : <Eye aria-hidden="true" className="size-[1.125rem]" strokeWidth={1.75} />}
        </button>
      </div>
      {ajuda ? (
        <p id={`${id}-ajuda`} className="mt-1.5 text-sm text-grafite">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

export function Aviso({ estado }: { estado: EstadoLogin }) {
  if (!estado) return null;
  return (
    <p role="status" className={`aviso surgir ${estado.ok ? "aviso-ok" : "aviso-erro"}`}>
      {estado.mensagem}
    </p>
  );
}
