import type { Metadata } from "next";
import Link from "next/link";
import { Pin } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario, Marcar } from "@/components/formulario";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, Numero, Pagina, Recolhivel, Vazio, type Aba } from "@/components/ui";
import { getAvisos } from "@/lib/avisos";
import { rotuloAula } from "@/lib/ciclos";
import { curta, dia, hoje, registro } from "@/lib/datas";
import { LIMITE_DE_FALTAS } from "@/lib/frequencia";
import { exigirGestao } from "@/lib/membro";
import { getMembros, ROTULO_PAPEL, type MembroDaLista } from "@/lib/membros";
import { createClient } from "@/lib/supabase/server";
import { getPerguntas, getRespostasPendentes } from "@/lib/tira-duvidas";
import { decidirResposta } from "../tira-duvidas/actions";
import { adicionarMembro, alterarAviso, decidirJustificativa, publicarAviso, registrarPresencas, salvarMembro } from "./actions";

export const metadata: Metadata = { title: "Gestão" };

type Linha<T> = T | T[] | null;
const um = <T,>(v: Linha<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

export default async function GestaoPage({ searchParams }: PageProps<"/gestao">) {
  const [params, eu] = await Promise.all([searchParams, exigirGestao()]);
  const diretoria = eu.papel === "diretoria";
  const supabase = await createClient();

  const [membros, avisos, respostasPendentes, perguntas, { data: ciclo }, { data: justificativas }] = await Promise.all([
    getMembros(),
    getAvisos(),
    getRespostasPendentes(),
    getPerguntas(),
    supabase.from("ciclos").select("id, codigo").eq("status", "atual").limit(1).maybeSingle(),
    supabase
      .from("justificativas")
      .select("id, motivo, status, criado_em, membro:membros!justificativas_membro_id_fkey(nome), aula:aulas(id, numero, titulo, data)")
      .order("criado_em", { ascending: false })
      .limit(50),
  ]);

  const { data: aulasDoCiclo } = ciclo
    ? await supabase.from("aulas").select("id, numero, titulo, data").eq("ciclo_id", ciclo.id).not("data", "is", null).order("data")
    : { data: [] };
  const realizadas = (aulasDoCiclo ?? []).filter((a) => dia(a.data as string) <= hoje());
  const aulaPedida = typeof params.aula === "string" ? params.aula : null;
  const aulaSelecionada = realizadas.find((a) => a.id === aulaPedida) ?? realizadas[realizadas.length - 1] ?? null;

  const { data: presencasDoCiclo } = realizadas.length
    ? await supabase.from("presencas").select("aula_id, membro_id, status").in("aula_id", realizadas.map((a) => a.id))
    : { data: [] };

  const pendentesJust = (justificativas ?? []).filter((j) => j.status === "pendente");
  const privadasAbertas = perguntas.filter((p) => p.visibilidade === "privada" && p.status === "aberta");
  const participantes = membros.filter((m) => m.ativo && m.papel !== "conselheiro");

  const faltasPorMembro = new Map<string, number>();
  for (const p of presencasDoCiclo ?? []) if (p.status === "falta") faltasPorMembro.set(p.membro_id, (faltasPorMembro.get(p.membro_id) ?? 0) + 1);

  const abas: Aba[] = [
    { id: "membros", rotulo: "Membros", contagem: membros.filter((m) => m.ativo).length },
    { id: "frequencia", rotulo: "Frequência", contagem: pendentesJust.length || undefined },
    { id: "avisos", rotulo: "Avisos" },
    { id: "fila", rotulo: "Tira-dúvidas", contagem: respostasPendentes.length + privadasAbertas.length || undefined },
  ];
  const ativa = abaAtual(params.aba, abas);

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Gestão"
        descricao={diretoria ? "Administração da liga: membros, frequência, avisos e a fila do tira-dúvidas." : "Acompanhamento da liga, em modo leitura para o conselho."}
        acoes={
          <>
            <Link href="/gestao/planejamento" className="botao">
              Planejamento do ciclo
            </Link>
            <Link href="/professores" className="botao botao-secundario">
              Professores
            </Link>
            <Link href="/regularizacao" className="botao botao-secundario">
              Documentos da liga
            </Link>
          </>
        }
      />
      <Abas base="/gestao" atual={ativa} itens={abas} />

      {ativa === "membros" ? (
        <>
          <Grade colunas={4}>
            <Numero rotulo="Membros ativos" valor={membros.filter((m) => m.ativo).length} />
            <Numero rotulo="Com conta criada" valor={membros.filter((m) => m.temConta).length} />
            <Numero rotulo="Sem e-mail cadastrado" valor={membros.filter((m) => m.ativo && !m.email).length} alerta={membros.some((m) => m.ativo && !m.email)} detalhe="Sem e-mail, a pessoa não consegue criar a conta." />
            <Numero rotulo="Diretoria e conselho" valor={membros.filter((m) => m.ativo && m.papel !== "ligante").length} />
          </Grade>

          <div className="cartao mt-6 overflow-hidden">
            <div className="hidden grid-cols-[1.6fr_1.4fr_0.8fr_0.8fr] gap-4 border-b border-linha bg-sutil px-4 py-2.5 text-xs font-semibold text-grafite md:grid">
              <span>Nome</span>
              <span>E-mail de acesso</span>
              <span>Papel</span>
              <span>Situação</span>
            </div>
            <ul className="divide-y divide-linha">
              {membros.map((m) => (
                <LinhaDeMembro key={m.id} membro={m} editavel={diretoria} faltas={faltasPorMembro.get(m.id) ?? 0} />
              ))}
            </ul>
          </div>

          {diretoria ? (
            <div className="mt-6">
              <Recolhivel titulo="Adicionar membro">
                <Formulario acao={adicionarMembro} resetar className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Campo nome="nome" rotulo="Nome completo" obrigatorio maxLength={200} className="sm:col-span-2" />
                  <Campo nome="email" rotulo="E-mail" tipo="email" ajuda="É com este e-mail que a pessoa cria a conta." />
                  <Escolha nome="papel" rotulo="Papel" opcoes={Object.entries(ROTULO_PAPEL).map(([valor, rotulo]) => ({ valor, rotulo }))} />
                  <BotaoEnviar className="justify-self-start">Adicionar</BotaoEnviar>
                </Formulario>
              </Recolhivel>
            </div>
          ) : null}
        </>
      ) : null}

      {ativa === "frequencia" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
          <section aria-labelledby="registro">
            <h2 id="registro" className="h3 mb-3">
              Registro de presença
            </h2>
            {realizadas.length === 0 || !aulaSelecionada ? (
              <Vazio titulo="Nenhuma aula realizada no ciclo" />
            ) : (
              <>
                <nav aria-label="Escolher aula" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
                  {realizadas.map((a) => (
                    <Link
                      key={a.id}
                      href={`/gestao?aba=frequencia&aula=${a.id}`}
                      scroll={false}
                      aria-current={a.id === aulaSelecionada.id ? "true" : undefined}
                      className={`numeral inline-flex min-h-9 shrink-0 items-center rounded-full px-3 text-sm font-medium ${
                        a.id === aulaSelecionada.id ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
                      }`}
                    >
                      {a.numero ? `Aula ${a.numero}` : "Extra"} · {curta(a.data as string)}
                    </Link>
                  ))}
                </nav>
                <div className="cartao p-4 sm:p-5">
                  <p className="text-sm font-semibold text-vinho">{rotuloAula(aulaSelecionada.numero)}</p>
                  <p className="font-semibold text-tinta">{aulaSelecionada.titulo}</p>
                  <Formulario key={aulaSelecionada.id} acao={registrarPresencas} className="mt-4 flex flex-col gap-4">
                    <input type="hidden" name="aula_id" value={aulaSelecionada.id} />
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[30rem] text-sm">
                        <thead>
                          <tr className="text-left text-xs text-grafite">
                            <th className="py-2 font-semibold">Membro</th>
                            <th className="w-20 py-2 text-center font-semibold">Presente</th>
                            <th className="w-20 py-2 text-center font-semibold">Falta</th>
                            <th className="w-24 py-2 text-center font-semibold">Justificada</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-linha">
                          {participantes.map((m) => {
                            const atual = (presencasDoCiclo ?? []).find((p) => p.aula_id === aulaSelecionada.id && p.membro_id === m.id)?.status ?? "";
                            return (
                              <tr key={m.id}>
                                <td className="py-2 pr-2 text-tinta">{m.nome}</td>
                                {(["presente", "falta", "justificada"] as const).map((s) => (
                                  <td key={s} className="py-2 text-center">
                                    <input
                                      type="radio"
                                      name={`p_${m.id}`}
                                      value={s}
                                      defaultChecked={atual === s}
                                      disabled={!diretoria}
                                      aria-label={`${m.nome}: ${s}`}
                                      className="size-[1.125rem] accent-vinho"
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {diretoria ? <BotaoEnviar className="self-start">Salvar frequência</BotaoEnviar> : null}
                  </Formulario>
                </div>
              </>
            )}
          </section>

          <aside aria-labelledby="justificativas" className="flex flex-col gap-6">
            <section>
              <h2 id="justificativas" className="h3 mb-3">
                Justificativas a decidir
              </h2>
              {pendentesJust.length === 0 ? (
                <p className="cartao p-4 text-[0.9375rem] text-grafite">Nenhuma pendente.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {pendentesJust.map((j) => {
                    const aula = um(j.aula as Linha<{ id: string; numero: number | null; titulo: string; data: string }>);
                    return (
                      <li key={j.id} className="cartao p-4">
                        <p className="font-semibold text-tinta">{um(j.membro as Linha<{ nome: string }>)?.nome}</p>
                        <p className="text-sm text-grafite">
                          {rotuloAula(aula?.numero ?? null)} · {aula?.data ? curta(aula.data) : ""} · enviada {registro(j.criado_em)}
                        </p>
                        <p className="mt-2 text-[0.9375rem] whitespace-pre-line text-tinta">{j.motivo}</p>
                        {diretoria ? (
                          <div className="mt-3 flex gap-2">
                            <AcaoRapida acao={decidirJustificativa}>
                              <input type="hidden" name="id" value={j.id} />
                              <input type="hidden" name="decisao" value="aceita" />
                              <BotaoEnviar enviando="…">Aceitar</BotaoEnviar>
                            </AcaoRapida>
                            <AcaoRapida acao={decidirJustificativa}>
                              <input type="hidden" name="id" value={j.id} />
                              <input type="hidden" name="decisao" value="recusada" />
                              <BotaoEnviar variante="secundario" enviando="…">
                                Recusar
                              </BotaoEnviar>
                            </AcaoRapida>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <section>
              <h2 className="h3 mb-3">Perto do limite</h2>
              {participantes.filter((m) => (faltasPorMembro.get(m.id) ?? 0) >= LIMITE_DE_FALTAS - 1).length === 0 ? (
                <p className="cartao p-4 text-[0.9375rem] text-grafite">Ninguém com duas faltas ou mais.</p>
              ) : (
                <ul className="cartao divide-y divide-linha">
                  {participantes
                    .filter((m) => (faltasPorMembro.get(m.id) ?? 0) >= LIMITE_DE_FALTAS - 1)
                    .map((m) => (
                      <li key={m.id} className="flex items-center justify-between p-3 text-sm">
                        <span className="text-tinta">{m.nome}</span>
                        <span className={`selo ${(faltasPorMembro.get(m.id) ?? 0) >= LIMITE_DE_FALTAS ? "selo-vinho" : "selo-suave"}`}>
                          {faltasPorMembro.get(m.id)} faltas
                        </span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </aside>
        </div>
      ) : null}

      {ativa === "avisos" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_24rem]">
          <section>
            <h2 className="h3 mb-3">Publicados</h2>
            {avisos.length === 0 ? (
              <Vazio titulo="Nenhum aviso publicado" />
            ) : (
              <ul className="flex flex-col gap-2">
                {avisos.map((a) => (
                  <li key={a.id} className="cartao p-4 sm:p-5">
                    <p className="flex items-center gap-1.5 font-semibold text-tinta">
                      {a.fixado ? <Pin aria-label="Fixado" className="size-3.5 text-vinho" /> : null}
                      {a.titulo}
                    </p>
                    <p className="mt-1 text-[0.9375rem] whitespace-pre-line text-grafite">{a.corpo}</p>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className="text-xs text-grafite">
                        {registro(a.publicado_em)}
                        {a.autor ? ` · ${a.autor}` : ""}
                      </p>
                      {diretoria ? (
                        <div className="flex gap-1">
                          <AcaoRapida acao={alterarAviso}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="acao" value={a.fixado ? "desafixar" : "fixar"} />
                            <BotaoEnviar variante="discreto" enviando="…">
                              {a.fixado ? "Desafixar" : "Fixar no topo"}
                            </BotaoEnviar>
                          </AcaoRapida>
                          <AcaoRapida acao={alterarAviso} confirmar="Apagar este aviso?">
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="acao" value="apagar" />
                            <BotaoEnviar variante="discreto" enviando="…">
                              Apagar
                            </BotaoEnviar>
                          </AcaoRapida>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {diretoria ? (
            <section className="cartao self-start p-5">
              <h2 className="h3 mb-4">Novo aviso</h2>
              <Formulario acao={publicarAviso} resetar>
                <Campo nome="titulo" rotulo="Título" obrigatorio maxLength={200} />
                <AreaDeTexto nome="corpo" rotulo="Texto" obrigatorio linhas={6} maxLength={5000} />
                <Marcar nome="fixado" rotulo="Fixar no topo do Início" />
                <BotaoEnviar enviando="Publicando…" className="self-start">
                  Publicar
                </BotaoEnviar>
              </Formulario>
            </section>
          ) : null}
        </div>
      ) : null}

      {ativa === "fila" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section>
            <h2 className="h3 mb-3">Respostas para validar</h2>
            {respostasPendentes.length === 0 ? (
              <p className="cartao p-4 text-[0.9375rem] text-grafite">Fila vazia.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {respostasPendentes.map((r) => (
                  <li key={r.id} className="cartao p-4">
                    <Link href={`/tira-duvidas/${r.pergunta?.id}`} className="font-semibold text-tinta hover:text-vinho">
                      {r.pergunta?.titulo}
                    </Link>
                    <p className="text-sm text-grafite">
                      {r.autor} · {registro(r.criado_em)}
                    </p>
                    <p className="mt-2 line-clamp-6 text-[0.9375rem] whitespace-pre-line text-tinta">{r.corpo}</p>
                    {diretoria && r.pergunta ? (
                      <div className="mt-3 flex gap-2">
                        <AcaoRapida acao={decidirResposta}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="pergunta_id" value={r.pergunta.id} />
                          <input type="hidden" name="decisao" value="validada" />
                          <BotaoEnviar enviando="…">Validar</BotaoEnviar>
                        </AcaoRapida>
                        <AcaoRapida acao={decidirResposta}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="pergunta_id" value={r.pergunta.id} />
                          <input type="hidden" name="decisao" value="recusada" />
                          <BotaoEnviar variante="secundario" enviando="…">
                            Recusar
                          </BotaoEnviar>
                        </AcaoRapida>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section>
            <h2 className="h3 mb-3">Perguntas privadas sem resposta</h2>
            {privadasAbertas.length === 0 ? (
              <p className="cartao p-4 text-[0.9375rem] text-grafite">Nenhuma.</p>
            ) : (
              <ul className="cartao divide-y divide-linha">
                {privadasAbertas.map((p) => (
                  <li key={p.id}>
                    <Link href={`/tira-duvidas/${p.id}`} className="block p-4 hover:bg-sutil/60">
                      <span className="block font-semibold text-tinta">{p.titulo}</span>
                      <span className="block text-sm text-grafite">
                        {p.autor?.nome} · {curta(p.criado_em)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Pagina>
  );
}

function LinhaDeMembro({ membro: m, editavel, faltas }: { membro: MembroDaLista; editavel: boolean; faltas: number }) {
  const resumo = (
    <div className="grid grid-cols-1 gap-1 md:grid-cols-[1.6fr_1.4fr_0.8fr_0.8fr] md:items-center md:gap-4">
      <span className={`font-medium ${m.ativo ? "text-tinta" : "text-grafite line-through"}`}>{m.nome}</span>
      <span className="truncate text-sm text-grafite">{m.email ?? <span className="text-vinho">sem e-mail</span>}</span>
      <span className="text-sm">
        <span className={`selo ${m.papel === "diretoria" ? "selo-suave" : ""}`}>{ROTULO_PAPEL[m.papel]}</span>
        {m.diretorAcademico ? <span className="selo ml-1">Diretor acadêmico</span> : null}
      </span>
      <span className="text-sm text-grafite">
        {!m.ativo ? "Inativo" : m.temConta ? "Conta criada" : "Sem conta"}
        {faltas > 0 ? ` · ${faltas} ${faltas === 1 ? "falta" : "faltas"}` : ""}
      </span>
    </div>
  );
  if (!editavel) return <li className="px-4 py-3">{resumo}</li>;
  return (
    <li>
      <details className="group">
        <summary className="cursor-pointer list-none px-4 py-3 hover:bg-sutil/60 [&::-webkit-details-marker]:hidden">{resumo}</summary>
        <Formulario acao={salvarMembro} className="grid grid-cols-1 gap-4 border-t border-linha bg-sutil/50 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="id" value={m.id} />
          <Campo prefixo={m.id} nome="nome" rotulo="Nome" obrigatorio padrao={m.nome} maxLength={200} />
          <Campo prefixo={m.id} nome="email" rotulo="E-mail de acesso" tipo="email" padrao={m.email ?? ""} />
          <Escolha prefixo={m.id} nome="papel" rotulo="Papel" padrao={m.papel} opcoes={Object.entries(ROTULO_PAPEL).map(([valor, rotulo]) => ({ valor, rotulo }))} />
          <Escolha
            prefixo={m.id}
            nome="ativo"
            rotulo="Situação"
            padrao={m.ativo ? "sim" : "nao"}
            opcoes={[
              { valor: "sim", rotulo: "Ativo" },
              { valor: "nao", rotulo: "Inativo (sem acesso)" },
            ]}
          />
          <Escolha
            prefixo={m.id}
            nome="acesso_diretoria"
            rotulo="Permissões"
            padrao={m.acessoDiretoria ? "sim" : "nao"}
            ajuda="Acesso de diretoria vale para ligantes que ajudam a manter a plataforma, sem mudar o cargo."
            opcoes={[
              { valor: "nao", rotulo: "As do cargo" },
              { valor: "sim", rotulo: "Acesso de diretoria" },
            ]}
          />
          <Escolha
            prefixo={m.id}
            nome="diretor_academico"
            rotulo="Mini-artigos"
            padrao={m.diretorAcademico ? "sim" : "nao"}
            ajuda="O diretor acadêmico designa revisores e faz a conferência final. Só vale para quem tem permissões de diretoria."
            opcoes={[
              { valor: "nao", rotulo: "Sem função no fluxo" },
              { valor: "sim", rotulo: "Diretor acadêmico" },
            ]}
          />
          <BotaoEnviar variante="secundario" className="justify-self-start">
            Salvar
          </BotaoEnviar>
        </Formulario>
      </details>
    </li>
  );
}
