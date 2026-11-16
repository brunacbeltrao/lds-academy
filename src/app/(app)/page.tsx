import type { Metadata } from "next";
import Link from "next/link";
import { Pin } from "lucide-react";
import { CartaoOportunidade } from "@/components/cartao-oportunidade";
import { InstalarApp } from "@/components/instalar-app";
import { ProximoEncontro } from "@/components/proximo-encontro";
import { CabecalhoDaPagina, Pagina, Painel } from "@/components/ui";
import { pendenciasDeArtigos, type Pendencia } from "@/lib/artigo";
import { getAvisos } from "@/lib/avisos";
import { getCicloAtual, proximoEncontro } from "@/lib/ciclos";
import { curta, diasAte, hoje, longa, quando } from "@/lib/datas";
import { getFrequencia, LIMITE_DE_FALTAS, resumo } from "@/lib/frequencia";
import { getMembroAtual } from "@/lib/membro";
import { getOportunidadesAbertas } from "@/lib/oportunidades";
import { getProducoes } from "@/lib/producao";
import { getPerguntas, getRespostasPendentes } from "@/lib/tira-duvidas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Início" };


export default async function InicioPage() {
  const membro = await getMembroAtual();
  const gestao = membro.papel !== "ligante";
  const [atual, avisos, perguntas, frequencia, producoes, filaRespostas, justificativasAbertas, oportunidades] = await Promise.all([
    getCicloAtual(),
    getAvisos(4),
    getPerguntas(5),
    getFrequencia(membro.id),
    getProducoes(),
    gestao ? getRespostasPendentes() : Promise.resolve([]),
    gestao ? contarJustificativasPendentes() : Promise.resolve(0),
    getOportunidadesAbertas(membro.id, 3),
  ]);

  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;
  const freq = resumo(frequencia);
  const dataDeHoje = hoje();

  // Prazos: próximas publicações e entregas da Produção.
  const prazos = producoes
    .filter((p): p is typeof p & { publicacao: string } => p.status !== "publicado" && Boolean(p.publicacao) && (p.publicacao as string) >= dataDeHoje)
    .slice(0, 5)
    .map((p) => {
      const rascunhoPela = p.tipo === "artigo" && (p.fase === "tema" || p.fase === "redacao") && p.entrega && p.entrega >= dataDeHoje;
      return {
        id: p.id,
        titulo: `${p.tipo === "artigo" ? "Artigo" : "Carrossel"} ${String(p.numero ?? "").padStart(2, "0")}`,
        tema: p.tema,
        data: p.tipo === "artigo" ? (rascunhoPela ? (p.entrega as string) : p.publicacao) : (p.entrega ?? p.publicacao),
        rotulo: p.tipo === "artigo" ? (rascunhoPela ? "rascunho" : "publicação") : "entrega",
        minha: p.participantes.some((x) => x.id === membro.id),
      };
    });

  // Pendências do membro: carrosséis por entrega; mini-artigos pela etapa do fluxo.
  const pendencias: Pendencia[] = [];
  for (const p of producoes) {
    if (p.tipo !== "carrossel") continue;
    const minha = p.participantes.some((x) => x.id === membro.id);
    const prazo = p.entrega ?? p.publicacao;
    if (prazo && minha && p.status !== "publicado" && diasAte(prazo) >= -2 && diasAte(prazo) <= 14 && p.entregas.length === 0) {
      // Uma entrega de qualquer integrante da dupla resolve a pendência.
      pendencias.push({
        href: `/producao/${p.id}`,
        texto: `Enviar o carrossel ${String(p.numero ?? "").padStart(2, "0")}`,
        detalhe: `Prazo ${quando(prazo)} (${curta(prazo)})`,
        urgente: diasAte(prazo) <= 2,
      });
    }
  }
  pendencias.push(...pendenciasDeArtigos(producoes, membro));
  for (const l of frequencia) {
    if (l.presenca === "falta" && !l.justificativa) {
      pendencias.push({ href: `/ciclos/aulas/${l.aulaId}#justificativa`, texto: `Justificar a falta na ${l.numero ? `aula ${l.numero}` : "aula extra"}`, detalhe: l.titulo, urgente: true });
    }
    if (l.justificativa?.status === "pendente") {
      pendencias.push({ href: "/trajetoria", texto: "Justificativa em análise", detalhe: l.titulo });
    }
  }
  if (gestao && filaRespostas.length > 0) {
    pendencias.push({ href: "/gestao?aba=fila", texto: `${filaRespostas.length} ${filaRespostas.length === 1 ? "resposta aguarda" : "respostas aguardam"} validação`, detalhe: "Tira-dúvidas" });
  }
  if (gestao && justificativasAbertas > 0) {
    pendencias.push({ href: "/gestao?aba=frequencia", texto: `${justificativasAbertas} ${justificativasAbertas === 1 ? "justificativa" : "justificativas"} para decidir`, detalhe: "Frequência" });
  }

  return (
    <Pagina larga>
      <CabecalhoDaPagina titulo={`Olá, ${primeiroNome}`} contexto={<span className="first-letter:uppercase">{longa(dataDeHoje)}</span>} />

      <div className="mb-3 empty:hidden lg:hidden">
        <InstalarApp dispensavel />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <ProximoEncontro proximo={proximo} ciclo={atual?.ciclo.codigo ?? null} encontros={atual?.encontros ?? []} />

        <Painel titulo="Minha frequência" link={{ href: "/trajetoria", rotulo: "Detalhes" }}>
          <p className="numeral text-[2.5rem] leading-none font-bold tracking-[-0.03em] text-tinta">
            {freq.faltas}
            <span className="text-xl font-semibold text-grafite"> / {LIMITE_DE_FALTAS}</span>
          </p>
          <p className="mt-1.5 text-sm text-grafite">faltas sem justificativa no ciclo</p>
          <div aria-hidden="true" className="mt-4 flex gap-1">
            {Array.from({ length: LIMITE_DE_FALTAS }, (_, i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full ${i < freq.faltas ? "bg-vinho" : "bg-linha"}`} />
            ))}
          </div>
          <dl className="mt-auto grid grid-cols-3 gap-2 pt-5 text-sm">
            <div>
              <dt className="text-grafite">Presenças</dt>
              <dd className="numeral font-semibold text-tinta">{freq.presencas}</dd>
            </div>
            <div>
              <dt className="text-grafite">Justificadas</dt>
              <dd className="numeral font-semibold text-tinta">{freq.justificadas}</dd>
            </div>
            <div>
              <dt className="text-grafite">Sem registro</dt>
              <dd className="numeral font-semibold text-tinta">{freq.semRegistro}</dd>
            </div>
          </dl>
        </Painel>

        <Painel titulo="Avisos da diretoria" link={gestao ? { href: "/gestao?aba=avisos", rotulo: "Publicar" } : undefined} className="lg:col-span-2">
          {avisos.length === 0 ? (
            <p className="text-[0.9375rem] text-grafite">Nenhum aviso publicado.</p>
          ) : (
            <ul className="-my-3 divide-y divide-linha">
              {avisos.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="flex items-center gap-1.5 font-semibold text-tinta">
                    {a.fixado ? <Pin aria-label="Fixado" className="size-3.5 shrink-0 text-vinho" strokeWidth={2} /> : null}
                    {a.titulo}
                  </p>
                  <p className="mt-0.5 line-clamp-3 text-[0.9375rem] whitespace-pre-line text-grafite">{a.corpo}</p>
                  <p className="mt-1 text-xs text-grafite">
                    {curta(a.publicado_em)}
                    {a.autor ? ` · ${a.autor}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="Minhas pendências">
          {pendencias.length === 0 ? (
            <p className="text-[0.9375rem] text-grafite">Nada pendente. Bom trabalho.</p>
          ) : (
            <ul className="-my-2 divide-y divide-linha">
              {pendencias.slice(0, 8).map((p, i) => (
                <li key={i}>
                  <Link href={p.href} className="group flex items-start gap-3 py-2.5">
                    <span aria-hidden="true" className={`mt-2 size-1.5 shrink-0 rounded-full ${p.urgente ? "bg-vinho" : "bg-linha-forte"}`} />
                    <span className="min-w-0">
                      <span className="block font-medium text-tinta group-hover:text-vinho">{p.texto}</span>
                      <span className="block truncate text-sm text-grafite">{p.detalhe}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        {oportunidades.length > 0 ? (
          <Painel titulo="Oportunidades" link={{ href: "/oportunidades", rotulo: "Ver o mural" }} className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {oportunidades.map((o) => (
                <CartaoOportunidade key={o.id} oportunidade={o} compacto />
              ))}
            </div>
          </Painel>
        ) : null}

        <Painel titulo="Perguntas recentes" link={{ href: "/tira-duvidas", rotulo: "Tira-dúvidas" }} className="lg:col-span-2">
          {perguntas.length === 0 ? (
            <p className="text-[0.9375rem] text-grafite">
              Ninguém perguntou ainda.{" "}
              <Link href="/tira-duvidas?aba=perguntar" className="link">
                Fazer a primeira pergunta
              </Link>
            </p>
          ) : (
            <ul className="-my-2 divide-y divide-linha">
              {perguntas.slice(0, 4).map((p) => {
                const validadas = p.respostas.filter((r) => r.status === "validada").length;
                return (
                  <li key={p.id}>
                    <Link href={`/tira-duvidas/${p.id}`} className="group flex items-center justify-between gap-4 py-2.5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-tinta group-hover:text-vinho">{p.titulo}</span>
                        <span className="block text-sm text-grafite">
                          {p.visibilidade === "privada" ? "Privada · " : ""}
                          {curta(p.criado_em)}
                        </span>
                      </span>
                      <span className={`selo shrink-0 ${validadas > 0 ? "selo-suave" : ""}`}>
                        {validadas > 0 ? `${validadas} ${validadas === 1 ? "resposta" : "respostas"}` : "Sem resposta"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        <Painel titulo="Prazos da produção" link={{ href: "/producao", rotulo: "Produção" }}>
          {prazos.length === 0 ? (
            <p className="text-[0.9375rem] text-grafite">Nenhum prazo próximo.</p>
          ) : (
            <ul className="-my-2 divide-y divide-linha">
              {prazos.map((p) => (
                <li key={p.id} className="flex items-baseline justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block font-medium text-tinta">
                      {p.titulo}
                      {p.minha ? <span className="selo selo-suave ml-2 align-middle">Sua</span> : null}
                    </span>
                    <span className="block truncate text-sm text-grafite">{p.tema ?? "Tema a definir"}</span>
                  </span>
                  <span className="shrink-0 text-right text-sm">
                    <span className="numeral block font-semibold text-tinta">{curta(p.data)}</span>
                    <span className="text-grafite">{p.rotulo}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </Pagina>
  );
}

async function contarJustificativasPendentes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("justificativas").select("id", { count: "exact", head: true }).eq("status", "pendente");
  return count ?? 0;
}
