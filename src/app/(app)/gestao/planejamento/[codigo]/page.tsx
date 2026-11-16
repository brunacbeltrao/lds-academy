import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirGestao } from "@/lib/membro";
import { getCicloParaPlanejar } from "@/lib/planejamento";
import { getOpcoesDeProfessores } from "@/lib/professores";
import { EditorDoCiclo } from "./conteudo";

export const metadata: Metadata = { title: "Planejamento do ciclo" };

export default async function PlanejamentoDoCicloPage({ params }: PageProps<"/gestao/planejamento/[codigo]">) {
  const [{ codigo }, membro] = await Promise.all([params, exigirGestao()]);
  const [planejamento, professores] = await Promise.all([getCicloParaPlanejar(decodeURIComponent(codigo)), getOpcoesDeProfessores()]);
  if (!planejamento) notFound();
  return <EditorDoCiclo ciclo={planejamento.ciclo} encontros={planejamento.encontros} professores={professores} diretoria={membro.papel === "diretoria"} />;
}
