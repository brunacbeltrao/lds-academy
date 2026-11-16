import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAula } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { ConteudoDaAula } from "./conteudo";

export const metadata: Metadata = { title: "Aula" };

export default async function AulaPage({ params }: PageProps<"/ciclos/aulas/[id]">) {
  const { id } = await params;
  const [membro, aula] = await Promise.all([getMembroAtual(), getAula(id)]);
  if (!aula) notFound();
  return <ConteudoDaAula aula={aula} diretoria={membro.papel === "diretoria"} />;
}
