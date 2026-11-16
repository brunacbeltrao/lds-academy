import type { Metadata } from "next";
import { exigirGestao } from "@/lib/membro";
import { getProfessores, normalizar } from "@/lib/professores";
import { ConteudoDosProfessores } from "./conteudo";

export const metadata: Metadata = { title: "Professores" };

export default async function ProfessoresPage({ searchParams }: PageProps<"/professores">) {
  const [params, membro] = await Promise.all([searchParams, exigirGestao()]);
  const professores = await getProfessores();
  const busca = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const termo = normalizar(busca);
  const encontrados = termo
    ? professores.filter((p) => normalizar([p.nome, p.temas, p.instituicao].filter(Boolean).join(" ")).includes(termo))
    : professores;

  return (
    <ConteudoDosProfessores
      professores={encontrados}
      busca={busca}
      diretoria={membro.papel === "diretoria"}
      total={{
        professores: professores.length,
        disponiveis: professores.filter((p) => p.disponivel).length,
        comAulas: professores.filter((p) => p.aulas.length > 0).length,
      }}
    />
  );
}
