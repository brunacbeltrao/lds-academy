"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-10 sm:py-14">
      <p className="rotulo text-grafite">Algo deu errado</p>
      <h1 className="titulo mt-2 text-4xl">Não foi possível carregar esta página</h1>
      <p className="mt-4 text-lg text-grafite">Tente de novo. Se o erro continuar, avise a diretoria.</p>
      <button
        type="button"
        onClick={reset}
        className="rotulo mt-8 bg-vinho px-5 py-3 text-bege transition-colors hover:bg-vinho-profundo"
      >
        Tentar de novo
      </button>
    </div>
  );
}
