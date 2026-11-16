import type { ReactNode } from "react";

export type Bloco = { titulo: string; descricao: string };

type Props = {
  rotulo: string;
  titulo: string;
  descricao: string;
  blocos: Bloco[];
  children?: ReactNode;
};

/** Esqueleto de uma área do menu: cabeçalho e os blocos previstos no mapa do site. */
export function PaginaArea({ rotulo, titulo, descricao, blocos, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-14">
      <header className="border-b border-filete pb-8">
        <p className="rotulo text-grafite">{rotulo}</p>
        <h1 className="titulo mt-2 text-4xl sm:text-5xl">{titulo}</h1>
        <p className="mt-4 max-w-2xl text-lg text-grafite">{descricao}</p>
      </header>

      {children}

      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {blocos.map((bloco) => (
          <li key={bloco.titulo} className="flex flex-col border border-filete bg-papel p-6">
            <h2 className="titulo text-2xl">{bloco.titulo}</h2>
            <p className="mt-2 flex-1 text-grafite">{bloco.descricao}</p>
            <p className="rotulo mt-5 text-grafite">
              Em construção
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
