import type { Metadata } from "next";
import { exigirGestao } from "@/lib/membro";
import { getRelatorio } from "@/lib/relatorio";
import { ConteudoDoRelatorio } from "./conteudo";

export const metadata: Metadata = { title: "Relatório do ciclo" };

export default async function RelatorioPage({ searchParams }: PageProps<"/gestao/relatorio">) {
  const [params] = await Promise.all([searchParams, exigirGestao()]);
  const codigo = typeof params.ciclo === "string" ? params.ciclo : null;
  const relatorio = await getRelatorio(codigo);
  return <ConteudoDoRelatorio relatorio={relatorio} />;
}
