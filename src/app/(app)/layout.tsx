import { cookies } from "next/headers";
import { ViewTransition } from "react";
import { Estrutura } from "@/components/menu";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { MENU } from "@/lib/navegacao";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [membro, cookieStore, fotos] = await Promise.all([getMembroAtual(), cookies(), getFotos()]);
  const itens = MENU.filter((item) => !item.gestao || membro.papel !== "ligante");
  // A preferência de menu recolhido vem do cookie, para a página já chegar na largura certa.
  const recolhido = cookieStore.get("lds-menu")?.value === "recolhido";

  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-superficie px-4 py-3 font-semibold text-vinho focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <Estrutura itens={itens} nome={membro.nome} papel={membro.cargo} foto={fotos[membro.id] ?? null} recolhidoInicial={recolhido}>
        <ViewTransition default="pagina">{children}</ViewTransition>
      </Estrutura>
    </>
  );
}
