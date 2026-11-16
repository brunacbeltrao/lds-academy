import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { Avatar, CabecalhoDaPagina, Pagina, Recolhivel } from "@/components/ui";
import { curta, diasAte, longa, quando, registro } from "@/lib/datas";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getMembros } from "@/lib/membros";
import { getProducoes } from "@/lib/producao";
import { ROTULO_ETAPA, ROTULO_STATUS, type StatusProducao } from "@/lib/producao-formato";
import { apagarEntrega, enviarEntrega, salvarProducao } from "../actions";

export const metadata: Metadata = { title: "Publicação" };

export default async function PublicacaoPage({ params }: PageProps<"/producao/[id]">) {
  const { id } = await params;
  const membro = await getMembroAtual();
  const diretoria = membro.papel === "diretoria";
  const [producoes, membros, fotos] = await Promise.all([getProducoes(), diretoria ? getMembros() : Promise.resolve([]), getFotos()]);
  const p = producoes.find((x) => x.id === id);
  if (!p) notFound();

  const artigo = p.tipo === "artigo";
  const nome = `${artigo ? "Artigo" : "Carrossel"} ${String(p.numero ?? "").padStart(2, "0")}`;
  const participa = p.participantes.some((x) => x.id === membro.id);
  const souRevisor = p.participantes.some((x) => x.id === membro.id && x.papel === "revisor");
  const podeEnviar = (participa || diretoria) && membro.papel !== "conselheiro";

  const etapas = [
    artigo && p.inicio_redacao ? { rotulo: "Início da redação", data: p.inicio_redacao } : null,
    p.entrega ? { rotulo: artigo ? "Entrega do rascunho" : "Entrega da arte", data: p.entrega } : null,
    artigo && p.fim_revisao ? { rotulo: "Fim da revisão", data: p.fim_revisao } : null,
    { rotulo: "Publicação", data: p.publicacao },
  ].filter((e): e is { rotulo: string; data: string } => Boolean(e));

  return (
    <Pagina>
      <Link href={`/producao${artigo ? "?aba=artigos" : ""}`} className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Produção
      </Link>
      <CabecalhoDaPagina
        contexto={
          <span className="flex flex-wrap items-center gap-2">
            {nome} · {artigo ? "LinkedIn" : "Instagram"}
            <span className="selo">{ROTULO_STATUS[p.status]}</span>
          </span>
        }
        titulo={p.tema ?? "Tema a definir"}
        acoes={
          p.link_publicado ? (
            <a href={p.link_publicado} target="_blank" rel="noopener noreferrer" className="botao botao-secundario">
              Ver publicação
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : null
        }
      />

      {/* Prazos */}
      <ol className="mb-8 grid gap-2 sm:grid-cols-4">
        {etapas.map((e) => {
          const passou = diasAte(e.data) < 0;
          return (
            <li key={e.rotulo} className={`cartao p-3.5 ${passou ? "bg-sutil/60" : ""}`}>
              <p className="text-xs font-medium text-grafite">{e.rotulo}</p>
              <p className={`numeral mt-1 text-lg font-bold ${passou ? "text-grafite" : "text-tinta"}`}>{curta(e.data)}</p>
              <p className="text-xs text-grafite">{quando(e.data)}</p>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="quem" className="mb-8">
        <h2 id="quem" className="h3 mb-3">
          Quem faz
        </h2>
        <ul className="flex flex-wrap gap-2">
          {p.participantes.map((x) => (
            <li key={`${x.id}-${x.papel}`} className="flex items-center gap-2 rounded-full bg-superficie py-1 pr-3.5 pl-1 ring-1 ring-linha">
              <Avatar nome={x.nome} foto={fotos[x.id]} tamanho="sm" />
              <span className="text-sm text-tinta">
                {x.nome}
                <span className="text-grafite"> · {x.papel === "autor" ? "autoria" : "revisão"}</span>
              </span>
            </li>
          ))}
          {p.participantes.length === 0 ? <li className="text-grafite">{p.autores ?? "Autores a definir"}</li> : null}
          {p.revisor ? <li className="flex items-center rounded-full bg-superficie px-3.5 py-1.5 text-sm text-tinta ring-1 ring-linha">{p.revisor} <span className="text-grafite">&nbsp;· revisão</span></li> : null}
        </ul>
      </section>

      <section aria-labelledby="entregas" className="mb-8">
        <h2 id="entregas" className="h3 mb-3">
          Entregas
        </h2>
        {p.entregas.length === 0 ? (
          <p className="text-grafite">Nenhuma entrega ainda.</p>
        ) : (
          <ul className="cartao divide-y divide-linha">
            {p.entregas.map((e) => (
              <li key={e.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-tinta">
                    {ROTULO_ETAPA[e.etapa]}
                    <span className="font-normal text-grafite">
                      {" "}
                      · {e.autor?.nome ?? "Diretoria"} · {registro(e.criado_em)}
                    </span>
                  </p>
                  {e.nota ? <p className="mt-0.5 text-[0.9375rem] whitespace-pre-line text-grafite">{e.nota}</p> : null}
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="link mt-1 inline-flex items-center gap-1 text-sm break-all">
                    Abrir documento
                    <ArrowUpRight aria-hidden="true" className="size-3.5" />
                  </a>
                </div>
                {e.autor?.id === membro.id || diretoria ? (
                  <AcaoRapida acao={apagarEntrega} confirmar="Apagar esta entrega?">
                    <input type="hidden" name="id" value={e.id} />
                    <input type="hidden" name="producao_id" value={p.id} />
                    <button type="submit" aria-label="Apagar entrega" className="flex size-9 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
                      <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
                    </button>
                  </AcaoRapida>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {podeEnviar ? (
        <section aria-labelledby="enviar" className="cartao mb-8 p-5 sm:p-6">
          <h2 id="enviar" className="h3">
            Enviar entrega
          </h2>
          <p className="mt-1 text-[0.9375rem] text-grafite">
            {artigo
              ? "Cole o link do Google Docs com permissão de comentário. Prazo do rascunho: " + (p.entrega ? `${longa(p.entrega)}.` : "a definir.")
              : "Cole o link do Canva (cópia do modelo) ou do Drive. Entrega até segunda, às 18h."}
          </p>
          <Formulario acao={enviarEntrega} resetar className="mt-4 grid gap-4 sm:grid-cols-[12rem_1fr]">
            <input type="hidden" name="producao_id" value={p.id} />
            <Escolha
              nome="etapa"
              rotulo="O que é"
              padrao={souRevisor ? "revisao" : p.entregas.some((e) => e.etapa === "rascunho") ? "final" : "rascunho"}
              opcoes={[
                { valor: "rascunho", rotulo: artigo ? "Rascunho" : "Arte para revisão" },
                ...(artigo ? [{ valor: "revisao", rotulo: "Parecer da revisão" }] : []),
                { valor: "final", rotulo: "Versão final" },
              ]}
            />
            <Campo nome="link" rotulo="Link" tipo="url" obrigatorio placeholder="https://docs.google.com/..." />
            <AreaDeTexto nome="nota" rotulo="Recado para a diretoria" linhas={2} className="sm:col-span-2" />
            <BotaoEnviar enviando="Enviando…" className="justify-self-start">
              Enviar
            </BotaoEnviar>
          </Formulario>
        </section>
      ) : null}

      {diretoria ? (
        <Recolhivel titulo="Editar publicação (diretoria)">
          <Formulario acao={salvarProducao} className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="producao_id" value={p.id} />
            <Campo nome="tema" rotulo="Tema" padrao={p.tema ?? ""} maxLength={300} className="sm:col-span-2" />
            <Escolha
              nome="status"
              rotulo="Status"
              padrao={p.status}
              opcoes={(Object.keys(ROTULO_STATUS) as StatusProducao[]).map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))}
            />
            <Campo nome="revisor" rotulo="Revisor de fora da liga" padrao={p.revisor ?? ""} maxLength={200} />
            <Campo nome="entrega" rotulo={artigo ? "Entrega do rascunho" : "Entrega"} tipo="date" padrao={p.entrega ?? ""} />
            {artigo ? <Campo nome="fim_revisao" rotulo="Fim da revisão" tipo="date" padrao={p.fim_revisao ?? ""} /> : <input type="hidden" name="fim_revisao" value={p.fim_revisao ?? ""} />}
            <Campo nome="publicacao" rotulo="Publicação" tipo="date" obrigatorio padrao={p.publicacao} />
            <Campo nome="link_publicado" rotulo="Link da publicação" tipo="url" padrao={p.link_publicado ?? ""} />
            <Campo nome="autores" rotulo="Autores (como aparecem no calendário)" padrao={p.autores ?? ""} maxLength={300} className="sm:col-span-2" />
            <fieldset className="sm:col-span-2">
              <legend className="rotulo-campo">Autoria e revisão na plataforma</legend>
              <p className="mb-2 text-sm text-grafite">Quem está marcado aqui vê a publicação como sua e pode enviar entregas.</p>
              <div className="max-h-64 overflow-y-auto rounded-[0.625rem] border border-linha-forte bg-superficie">
                <div className="sticky top-0 grid grid-cols-[1fr_4.5rem_4.5rem] border-b border-linha bg-sutil px-3 py-1.5 text-xs font-semibold text-grafite">
                  <span>Membro</span>
                  <span className="text-center">Autor</span>
                  <span className="text-center">Revisor</span>
                </div>
                {membros
                  .filter((m) => m.ativo)
                  .map((m) => (
                    <div key={m.id} className="grid min-h-10 grid-cols-[1fr_4.5rem_4.5rem] items-center px-3 text-sm text-tinta">
                      <span className="truncate">{m.nome}</span>
                      <input
                        type="checkbox"
                        name="autor_ids"
                        value={m.id}
                        aria-label={`${m.nome} como autor`}
                        defaultChecked={p.participantes.some((x) => x.id === m.id && x.papel === "autor")}
                        className="size-4 justify-self-center accent-vinho"
                      />
                      <input
                        type="checkbox"
                        name="revisor_ids"
                        value={m.id}
                        aria-label={`${m.nome} como revisor`}
                        defaultChecked={p.participantes.some((x) => x.id === m.id && x.papel === "revisor")}
                        className="size-4 justify-self-center accent-vinho"
                      />
                    </div>
                  ))}
              </div>
            </fieldset>
            <AreaDeTexto nome="observacoes" rotulo="Observações internas" padrao={p.observacoes ?? ""} linhas={2} className="sm:col-span-2" />
            <BotaoEnviar className="justify-self-start">Salvar</BotaoEnviar>
          </Formulario>
        </Recolhivel>
      ) : null}
    </Pagina>
  );
}
