import type { Metadata } from "next";
import { getMembroAtual } from "@/lib/membro";
import { getOportunidades, ROTULO_TIPO, type TipoOportunidade } from "@/lib/oportunidades";
import { ConteudoDoMural } from "./conteudo";

export const metadata: Metadata = { title: "Oportunidades" };

export default async function OportunidadesPage({ searchParams }: PageProps<"/oportunidades">) {
  const [params, membro] = await Promise.all([searchParams, getMembroAtual()]);
  const oportunidades = await getOportunidades(membro.id);
  const tipo = typeof params.tipo === "string" && params.tipo in ROTULO_TIPO ? (params.tipo as TipoOportunidade) : null;
  return (
    <ConteudoDoMural
      oportunidades={oportunidades}
      aba={params.aba === "encerradas" ? "encerradas" : "abertas"}
      tipo={tipo}
      diretoria={membro.papel === "diretoria"}
    />
  );
}
