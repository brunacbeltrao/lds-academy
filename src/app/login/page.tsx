import type { Metadata } from "next";
import Image from "next/image";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

const ERROS: Record<string, string> = {
  inativo: "Seu acesso não está ativo na lista de membros. Fale com a diretoria.",
  link: "O link expirou ou já foi usado. Peça um novo em Esqueci a senha.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { erro } = await searchParams;
  const mensagem = typeof erro === "string" ? ERROS[erro] : undefined;

  return (
    <main className="grid grid-cols-1 min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="entrada flex flex-col justify-between gap-10 px-6 pt-8 pb-10 sm:px-12 sm:pt-12 lg:py-14">
        <Image src="/marca/lockup-vinho.png" alt="LDS·FDR" width={173} height={64} priority className="h-12 w-auto self-start sm:h-14" />
        <div className="max-w-lg">
          <h1 className="text-[clamp(2.5rem,1.6rem+3.6vw,4rem)] leading-[0.98] font-bold tracking-[-0.04em] text-tinta">
            LDS Academy
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-grafite">
            Aulas, leituras, produção e documentos da liga em um só lugar, para quem estuda direito societário e mercado de
            capitais na FDR.
          </p>
        </div>
        <p className="hidden text-sm text-grafite lg:block">
          Liga de Direito Societário e Mercado de Capitais · Faculdade de Direito do Recife
        </p>
      </section>

      <section className="flex items-start justify-center border-t border-linha bg-superficie px-6 py-10 sm:px-12 lg:items-center lg:border-t-0 lg:border-l">
        <div className="surgir w-full max-w-sm">
          <h2 className="h2">Acesso</h2>
          <p className="mt-2 text-grafite">
            Restrito aos membros da liga.
          </p>
          <div className="mt-7">
            <FormularioLogin erroInicial={mensagem} />
          </div>
        </div>
      </section>
    </main>
  );
}
