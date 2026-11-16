import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Formulario } from "@/components/formulario";
import { Avatar, Pagina } from "@/components/ui";
import { registro } from "@/lib/datas";
import { getFotos, type Fotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getPergunta, type Resposta } from "@/lib/tira-duvidas";
import { apagarPergunta, decidirResposta, mudarStatusPergunta, responder } from "../actions";

export const metadata: Metadata = { title: "Pergunta" };

const ROTULO_ORIGEM = { ligante: "Ligante", diretoria: "Diretoria", ia: "Rascunho da IA" } as const;

export default async function PerguntaPage({ params }: PageProps<"/tira-duvidas/[id]">) {
  const { id } = await params;
  const [membro, pergunta, fotos] = await Promise.all([getMembroAtual(), getPergunta(id), getFotos()]);
  if (!pergunta) notFound();

  const diretoria = membro.papel === "diretoria";
  const validadas = pergunta.respostas.filter((r) => r.status === "validada");
  const pendentes = pergunta.respostas.filter((r) => r.status === "pendente");
  const minhasPendentes = pendentes.filter((r) => r.autor?.id === membro.id);
  const podeResponder = membro.papel !== "conselheiro" && (pergunta.visibilidade === "publica" || diretoria) && pergunta.status !== "arquivada";

  return (
    <Pagina>
      <Link href="/tira-duvidas" className="mb-4 inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Tira-dúvidas
      </Link>

      <article className="cartao p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-1.5">
          {pergunta.visibilidade === "privada" ? <span className="selo">Privada: só você e a diretoria</span> : null}
          {pergunta.tema ? <span className="selo">{pergunta.tema}</span> : null}
          {pergunta.status === "arquivada" ? <span className="selo">Arquivada</span> : null}
        </div>
        <h1 className="mt-3 text-[1.625rem] leading-tight font-bold tracking-[-0.022em] text-tinta sm:text-[2rem]">{pergunta.titulo}</h1>
        <p className="prosa mt-3 whitespace-pre-line text-tinta">{pergunta.corpo}</p>
        <p className="mt-4 flex items-center gap-2 text-sm text-grafite">
          {pergunta.autor ? <Avatar nome={pergunta.autor.nome} foto={fotos[pergunta.autor.id]} tamanho="sm" /> : null}
          {pergunta.autor?.nome ?? "Membro"} · {registro(pergunta.criado_em)}
        </p>
        {diretoria ? (
          <div className="mt-5 flex flex-wrap gap-1 border-t border-linha pt-4">
            {pergunta.status !== "arquivada" ? (
              <AcaoRapida acao={mudarStatusPergunta}>
                <input type="hidden" name="id" value={pergunta.id} />
                <input type="hidden" name="status" value="arquivada" />
                <BotaoEnviar variante="discreto" enviando="Arquivando…">
                  Arquivar
                </BotaoEnviar>
              </AcaoRapida>
            ) : (
              <AcaoRapida acao={mudarStatusPergunta}>
                <input type="hidden" name="id" value={pergunta.id} />
                <input type="hidden" name="status" value="aberta" />
                <BotaoEnviar variante="discreto">Reabrir</BotaoEnviar>
              </AcaoRapida>
            )}
            <AcaoRapida acao={apagarPergunta} confirmar="Apagar a pergunta e todas as respostas?">
              <input type="hidden" name="id" value={pergunta.id} />
              <BotaoEnviar variante="discreto" enviando="Apagando…">
                Apagar
              </BotaoEnviar>
            </AcaoRapida>
          </div>
        ) : null}
      </article>

      <section aria-labelledby="respostas" className="mt-8">
        <h2 id="respostas" className="h2 mb-4">
          {validadas.length === 0 ? "Ainda sem resposta" : `${validadas.length} ${validadas.length === 1 ? "resposta" : "respostas"}`}
        </h2>
        <div className="flex flex-col gap-3">
          {validadas.map((r) => (
            <CartaoResposta key={r.id} resposta={r} fotos={fotos} />
          ))}
          {!diretoria
            ? minhasPendentes.map((r) => <CartaoResposta key={r.id} resposta={r} fotos={fotos} aviso="Sua resposta está em análise pela diretoria." />)
            : null}
        </div>
      </section>

      {diretoria && pendentes.length > 0 ? (
        <section aria-labelledby="validar" className="mt-8">
          <h2 id="validar" className="h3 mb-3">
            Aguardando validação
          </h2>
          <div className="flex flex-col gap-3">
            {pendentes.map((r) => (
              <CartaoResposta key={r.id} resposta={r} fotos={fotos}>
                <div className="mt-4 flex gap-2 border-t border-linha pt-4">
                  <AcaoRapida acao={decidirResposta}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="pergunta_id" value={pergunta.id} />
                    <input type="hidden" name="decisao" value="validada" />
                    <BotaoEnviar enviando="Publicando…">Validar e publicar</BotaoEnviar>
                  </AcaoRapida>
                  <AcaoRapida acao={decidirResposta}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="pergunta_id" value={pergunta.id} />
                    <input type="hidden" name="decisao" value="recusada" />
                    <BotaoEnviar variante="secundario" enviando="Recusando…">
                      Recusar
                    </BotaoEnviar>
                  </AcaoRapida>
                </div>
              </CartaoResposta>
            ))}
          </div>
        </section>
      ) : null}

      {podeResponder ? (
        <section aria-labelledby="responder" className="cartao mt-8 p-5 sm:p-6">
          <h2 id="responder" className="h3">
            {diretoria ? "Responder como diretoria" : "Responder"}
          </h2>
          <p className="mt-1 text-[0.9375rem] text-grafite">
            {diretoria ? "A resposta da diretoria é publicada na hora." : "Cite a lei, a doutrina ou o julgado. A diretoria valida antes de publicar."}
          </p>
          <Formulario acao={responder} resetar className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="pergunta_id" value={pergunta.id} />
            <AreaDeTexto nome="corpo" rotulo="Sua resposta" obrigatorio linhas={6} maxLength={8000} />
            <BotaoEnviar enviando="Enviando…" className="self-start">
              {diretoria ? "Publicar resposta" : "Enviar para validação"}
            </BotaoEnviar>
          </Formulario>
        </section>
      ) : null}
    </Pagina>
  );
}

function CartaoResposta({ resposta: r, fotos, aviso, children }: { resposta: Resposta; fotos: Fotos; aviso?: string; children?: React.ReactNode }) {
  return (
    <article className={`cartao p-5 ${r.origem === "diretoria" ? "border-vinho-borda" : ""}`}>
      <p className="flex flex-wrap items-center gap-2 text-sm text-grafite">
        {r.autor ? <Avatar nome={r.autor.nome} foto={fotos[r.autor.id]} tamanho="sm" /> : null}
        <span className="font-semibold text-tinta">{r.autor?.nome ?? "Membro"}</span>
        <span className={`selo ${r.origem === "diretoria" ? "selo-suave" : ""}`}>{ROTULO_ORIGEM[r.origem]}</span>
        <span>{registro(r.criado_em)}</span>
      </p>
      {aviso ? <p className="aviso aviso-ok mt-3 text-sm">{aviso}</p> : null}
      <p className="prosa mt-3 whitespace-pre-line text-tinta">{r.corpo}</p>
      {children}
    </article>
  );
}
