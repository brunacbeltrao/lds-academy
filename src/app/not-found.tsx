import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="flex min-h-screen items-center px-6 py-16 sm:px-12">
      <div className="max-w-xl">
        <p className="rotulo text-grafite">Erro 404</p>
        <h1 className="titulo mt-2 text-4xl sm:text-5xl">Página não encontrada</h1>
        <p className="mt-4 text-lg text-grafite">O endereço não existe ou foi movido.</p>
        <Link
          href="/"
          className="rotulo mt-8 inline-block bg-vinho px-5 py-3 text-bege transition-colors hover:bg-vinho-profundo"
        >
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
