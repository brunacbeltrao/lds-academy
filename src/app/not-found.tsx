import Link from "next/link";

export default function NaoEncontrada() {
  return (
    <main className="flex min-h-screen items-center px-5 py-16 sm:px-12">
      <div className="max-w-xl">
        <p className="text-sm font-semibold text-grafite">Erro 404</p>
        <h1 className="h1 mt-2">Página não encontrada</h1>
        <p className="mt-3 text-lg text-grafite">O endereço não existe ou foi movido.</p>
        <Link href="/" className="botao mt-8">
          Voltar ao início
        </Link>
      </div>
    </main>
  );
}
