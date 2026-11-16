import type { Metadata } from "next";
import Image from "next/image";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  inativo: "Seu acesso não está ativo na lista de membros. Fale com a diretoria.",
  link: "O link expirou ou já foi usado. Peça um novo abaixo.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? ERROS[erro] : undefined;

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <section className="flex flex-col justify-between bg-vinho px-6 py-10 text-bege sm:px-12 md:py-16">
        <Image src="/marca/lockup-branco.png" alt="LDS·FDR" width={260} height={105} priority className="h-auto w-48 sm:w-64" />
        <div className="mt-12 max-w-md md:mt-0">
          <p className="rotulo text-rosa-claro">Plataforma interna</p>
          <h1 className="titulo mt-3 text-5xl text-bege sm:text-6xl">LDS Academy</h1>
          <p className="mt-6 text-lg text-bege/90">
            Tudo da liga em um só lugar: ciclos e aulas, biblioteca, competições e tira-dúvidas.
          </p>
        </div>
        <p className="rotulo mt-12 text-rosa-claro">
          Liga de Direito Societário e Mercado de Capitais · FDR
        </p>
      </section>

      <section className="flex items-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <h2 className="titulo text-3xl">Entrar</h2>
          <p className="mt-2 mb-8 text-grafite">
            O acesso é restrito aos membros da lista oficial. Enviamos um link de acesso para o seu e-mail,
            sem senha.
          </p>
          <FormularioLogin erroInicial={mensagem} />
        </div>
      </section>
    </main>
  );
}
