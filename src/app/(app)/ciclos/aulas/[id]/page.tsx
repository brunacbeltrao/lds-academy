import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAula } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { getChamada, getMinhaPresenca } from "@/lib/presencas";
import { ConteudoDaAula } from "./conteudo";

export const metadata: Metadata = { title: "Aula" };

export default async function AulaPage({ params }: PageProps<"/ciclos/aulas/[id]">) {
  const { id } = await params;
  const [membro, aula] = await Promise.all([getMembroAtual(), getAula(id)]);
  if (!aula) notFound();

  const gestao = membro.papel !== "ligante";
  const [chamada, minhaPresenca] = await Promise.all([
    gestao ? getChamada(aula.id) : null,
    membro.papel !== "conselheiro" ? getMinhaPresenca(aula.id, membro.id) : null,
  ]);

  return <ConteudoDaAula aula={aula} papel={membro.papel} chamada={chamada} minhaPresenca={minhaPresenca} />;
}
