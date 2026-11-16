import type { Metadata } from "next";
import { CabecalhoDaPagina, Pagina } from "@/components/ui";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { ROTULO_PAPEL } from "@/lib/membros";
import { FormularioSenha } from "./senha/formulario";
import { EnvioDeFoto } from "./foto";

export const metadata: Metadata = { title: "Meu perfil" };

export default async function ContaPage() {
  const [membro, fotos] = await Promise.all([getMembroAtual(), getFotos()]);
  return (
    <Pagina>
      <CabecalhoDaPagina titulo="Meu perfil" descricao={`${membro.nome} · ${ROTULO_PAPEL[membro.papel]}`} />
      <section aria-labelledby="foto" className="cartao p-5 sm:p-6">
        <h2 id="foto" className="h3 mb-4">
          Foto de perfil
        </h2>
        <EnvioDeFoto membroId={membro.id} nome={membro.nome} foto={fotos[membro.id] ?? null} />
      </section>
      <section aria-labelledby="senha" className="cartao mt-3 p-5 sm:p-6">
        <h2 id="senha" className="h3 mb-4">
          Trocar a senha
        </h2>
        <FormularioSenha />
      </section>
    </Pagina>
  );
}
