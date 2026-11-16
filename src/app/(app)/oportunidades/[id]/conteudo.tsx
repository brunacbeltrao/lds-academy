import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowUpRight, CalendarClock, CalendarDays, Mail, MapPin, Pin, Users } from "lucide-react";
import { AcaoRapida, BotaoEnviar, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Pagina, Recolhivel } from "@/components/ui";
import { longa, hora, registro } from "@/lib/datas";
import { enderecoDoCartaz, prazoProximo, ROTULO_TIPO, textoDoPrazo, vagasRestantes, type Oportunidade } from "@/lib/oportunidades-formato";
import { alternarPresenca, removerOportunidade, tirarDaLista } from "../actions";
import { FormularioDaOportunidade } from "../formulario";

/** Transforma endereços https em links, mantendo o resto do texto. */
function comLinks(texto: string): ReactNode[] {
  return texto.split(/(https?:\/\/[^\s]+)/g).map((parte, i) =>
    /^https?:\/\//.test(parte) ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer" className="link break-all">
        {parte}
      </a>
    ) : (
      parte
    ),
  );
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Página de uma oportunidade: cartaz, detalhes, "Vou" e, para a gestão, a lista e a edição. */
export function DetalheDaOportunidade({
  oportunidade: o,
  papel,
}: {
  oportunidade: Oportunidade;
  papel: "ligante" | "diretoria" | "conselheiro";
}) {
  const cartaz = enderecoDoCartaz(o);
  const prazo = textoDoPrazo(o);
  const restantes = vagasRestantes(o);
  const gestao = papel !== "ligante";
  const diretoria = papel === "diretoria";
  const podeMarcar = papel !== "conselheiro" && o.pede_lista && o.aberta;
  const contatoEmail = o.contato && EMAIL.test(o.contato.trim()) ? o.contato.trim() : null;

  return (
    <Pagina larga>
      <Link href="/oportunidades" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-grafite transition-colors hover:text-vinho">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Oportunidades
      </Link>

      <div className={`mt-4 grid grid-cols-1 gap-8 ${cartaz ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
        <div className="min-w-0">
          <CabecalhoDaPagina titulo={o.titulo} descricao={o.organizacao ?? undefined}>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {o.fixada ? (
                <span className="selo selo-suave">
                  <Pin aria-hidden="true" className="size-3" strokeWidth={2} />
                  Fixada
                </span>
              ) : null}
              <span className="selo">{ROTULO_TIPO[o.tipo]}</span>
              {!o.aberta ? <span className="selo">Encerrada</span> : null}
            </div>
          </CabecalhoDaPagina>

          <ul className="mb-7 flex flex-col gap-2.5 text-[0.9375rem]">
            {o.prazo && prazo ? (
              <li className={`flex items-start gap-2.5 ${prazoProximo(o) ? "font-semibold text-vinho" : "text-tinta"}`}>
                <CalendarClock aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0" strokeWidth={1.75} />
                {prazo}
              </li>
            ) : null}
            {o.quando ? (
              <li className="flex items-start gap-2.5 text-tinta">
                <CalendarDays aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-grafite" strokeWidth={1.75} />
                <span>
                  <span className="inline-block first-letter:uppercase">{longa(o.quando)}</span>, às {hora(o.quando)}
                </span>
              </li>
            ) : null}
            {o.local ? (
              <li className="flex items-start gap-2.5 text-tinta">
                <MapPin aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-grafite" strokeWidth={1.75} />
                {o.local}
              </li>
            ) : null}
            {o.contato ? (
              <li className="flex items-start gap-2.5 text-tinta">
                <Mail aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0 text-grafite" strokeWidth={1.75} />
                {contatoEmail ? (
                  <a href={`mailto:${contatoEmail}`} className="link break-all">
                    {contatoEmail}
                  </a>
                ) : (
                  <span className="break-words">{o.contato}</span>
                )}
              </li>
            ) : null}
          </ul>

          <div className="prosa text-[1.0625rem] leading-relaxed whitespace-pre-line text-tinta">{comLinks(o.descricao)}</div>

          {o.link ? (
            <a href={o.link} target="_blank" rel="noopener noreferrer" className="botao mt-7">
              {o.tipo === "conteudo" ? "Abrir" : "Inscrição e mais informações"}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </a>
          ) : null}

          {o.pede_lista ? (
            <section aria-labelledby="lista" className="cartao mt-8 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="lista" className="flex items-center gap-2 font-semibold text-tinta">
                    <Users aria-hidden="true" className="size-[1.125rem] text-grafite" strokeWidth={1.75} />
                    Lista de quem vai
                  </h2>
                  <p className="mt-0.5 text-sm text-grafite">
                    {o.interessados.length} {o.interessados.length === 1 ? "nome" : "nomes"}
                    {restantes !== null ? ` · ${restantes === 0 ? "vagas esgotadas" : `${restantes} ${restantes === 1 ? "vaga" : "vagas"}`}` : ""}
                    {o.euVou ? " · você está na lista" : ""}
                  </p>
                </div>
                {podeMarcar ? (
                  o.euVou ? (
                    <AcaoRapida acao={alternarPresenca} confirmar="Tirar o seu nome da lista?">
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="acao" value="sair" />
                      <BotaoEnviar variante="secundario" enviando="Saindo…">
                        Não vou mais
                      </BotaoEnviar>
                    </AcaoRapida>
                  ) : restantes === 0 ? null : (
                    <AcaoRapida acao={alternarPresenca}>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="hidden" name="acao" value="entrar" />
                      <BotaoEnviar enviando="Entrando…">Vou</BotaoEnviar>
                    </AcaoRapida>
                  )
                ) : null}
              </div>
              {podeMarcar && !o.euVou ? (
                <p className="mt-3 text-sm text-grafite">Ao entrar na lista, você se compromete a ir e a chegar no horário: a liga repassa os nomes a quem organiza.</p>
              ) : null}

              {gestao ? (
                o.interessados.length > 0 ? (
                  <ol className="mt-4 divide-y divide-linha border-t border-linha">
                    {o.interessados.map((i, n) => (
                      <li key={i.id} className="flex items-center gap-3 py-2.5">
                        <span className="numeral w-6 text-sm text-grafite">{n + 1}.</span>
                        <span className="min-w-0 flex-1 font-medium text-tinta">{i.nome}</span>
                        <span className="hidden text-xs text-grafite sm:inline">{registro(i.desde)}</span>
                        {diretoria ? (
                          <AcaoRapida acao={tirarDaLista} confirmar={`Tirar ${i.nome} da lista?`}>
                            <input type="hidden" name="id" value={o.id} />
                            <input type="hidden" name="membro_id" value={i.id} />
                            <BotaoEnviar variante="discreto" enviando="…">
                              Tirar
                            </BotaoEnviar>
                          </AcaoRapida>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 border-t border-linha pt-3 text-sm text-grafite">Ninguém na lista ainda.</p>
                )
              ) : null}
            </section>
          ) : null}
        </div>

        {cartaz ? (
          <a href={cartaz} target="_blank" rel="noopener noreferrer" className="block self-start overflow-hidden rounded-2xl border border-linha bg-superficie lg:sticky lg:top-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Storage por link temporário */}
            <img src={cartaz} alt={`Cartaz: ${o.titulo}`} className="w-full" />
            <span className="sr-only">(abre o cartaz em tamanho real)</span>
          </a>
        ) : null}
      </div>

      {diretoria ? (
        <section aria-labelledby="editar" className="mt-12 rounded-2xl bg-sutil p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 id="editar" className="h2">
              Editar
            </h2>
            <span className="selo border border-linha-forte bg-superficie">Só diretoria</span>
          </div>
          <div className="mt-6">
            <FormularioDaOportunidade oportunidade={o} />
          </div>
          <div className="mt-8 border-t border-linha-forte pt-6">
            <Recolhivel titulo="Remover do mural">
              <p className="prosa text-[0.9375rem] text-grafite">Apaga a oportunidade, a lista de quem vai e o cartaz. Para guardar o histórico, prefira deixar o prazo vencer.</p>
              <Formulario acao={removerOportunidade} confirmar="Remover esta oportunidade do mural?" className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="id" value={o.id} />
                <BotaoEnviar variante="secundario" enviando="Removendo…" className="self-start">
                  Remover
                </BotaoEnviar>
              </Formulario>
            </Recolhivel>
          </div>
        </section>
      ) : null}
    </Pagina>
  );
}
