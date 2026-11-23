import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { FluxoDoArtigo } from "@/components/fluxo-artigo";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { Avatar, CabecalhoDaPagina, Pagina, Recolhivel } from "@/components/ui";
import { proximoEspacoLivre, rotuloDoArtigo, seloDoArtigo, visaoDoArtigo } from "@/lib/artigo";
import { curta, diasAte, quando, registro } from "@/lib/datas";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getMembros } from "@/lib/membros";
import { getProducoes, revisoesPorMembro } from "@/lib/producao";
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

  // ───────────── Mini-artigo: fluxo completo ─────────────
  if (p.tipo === "artigo") {
    const artigos = producoes.filter((x) => x.tipo === "artigo");
    const v = visaoDoArtigo(p, membro);
    const selo = seloDoArtigo(p);
    return (
      <Pagina>
        <Voltar href="/producao?aba=artigos" rotulo="Mini-artigos" />
        <CabecalhoDaPagina
          contexto={
            <span className="flex flex-wrap items-center gap-2">
              {rotuloDoArtigo(p)} · LinkedIn
              {selo.texto ? <span className={`selo ${selo.tom === "forte" ? "selo-vinho" : selo.tom === "suave" ? "selo-suave" : ""}`}>{selo.texto}</span> : null}
              {v.autor ? <span className="selo selo-suave">Sua autoria</span> : v.revisor ? <span className="selo selo-suave">Sua revisão</span> : null}
            </span>
          }
          titulo={p.tema ?? "Tema a definir"}
          acoes={p.link_publicado ? <VerPublicacao href={p.link_publicado} /> : null}
        />
        <FluxoDoArtigo
          p={p}
          v={v}
          fotos={fotos}
          membros={membros}
          revisoes={Object.fromEntries(revisoesPorMembro(artigos))}
          temasOutros={artigos.filter((x) => x.id !== p.id && x.tema).map((x) => ({ rotulo: rotuloDoArtigo(x), tema: x.tema as string }))}
          espacoLivre={proximoEspacoLivre(artigos, p.id)}
          semDiretorAcademico={diretoria && !membros.some((m) => m.ativo && m.diretorAcademico)}
        />
      </Pagina>
    );
  }

  // ───────────── Carrossel ─────────────
  const participa = p.participantes.some((x) => x.id === membro.id);
  const podeEnviar = (participa || diretoria) && membro.papel !== "conselheiro";
  const etapas = [p.entrega ? { rotulo: "Entrega da arte", data: p.entrega } : null, p.publicacao ? { rotulo: "Publicação", data: p.publicacao } : null].filter(
    (e): e is { rotulo: string; data: string } => Boolean(e),
  );

  return (
    <Pagina>
      <Voltar href="/producao" rotulo="Produção" />
      <CabecalhoDaPagina
        contexto={
          <span className="flex flex-wrap items-center gap-2">
            Carrossel {String(p.numero ?? "").padStart(2, "0")} · Instagram
            <span className="selo">{ROTULO_STATUS[p.status]}</span>
          </span>
        }
        titulo={p.tema ?? "Tema a definir"}
        acoes={p.link_publicado ? <VerPublicacao href={p.link_publicado} /> : null}
      />

      <ol className="mb-8 grid grid-cols-2 gap-2 sm:max-w-md">
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
            <li key={`${x.id}-${x.papel}`} className="flex max-w-full min-w-0 items-center gap-2 rounded-full bg-superficie py-1 pr-3.5 pl-1 ring-1 ring-linha">
              <Avatar nome={x.nome} foto={fotos[x.id]} tamanho="sm" />
              <span className="min-w-0 truncate text-sm text-tinta">
                {x.nome}
                <span className="text-grafite"> · {x.papel === "autor" ? "autoria" : "revisão"}</span>
              </span>
            </li>
          ))}
          {p.participantes.length === 0 ? <li className="text-grafite">{p.autores ?? "Autores a definir"}</li> : null}
          {p.revisor ? (
            <li className="flex items-center rounded-full bg-superficie px-3.5 py-1.5 text-sm text-tinta ring-1 ring-linha">
              {p.revisor} <span className="text-grafite">&nbsp;· revisão</span>
            </li>
          ) : null}
        </ul>
      </section>

      <section aria-labelledby="entregas" className="mb-8">
        <h2 id="entregas" className="h3 mb-3">
          Entregas
        </h2>
        {p.entregas.length === 0 ? (
          <p className="text-grafite">{participa || membro.papel !== "ligante" ? "Nenhuma entrega ainda." : "As entregas ficam visíveis para a dupla e a diretoria."}</p>
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
                    <button type="submit" aria-label="Apagar entrega" className="flex size-11 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
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
        <section aria-labelledby="enviar" className="cartao mb-8 p-4 sm:p-6">
          <h2 id="enviar" className="h3">
            Enviar entrega
          </h2>
          <p className="mt-1 text-[0.9375rem] text-grafite">Cole o link do Canva (cópia do modelo) ou do Drive. Entrega até segunda, às 18h.</p>
          <Formulario acao={enviarEntrega} resetar className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[12rem_1fr]">
            <input type="hidden" name="producao_id" value={p.id} />
            <Escolha
              nome="etapa"
              rotulo="O que é"
              padrao={p.entregas.some((e) => e.etapa === "rascunho") ? "final" : "rascunho"}
              opcoes={[
                { valor: "rascunho", rotulo: "Arte para revisão" },
                { valor: "final", rotulo: "Versão final" },
              ]}
            />
            <Campo nome="link" rotulo="Link" tipo="url" obrigatorio placeholder="https://www.canva.com/..." />
            <AreaDeTexto nome="nota" rotulo="Recado para a diretoria" linhas={2} className="sm:col-span-2" />
            <BotaoEnviar enviando="Enviando…" className="justify-self-start">
              Enviar
            </BotaoEnviar>
          </Formulario>
        </section>
      ) : null}

      {diretoria ? (
        <Recolhivel titulo="Editar publicação (diretoria)">
          <Formulario acao={salvarProducao} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="hidden" name="producao_id" value={p.id} />
            <Campo nome="tema" rotulo="Tema" padrao={p.tema ?? ""} maxLength={300} className="sm:col-span-2" />
            <Escolha
              nome="status"
              rotulo="Status"
              padrao={p.status}
              opcoes={(Object.keys(ROTULO_STATUS) as StatusProducao[]).map((s) => ({ valor: s, rotulo: ROTULO_STATUS[s] }))}
            />
            <Campo nome="revisor" rotulo="Revisor de fora da liga" padrao={p.revisor ?? ""} maxLength={200} />
            <Campo nome="entrega" rotulo="Entrega" tipo="date" padrao={p.entrega ?? ""} />
            <input type="hidden" name="fim_revisao" value={p.fim_revisao ?? ""} />
            <Campo nome="publicacao" rotulo="Publicação" tipo="date" obrigatorio padrao={p.publicacao ?? ""} />
            <Campo nome="link_publicado" rotulo="Link da publicação" tipo="url" padrao={p.link_publicado ?? ""} className="sm:col-span-2" />
            <Campo nome="autores" rotulo="Autores (como aparecem no calendário)" padrao={p.autores ?? ""} maxLength={300} className="sm:col-span-2" />
            <fieldset className="sm:col-span-2">
              <legend className="rotulo-campo">Autoria e revisão na plataforma</legend>
              <p className="mb-2 text-sm text-grafite">Quem está marcado aqui vê a publicação como sua e pode enviar entregas.</p>
              <div className="max-h-64 overflow-y-auto rounded-[0.625rem] border border-linha-forte bg-superficie">
                <div className="sticky top-0 grid grid-cols-[1fr_4rem_4rem] border-b border-linha bg-sutil px-3 py-1.5 text-xs font-semibold text-grafite">
                  <span>Membro</span>
                  <span className="text-center">Autor</span>
                  <span className="text-center">Revisor</span>
                </div>
                {membros
                  .filter((m) => m.ativo)
                  .map((m) => (
                    <div key={m.id} className="grid min-h-11 grid-cols-[1fr_4rem_4rem] items-center px-3 text-sm text-tinta">
                      <span className="truncate">{m.nome}</span>
                      <input
                        type="checkbox"
                        name="autor_ids"
                        value={m.id}
                        aria-label={`${m.nome} como autor`}
                        defaultChecked={p.participantes.some((x) => x.id === m.id && x.papel === "autor")}
                        className="size-[1.125rem] justify-self-center accent-vinho"
                      />
                      <input
                        type="checkbox"
                        name="revisor_ids"
                        value={m.id}
                        aria-label={`${m.nome} como revisor`}
                        defaultChecked={p.participantes.some((x) => x.id === m.id && x.papel === "revisor")}
                        className="size-[1.125rem] justify-self-center accent-vinho"
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

function Voltar({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <Link href={href} className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
      <ArrowLeft aria-hidden="true" className="size-4" />
      {rotulo}
    </Link>
  );
}

function VerPublicacao({ href }: { href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="botao botao-secundario">
      Ver publicação
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}
