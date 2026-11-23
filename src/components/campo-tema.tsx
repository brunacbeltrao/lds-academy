"use client";

import { useState } from "react";
import { temasParecidos } from "@/lib/artigo";

/** Campo do tema do artigo: avisa, enquanto a dupla escreve, se outro artigo já usou ou reservou um tema parecido. */
export function CampoTema({ padrao = "", outros }: { padrao?: string; outros: { rotulo: string; tema: string }[] }) {
  const [tema, setTema] = useState(padrao);
  const parecidos = tema.trim().length >= 8 ? temasParecidos(tema, outros) : [];

  return (
    <div>
      <label htmlFor="tema" className="rotulo-campo">
        Tema do artigo
      </label>
      <textarea
        id="tema"
        name="tema"
        rows={2}
        required
        maxLength={300}
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        placeholder="Ex.: Business judgment rule e o dever de diligência do administrador"
        aria-describedby={parecidos.length ? "tema-parecido" : undefined}
        className="campo leading-relaxed"
      />
      {parecidos.length > 0 ? (
        <div id="tema-parecido" role="status" className="aviso aviso-erro mt-2">
          <p className="font-semibold">Parece com {parecidos.length === 1 ? "outro tema da liga" : "outros temas da liga"}:</p>
          <ul className="mt-1">
            {parecidos.slice(0, 3).map((p) => (
              <li key={p.rotulo}>
                {p.rotulo}: {p.tema}
              </li>
            ))}
          </ul>
          <p className="mt-1 text-tinta">Você pode registrar assim mesmo; a diretoria acadêmica avalia se o recorte é diferente.</p>
        </div>
      ) : null}
    </div>
  );
}
