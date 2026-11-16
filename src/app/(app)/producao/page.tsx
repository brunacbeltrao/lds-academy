import type { Metadata } from "next";
import { getMembroAtual } from "@/lib/membro";
import { getProducoes } from "@/lib/producao";
import { hojeEmRecife } from "@/lib/producao-formato";
import { ConteudoDaProducao } from "./conteudo";

export const metadata: Metadata = { title: "Produção" };

export default async function ProducaoPage() {
  const [membro, producoes] = await Promise.all([getMembroAtual(), getProducoes()]);
  return <ConteudoDaProducao producoes={producoes} nome={membro.nome} hoje={hojeEmRecife()} />;
}
