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
    <main className="flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <Image src="/marca/lockup-vinho.png" alt="LDS·FDR" width={173} height={64} priority className="h-14 w-auto" />
        <h1 className="h1 mt-8">LDS Academy</h1>
        <p className="mt-2 text-grafite">
          Plataforma interna da Liga de Direito Societário e Mercado de Capitais. O acesso é restrito aos
          membros: enviamos um link de acesso para o seu e-mail, sem senha.
        </p>
        <div className="cartao mt-8 p-5 sm:p-6">
          <FormularioLogin erroInicial={mensagem} />
        </div>
      </div>
    </main>
  );
}
