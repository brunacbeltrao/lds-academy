import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirGestao } from "@/lib/membro";
import { getProfessor } from "@/lib/professores";
import { FichaDoProfessor } from "./conteudo";

export const metadata: Metadata = { title: "Professor" };

export default async function ProfessorPage({ params }: PageProps<"/professores/[id]">) {
  const [{ id }, membro] = await Promise.all([params, exigirGestao()]);
  const professor = await getProfessor(id);
  if (!professor) notFound();
  return <FichaDoProfessor professor={professor} diretoria={membro.papel === "diretoria"} />;
}
