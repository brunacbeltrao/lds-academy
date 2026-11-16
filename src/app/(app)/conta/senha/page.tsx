import type { Metadata } from "next";
import { CabecalhoDaPagina, Pagina } from "@/components/ui";
import { getMembroAtual } from "@/lib/membro";
import { FormularioSenha } from "./formulario";

export const metadata: Metadata = { title: "Senha" };

export default async function SenhaPage() {
  const membro = await getMembroAtual();
  return (
    <Pagina>
      <CabecalhoDaPagina titulo="Senha" descricao={`Escolha uma nova senha para entrar como ${membro.nome}.`} />
      <FormularioSenha />
    </Pagina>
  );
}
