import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMembroAtual } from "@/lib/membro";
import { getOportunidade } from "@/lib/oportunidades";
import { DetalheDaOportunidade } from "./conteudo";

export const metadata: Metadata = { title: "Oportunidade" };

export default async function OportunidadePage({ params }: PageProps<"/oportunidades/[id]">) {
  const [{ id }, membro] = await Promise.all([params, getMembroAtual()]);
  const oportunidade = await getOportunidade(id, membro.id);
  if (!oportunidade) notFound();
  return <DetalheDaOportunidade oportunidade={oportunidade} papel={membro.papel} />;
}
