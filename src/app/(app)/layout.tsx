import { Menu } from "@/components/menu";
import { getMembroAtual } from "@/lib/membro";
import { MENU } from "@/lib/navegacao";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const membro = await getMembroAtual();
  const itens = MENU.filter((item) => !item.gestao || membro.papel !== "ligante");

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-superficie px-4 py-3 font-semibold text-vinho focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <Menu itens={itens} nome={membro.nome} papel={membro.papel} />
      <main id="conteudo" className="min-h-screen lg:pl-64">
        {children}
      </main>
    </>
  );
}
