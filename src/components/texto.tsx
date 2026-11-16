import type { ReactNode } from "react";

/** Transforma endereços https em links, mantendo o resto do texto. */
export function comLinks(texto: string): ReactNode[] {
  return texto.split(/(https?:\/\/[^\s]+)/g).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="link break-all">
        {parte}
      </a>
    ) : (
      parte
    ),
  );
}

/** Texto livre em parágrafos (linha em branco separa parágrafos), com links clicáveis. */
export function TextoLivre({ texto, className = "" }: { texto: string; className?: string }) {
  const paragrafos = texto
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`prosa flex flex-col gap-3 ${className}`}>
      {paragrafos.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {comLinks(p)}
        </p>
      ))}
    </div>
  );
}
