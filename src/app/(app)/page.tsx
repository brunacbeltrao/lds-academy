import type { Metadata } from "next";
import Link from "next/link";
import { Pin } from "lucide-react";
import { CartaoOportunidade } from "@/components/cartao-oportunidade";
import { InstalarApp } from "@/components/instalar-app";
import { PrazosDaProducao } from "@/components/prazos-da-producao";
import { ProximoEncontro } from "@/components/proximo-encontro";
import { CabecalhoDaPagina, Pagina, Painel } from "@/components/ui";
import { pendenciasDeArtigos, type Pendencia } from "@/lib/artigo";
import { getMinhasMarcacoes } from "@/lib/aproveitamento";
import { getAvisos } from "@/lib/avisos";
import { getAula, getCicloAtual, proximoEncontro, rotuloAula } from "@/lib/ciclos";
import { curta, diasAte, hoje, longa, quando } from "@/lib/datas";
import { getFrequencia, LIMITE_DE_FALTAS, resumo } from "@/lib/frequencia";
import { getMembroAtual } from "@/lib/membro";
import { getOportunidadesAbertas } from "@/lib/oportunidades";
import { prazosDaProducao } from "@/lib/prazos-producao";
import { getProducoes } from "@/lib/producao";
import { getPerguntas, getRespostasPendentes } from "@/lib/tira-duvidas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Início" };


export default async function InicioPage() {
  const membro = await getMembroAtual();
  const gestao = membro.papel !== "ligante";
  const participa = membro.papel !== "conselheiro";
  const [atual, avisos, perguntas, frequencia, producoes, filaRespostas, justificativasAbertas, oportunidades, marcacoes] = await Promise.all([
    getCicloAtual(),
    getAvisos(4),
    getPerguntas(5),
    getFrequencia(membro.id),
    getProducoes(),
    gestao ? getRespostasPendentes() : Promise.resolve([]),
    gestao ? contarJustificativasPendentes() : Promise.resolve(0),
    getOportunidadesAbertas(membro.id, 3),
    participa ? getMinhasMarcacoes(membro.id) : null,
  ]);

  const primeiroNome = membro.nome.split(" ")[0];
  const proximo = atual ? proximoEncontro(atual.encontros) : null;

  // Leitura da semana: a bibliografia e os anexos da próxima aula.
  const aulaDoProximo = proximo?.aulaId ? await getAula(proximo.aulaId) : null;
  const leituraDoProximo = aulaDoProximo
    ? {
        aulaId: aulaDoProximo.id,
        linhas: (aulaDoProximo.bibliografia ?? "").split("\n").map((l) => l.trim()).filter(Boolean),
        anexos: aulaDoProximo.materiais.length,
        feita: marcacoes ? marcacoes.leituras.has(aulaDoProximo.id) : null,
      }
    : null;
  const freq = resumo(frequencia);
  const dataDeHoje = hoje();

  // Prazos da produção: os do membro e, para a diretoria e o conselho, os do resto da liga.
  const prazos = prazosDaProducao(producoes, membro.id, dataDeHoje);

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
  // Leitura do próximo encontro, na semana da aula.
  if (proximo && leituraDoProximo && leituraDoProximo.feita === false && (leituraDoProximo.linhas.length > 0 || leituraDoProximo.anexos > 0) && diasAte(proximo.inicio) <= 7) {
    pendencias.push({
      href: `/ciclos/aulas/${leituraDoProximo.aulaId}#bibliografia`,
      texto: `Fazer a leitura da ${rotuloAula(proximo.numero).toLowerCase()}`,
      detalhe: proximo.titulo,
      urgente: diasAte(proximo.inicio) <= 1,
    });
  }
  // Avaliar as aulas da última semana que ainda não foram avaliadas.
  if (marcacoes) {
    for (const l of frequencia) {
      if (new Date(l.data) <= new Date() && diasAte(l.data) >= -7 && !marcacoes.avaliadas.has(l.aulaId)) {
        pendencias.push({ href: `/ciclos/aulas/${l.aulaId}#avaliacao`, texto: `Avaliar a ${rotuloAula(l.numero).toLowerCase()}`, detalhe: l.titulo });
      }
    }
  }
  for (const l of frequencia) {
    if (l.presenca === "falta" && !l.justificativa) {
      pendencias.push({ href: `/ciclos/aulas/${l.aulaId}#justificativa`, texto: `Justificar a falta na ${l.numero ? `aula ${l.numero}` : "aula extra"}`, detalhe: l.titulo, urgente: true });
    }
    if (l.justificativa?.status === "pendente") {
      pendencias.push({ href: "/trajetoria", texto: "Justificativa em análise", detalhe: l.titulo });
    }
  }
  if (!membro.nomeExibicao) {
    pendencias.push({ href: "/conta#nome", texto: "Escolher como seu nome aparece", detalhe: `Hoje aparece ${membro.nome}` });
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
        <ProximoEncontro proximo={proximo} ciclo={atual?.ciclo.codigo ?? null} encontros={atual?.encontros ?? []} leitura={leituraDoProximo} />

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

<PrazosDaProducao meus={prazos.meus} daLiga={prazos.daLiga} gestao={gestao} />
      </div>
    </Pagina>
  );
}

async function contarJustificativasPendentes(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from("justificativas").select("id", { count: "exact", head: true }).eq("status", "pendente");
  return count ?? 0;
}
