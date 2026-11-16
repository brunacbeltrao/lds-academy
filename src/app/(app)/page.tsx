import type { Metadata } from "next";
import { PaginaArea, type Bloco } from "@/components/pagina-area";
import { ProximoEncontro } from "@/components/proximo-encontro";
import { getAvisos } from "@/lib/avisos";
import { getCicloAtual, proximoEncontro } from "@/lib/ciclos";
import { getMembroAtual } from "@/lib/membro";
import { Avisos } from "./avisos";

export const metadata: Metadata = { title: "Início" };

const BLOCOS: Bloco[] = [
  { titulo: "Leitura da semana", descricao: "Leitura indicada para o próximo encontro do Grupo de Estudos." },
  { titulo: "Prazos de competições", descricao: "Inscrições, entregas de peças e rodadas que se aproximam." },
  { titulo: "Perguntas recentes", descricao: "As últimas dúvidas públicas do tira-dúvidas." },
  { titulo: "Minhas pendências", descricao: "Leituras por fazer, justificativas em análise e respostas aguardando validação." },
];

export default async function InicioPage() {
  const [membro, atual, avisos] = await Promise.all([getMembroAtual(), getCicloAtual(), getAvisos()]);
  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;

  return (
    <PaginaArea titulo={`Olá, ${primeiroNome}`} descricao="O que vem a seguir na liga." blocos={BLOCOS}>
      <ProximoEncontro proximo={proximo} ciclo={atual?.ciclo.codigo ?? null} />
      <Avisos avisos={avisos} diretoria={membro.papel === "diretoria"} />
    </PaginaArea>
  );
}
