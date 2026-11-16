import { Menu } from "@/components/menu";
import { getMembroAtual } from "@/lib/membro";
import { MENU } from "@/lib/navegacao";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const membro = await getMembroAtual();
  const itens = MENU.filter((item) => !item.soDiretoria || membro.papel === "diretoria");

  return (
    <>
      <a
        href="#conteudo"
        className="rotulo sr-only z-50 bg-bege px-4 py-3 text-vinho focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <Menu itens={itens} nome={membro.nome} papel={membro.papel} />
      <main id="conteudo" className="min-h-screen md:pl-64">
        {children}
      </main>
    </>
  );
}
