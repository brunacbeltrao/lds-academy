import type { Metadata } from "next";
import { getMembroAtual } from "@/lib/membro";
import { getTrilha } from "@/lib/trilha";
import { ConteudoDaTrilha } from "./conteudo";

export const metadata: Metadata = { title: "Trilha de estudos" };

export default async function TrilhaPage() {
  const membro = await getMembroAtual();
  const partes = await getTrilha(membro.id, membro.papel !== "ligante");
  return <ConteudoDaTrilha partes={partes} participa={membro.papel !== "conselheiro"} diretoria={membro.papel === "diretoria"} />;
}
