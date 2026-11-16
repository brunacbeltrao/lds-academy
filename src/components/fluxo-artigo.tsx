import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CampoTema } from "@/components/campo-tema";
import { AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario, Marcar } from "@/components/formulario";
import { Avatar, Recolhivel } from "@/components/ui";
import {
  diasDeAtraso,
  ETAPAS,
  indiceDaEtapa,
  nomeDoRevisor,
  prazoDoParecer,
  prazoDoTema,
  ROTULO_CONCLUSAO,
  situacaoDaEntrega,
  temRevisor,
  TOLERANCIA_DE_ATRASO,
  type FaseArtigo,
  type Visao,
} from "@/lib/artigo";
import { curta, diasAte, longa, quando, registro } from "@/lib/datas";
import type { Fotos } from "@/lib/fotos";
import type { MembroDaLista } from "@/lib/membros";
import type { Producao } from "@/lib/producao-formato";
import { salvarProducao } from "@/app/(app)/producao/actions";
import {
  concluirAjustes,
  conferirArtigo,
  decidirReescrita,
  designarRevisor,
  enviarRascunho,
  marcarPublicado,
  moverArtigo,
  recusarTema,
  registrarParecer,
  registrarTema,
} from "@/app/(app)/producao/fluxo";

/** Ordem das fases, para saber o que já passou. "decisao" fica junto da revisão. */
const ORDEM: Record<FaseArtigo, number> = { tema: 0, redacao: 1, revisao: 2, decisao: 2, ajustes: 3, conferencia: 4, pronto: 5, publicado: 6 };

export type DadosDoFluxo = {
  p: Producao;
  v: Visao;
  fotos: Fotos;
  /** Só para a diretoria: membros ativos, para revisor e autores. */
  membros: MembroDaLista[];
  revisoes: Record<string, number>;
  temasOutros: { rotulo: string; tema: string }[];
  espacoLivre: string | null;
  semDiretorAcademico: boolean;
};

export function FluxoDoArtigo({ p, v, fotos, membros, revisoes, temasOutros, espacoLivre, semDiretorAcademico }: DadosDoFluxo) {
  const fase = p.fase ?? "tema";
  const ordem = ORDEM[fase];
  const a = p.andamento;
  const atraso = diasDeAtraso(p);
  const revisor = nomeDoRevisor(p);
  const revisorDeFora = Boolean(p.revisor) && !p.participantes.some((x) => x.papel === "revisor");
  const participa = !v.conselho && (v.autor || v.revisor || v.diretoria);

  const prazos = [
    { rotulo: "Tema", data: prazoDoTema(p), feito: Boolean(p.tema) || ordem >= 1 },
    { rotulo: "Rascunho", data: p.entrega, feito: ordem >= 2 },
    { rotulo: "Parecer", data: prazoDoParecer(p), feito: ordem >= 3 || fase === "decisao" },
    { rotulo: "Versão final", data: p.fim_revisao, feito: ordem >= 4 },
    { rotulo: "Publicação", data: p.publicacao, feito: ordem >= 6 },
  ].filter((x): x is { rotulo: string; data: string; feito: boolean } => Boolean(x.data));

  const passos: ReactNode[] = [];

  // ── Dupla ──
  if (v.autor && !v.conselho) {
    if (fase === "tema") {
      passos.push(
        <Passo key="tema" titulo={p.tema ? "Tema registrado" : "Registre o tema"} destaque={!p.tema}>
          {!p.tema && p.tema_recusado ? (
            <div className="aviso aviso-erro mb-4">
              <p>
                A diretoria acadêmica recusou o tema <span className="font-semibold">“{p.tema_recusado}”</span>.
              </p>
              {p.tema_recusa_motivo ? <p className="mt-1 text-tinta">{p.tema_recusa_motivo}</p> : null}
            </div>
          ) : null}
          {p.tema ? (
            <p className="text-[0.9375rem] text-grafite">
              Registrado em {p.tema_registrado_em ? registro(p.tema_registrado_em) : "data não registrada"}. Pode ser trocado até a entrega do rascunho.
            </p>
          ) : (
            <p className="text-[0.9375rem] text-grafite">
              Na primeira semana, dentro do direito societário ou do mercado de capitais. O{" "}
              <Link href="/producao?aba=temas" className="link">
                banco de temas
              </Link>{" "}
              ajuda; a diretoria acadêmica vê o tema assim que é registrado.
            </p>
          )}
          {p.tema ? (
            <Recolhivel titulo="Trocar o tema">
              <Formulario acao={registrarTema}>
                <input type="hidden" name="producao_id" value={p.id} />
                <CampoTema padrao={p.tema} outros={temasOutros} />
                <BotaoEnviar className="self-start">Salvar tema</BotaoEnviar>
              </Formulario>
            </Recolhivel>
          ) : (
            <Formulario acao={registrarTema} className="mt-4 flex flex-col gap-4">
              <input type="hidden" name="producao_id" value={p.id} />
              <CampoTema outros={temasOutros} />
              <BotaoEnviar className="self-start">Registrar tema</BotaoEnviar>
            </Formulario>
          )}
        </Passo>,
      );
    }
    if (fase === "redacao") {
      passos.push(
        <Passo key="rascunho" titulo="Envie o rascunho" destaque>
          <ContagemDoRascunho p={p} atraso={atraso} />
          <Formulario acao={enviarRascunho} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="producao_id" value={p.id} />
            <Campo nome="link" rotulo="Link do Google Docs" tipo="url" obrigatorio placeholder="https://docs.google.com/document/d/..." ajuda="Antes de enviar, abra o compartilhamento e deixe qualquer pessoa com o link como comentarista." />
            <BotaoEnviar className="self-start" enviando="Enviando…">
              Entregar rascunho
            </BotaoEnviar>
          </Formulario>
          <Recolhivel titulo="Trocar o tema">
            <Formulario acao={registrarTema}>
              <input type="hidden" name="producao_id" value={p.id} />
              <CampoTema padrao={p.tema ?? ""} outros={temasOutros} />
              <BotaoEnviar className="self-start">Salvar tema</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </Passo>,
      );
    }
    if (fase === "revisao") {
      passos.push(
        <Passo key="revisao" titulo="Rascunho em revisão">
          <p className="text-[0.9375rem] text-grafite">
            {revisor ? `${revisor} revisa o texto` : "A diretoria acadêmica vai designar o revisor"}
            {prazoDoParecer(p) ? `; o parecer vai até ${longa(prazoDoParecer(p) as string)}` : ""}. Os comentários ficam no próprio Google Docs.
          </p>
          <Recolhivel titulo="Corrigir o link do rascunho">
            <Formulario acao={enviarRascunho}>
              <input type="hidden" name="producao_id" value={p.id} />
              <Campo nome="link" rotulo="Link do Google Docs" tipo="url" obrigatorio padrao={a?.rascunho_link ?? ""} ajuda="A data da entrega continua a mesma." />
              <BotaoEnviar className="self-start">Salvar link</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </Passo>,
      );
    }
    if (fase === "ajustes") {
      passos.push(
        <Passo key="ajustes" titulo="Ajuste o texto" destaque>
          <Parecer p={p} />
          <p className="mt-3 text-[0.9375rem] text-grafite">
            {a?.ajustes_pedidos && a.parecer_conclusao !== "aprovado_com_ajustes" ? "A diretoria acadêmica pediu ajustes. " : ""}
            Faça as mudanças no mesmo documento{p.fim_revisao ? ` até ${longa(p.fim_revisao)}` : ""} e avise aqui quando terminar.
          </p>
          <Formulario acao={concluirAjustes} confirmar="Confirmar que os ajustes estão feitos no documento?" className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="producao_id" value={p.id} />
            <BotaoEnviar className="self-start">Ajustes concluídos</BotaoEnviar>
          </Formulario>
        </Passo>,
      );
    }
    if (fase === "decisao") passos.push(<Passo key="decisao" titulo="Aguardando a diretoria acadêmica"><Parecer p={p} /><p className="mt-3 text-[0.9375rem] text-grafite">O parecer pediu para reescrever. O diretor acadêmico vai decidir se o texto segue com ajustes nesta semana ou se volta para a redação com novo prazo.</p></Passo>);
    if (fase === "conferencia") passos.push(<Passo key="conf" titulo="Conferência final"><p className="text-[0.9375rem] text-grafite">O diretor acadêmico confere o texto ajustado antes de liberar a publicação.</p></Passo>);
    if (fase === "pronto") passos.push(<Passo key="pronto" titulo="Liberado para publicar"><p className="text-[0.9375rem] text-grafite">{p.publicacao ? `Sai no LinkedIn na ${longa(p.publicacao)}.` : "Guardado como reserva, até a diretoria marcar a data."}</p></Passo>);
  }

  // ── Revisor da lista ──
  if (v.revisor && !v.autor) {
    if (fase === "tema" || fase === "redacao") {
      passos.push(
        <Passo key="rev-espera" titulo="Você vai revisar este artigo">
          <p className="text-[0.9375rem] text-grafite">
            O rascunho chega {p.entrega ? `até ${longa(p.entrega)}` : "quando a dupla entregar"}
            {prazoDoParecer(p) ? `, e o parecer vai até ${longa(prazoDoParecer(p) as string)}` : ""}. O link aparece aqui assim que for enviado.
          </p>
        </Passo>,
      );
    }
    if (fase === "revisao") passos.push(<FormularioDeParecer key="parecer" p={p} titulo="Dê o seu parecer" />);
  }

  // ── Diretor acadêmico ──
  if (v.academico) {
    if (fase === "tema" || fase === "redacao" || fase === "revisao") {
      const candidatos = membros.filter((m) => m.ativo && m.papel !== "conselheiro" && !p.participantes.some((x) => x.id === m.id && x.papel === "autor"));
      const atualMembro = p.participantes.find((x) => x.papel === "revisor")?.id;
      passos.push(
        <Passo key="designar" titulo={revisor ? "Revisor" : "Designe o revisor"} destaque={!revisor && (fase === "revisao" || (p.entrega ? diasAte(p.entrega) <= 3 : false))}>
          <p className="text-[0.9375rem] text-grafite">
            {revisor
              ? `Revisão com ${revisor}${revisorDeFora ? ", de fora da lista: envie a ele o link do rascunho e registre o parecer aqui" : ""}.`
              : `A semana de revisão não começa sem revisor: designe até a entrega${p.entrega ? `, ${longa(p.entrega)}` : ""}. Os autores não aparecem na lista.`}
          </p>
          <Formulario acao={designarRevisor} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="hidden" name="producao_id" value={p.id} />
            <Escolha
              nome="revisor"
              rotulo="Quem revisa"
              padrao={atualMembro ?? (revisorDeFora ? "externo" : "")}
              ajuda="Entre parênteses, quantas revisões a pessoa já fez no ciclo."
              opcoes={[
                { valor: "", rotulo: "Escolha…" },
                ...candidatos.map((m) => ({ valor: m.id, rotulo: `${m.nome} (${revisoes[m.id] ?? 0})` })),
                { valor: "externo", rotulo: "Alguém de fora da lista" },
              ]}
            />
            <Campo nome="revisor_externo" rotulo="Nome, se for de fora" padrao={revisorDeFora ? (p.revisor ?? "") : ""} maxLength={200} placeholder="Professor, egresso ou pós-graduando" />
            <BotaoEnviar variante={revisor ? "secundario" : "principal"} className="justify-self-start">
              {revisor ? "Trocar revisor" : "Designar"}
            </BotaoEnviar>
          </Formulario>
        </Passo>,
      );
    }
    if (fase === "redacao" && p.tema) {
      passos.push(
        <Passo key="conferir-tema" titulo="Tema da dupla">
          <p className="text-[0.9375rem] text-grafite">
            Registrado {p.tema_registrado_em ? `em ${registro(p.tema_registrado_em)}` : "antes do fluxo no site"}. Se repetir outro artigo ou fugir do recorte da liga, recuse com o motivo; a dupla registra outro.
          </p>
          <Recolhivel titulo="Recusar o tema">
            <Formulario acao={recusarTema} confirmar="Recusar o tema? A dupla vai precisar registrar outro.">
              <input type="hidden" name="producao_id" value={p.id} />
              <AreaDeTexto nome="motivo" rotulo="Motivo, para a dupla" obrigatorio linhas={3} maxLength={1000} />
              <BotaoEnviar variante="secundario" className="self-start">
                Recusar tema
              </BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </Passo>,
      );
    }
    if (fase === "revisao" && temRevisor(p) && !v.revisor) {
      passos.push(<FormularioDeParecer key="parecer-dir" p={p} titulo={revisorDeFora ? `Registre o parecer de ${p.revisor}` : "Registrar o parecer pelo revisor"} recolhido={!revisorDeFora} />);
    }
    if (fase === "decisao") {
      passos.push(
        <Passo key="decidir" titulo="Decida o próximo passo" destaque>
          <Parecer p={p} />
          <Formulario acao={decidirReescrita} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <input type="hidden" name="producao_id" value={p.id} />
            <Escolha
              nome="decisao"
              rotulo="Decisão"
              className="sm:col-span-2"
              opcoes={[
                { valor: "ajustar", rotulo: "Seguir para ajustes nesta semana" },
                { valor: "nova_redacao", rotulo: "Reescrever, com novo prazo" },
              ]}
            />
            <Campo nome="nova_entrega" tipo="date" rotulo="Novo prazo do rascunho" ajuda="Só se for reescrever." />
            <Campo nome="nova_publicacao" tipo="date" rotulo="Nova data de publicação" ajuda="Só se a data mudar." />
            <BotaoEnviar className="justify-self-start">Registrar decisão</BotaoEnviar>
          </Formulario>
        </Passo>,
      );
    }
    if (fase === "conferencia") {
      passos.push(
        <Passo key="conferir" titulo="Faça a conferência final" destaque>
          <Parecer p={p} />
          {a?.rascunho_link ? <LinkDoDocumento href={a.rascunho_link} rotulo="Abrir o texto ajustado" /> : null}
          <Formulario acao={conferirArtigo} className="mt-4 flex flex-wrap gap-2">
            <input type="hidden" name="producao_id" value={p.id} />
            <BotaoEnviar nome="decisao" valor="liberar" enviando="Liberando…">
              Liberar para publicar
            </BotaoEnviar>
            <BotaoEnviar nome="decisao" valor="devolver" variante="secundario" enviando="Devolvendo…">
              Devolver para ajustes
            </BotaoEnviar>
          </Formulario>
        </Passo>,
      );
    }
  }

  // ── Diretoria ──
  if (v.diretoria) {
    if (semDiretorAcademico && fase !== "publicado") {
      passos.push(
        <div key="sem-academico" className="aviso aviso-erro">
          Ninguém está marcado como diretor acadêmico, e só ele designa o revisor e libera a publicação. Marque em{" "}
          <Link href="/gestao" className="link">
            Gestão, Membros
          </Link>
          .
        </div>,
      );
    }
    if (atraso > TOLERANCIA_DE_ATRASO && p.publicacao) {
      passos.push(
        <Passo key="vaga" titulo="Este artigo perdeu a vaga" destaque>
          <p className="text-[0.9375rem] text-grafite">
            O rascunho está com {atraso} dias de atraso. Pelas regras da liga, o artigo vai para o próximo espaço livre
            {espacoLivre ? `: ${longa(espacoLivre)}` : ""}. Confirme a data ou escolha outra; se houver motivo para segurar, deixe como está.
          </p>
          <FormularioDeData p={p} padrao={espacoLivre} botao="Confirmar nova data" />
        </Passo>,
      );
    }
    if (fase === "pronto") {
      passos.push(
        <Passo key="publicar" titulo="Publique no LinkedIn" destaque={p.publicacao ? diasAte(p.publicacao) <= 0 : false}>
          <p className="text-[0.9375rem] text-grafite">
            Liberado pela diretoria acadêmica{a?.liberado_em ? ` em ${registro(a.liberado_em)}` : ""}. {p.publicacao ? `Publicação: ${longa(p.publicacao)}, às 10h.` : "Artigo de reserva: marque a data abaixo quando for usá-lo."}
          </p>
          {a?.rascunho_link ? <LinkDoDocumento href={a.rascunho_link} rotulo="Abrir a versão final" /> : null}
          <Formulario acao={marcarPublicado} className="mt-4 flex flex-col gap-4">
            <input type="hidden" name="producao_id" value={p.id} />
            <Campo nome="link_publicado" rotulo="Link da publicação" tipo="url" obrigatorio placeholder="https://www.linkedin.com/posts/..." />
            <BotaoEnviar className="self-start">Marcar como publicado</BotaoEnviar>
          </Formulario>
        </Passo>,
      );
    }
  }

  // ── Conselho e diretoria acompanham ──
  if ((v.conselho || (v.diretoria && !v.academico)) && passos.length === 0 && fase !== "publicado") {
    passos.push(
      <Passo key="acompanhar" titulo="Em andamento">
        <p className="text-[0.9375rem] text-grafite">{textoDaFase(fase, revisor)}</p>
      </Passo>,
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="etapas-titulo">
        <h2 id="etapas-titulo" className="sr-only">
          Etapas
        </h2>
        <LinhaDoTempo fase={fase} />
        {prazos.length > 0 ? (
          // No celular, uma lista compacta; a partir do tablet, uma linha de colunas.
          <ol className="cartao mt-5 divide-y divide-linha sm:grid sm:grid-cols-5 sm:divide-x sm:divide-y-0">
            {prazos.map((x) => {
              // Só o próximo prazo em aberto aparece como vencido; os seguintes dependem dele.
              const proximo = x === prazos.find((y) => !y.feito);
              const venceu = proximo && diasAte(x.data) < 0;
              return (
                <li key={x.rotulo} className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:block sm:px-3.5 sm:py-3">
                  <p className="text-sm text-grafite sm:text-xs sm:font-medium">{x.rotulo}</p>
                  <p className="flex items-baseline gap-2 sm:mt-1 sm:flex-col sm:gap-0">
                    <span className={`numeral font-bold sm:text-lg ${x.feito ? "text-grafite" : "text-tinta"}`}>{curta(x.data)}</span>
                    <span className={`text-xs ${venceu ? "font-semibold text-vinho-escuro" : "text-grafite"}`}>
                      {x.feito ? "concluído" : venceu ? `venceu ${quando(x.data)}` : quando(x.data)}
                    </span>
                  </p>
                </li>
              );
            })}
          </ol>
        ) : null}
        {!p.publicacao ? <p className="mt-3 text-sm text-grafite">Artigo de reserva: passa pelo fluxo sem data marcada e cobre uma vaga perdida.</p> : null}
      </section>

      {passos.length > 0 ? (
        <section aria-labelledby="passo-titulo" className="flex flex-col gap-3">
          <h2 id="passo-titulo" className="h3">
            {participa ? "O que fazer agora" : "Situação"}
          </h2>
          {passos}
        </section>
      ) : null}

      <section aria-labelledby="quem-titulo">
        <h2 id="quem-titulo" className="h3 mb-3">
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
          {p.participantes.filter((x) => x.papel === "autor").length === 0 ? <li className="text-grafite">{p.autores ?? "Autores a definir"}</li> : null}
          {revisorDeFora ? (
            <li className="flex min-h-9 items-center rounded-full bg-superficie px-3.5 text-sm text-tinta ring-1 ring-linha">
              {p.revisor}
              <span className="text-grafite">&nbsp;· revisão, de fora da lista</span>
            </li>
          ) : null}
          {!temRevisor(p) ? <li className="flex min-h-9 items-center px-1 text-sm text-grafite">Revisor a designar</li> : null}
        </ul>
      </section>

      {a ? <Registro p={p} /> : null}

      {v.diretoria ? <FerramentasDaDiretoria p={p} membros={membros} espacoLivre={espacoLivre} /> : null}
    </div>
  );
}

function textoDaFase(fase: FaseArtigo, revisor: string | null): string {
  switch (fase) {
    case "tema":
      return "A dupla ainda não registrou o tema.";
    case "redacao":
      return "A dupla está escrevendo o rascunho.";
    case "revisao":
      return revisor ? `Rascunho entregue; ${revisor} está revisando.` : "Rascunho entregue; falta designar o revisor.";
    case "ajustes":
      return "A dupla está ajustando o texto a partir do parecer.";
    case "decisao":
      return "O parecer pediu para reescrever; o diretor acadêmico decide o próximo passo.";
    case "conferencia":
      return "O diretor acadêmico está conferindo o texto ajustado.";
    case "pronto":
      return "Liberado para publicar.";
    default:
      return "Publicado.";
  }
}

function LinhaDoTempo({ fase }: { fase: FaseArtigo }) {
  const atual = indiceDaEtapa(fase);
  const encerrado = fase === "publicado";
  return (
    <ol className="grid grid-cols-3 gap-x-2 gap-y-3 sm:grid-cols-6">
      {ETAPAS.map((e, i) => {
        const feito = i < atual || encerrado;
        const agora = i === atual && !encerrado;
        return (
          <li key={e.id} aria-current={agora ? "step" : undefined}>
            <span aria-hidden="true" className={`block h-1 rounded-full ${feito ? "bg-vinho" : agora ? "bg-vinho/40" : "bg-linha-forte/60"}`} />
            <span className={`mt-1.5 block text-sm ${agora ? "font-semibold text-tinta" : feito ? "text-tinta" : "text-grafite"}`}>
              {e.rotulo}
              <span className="sr-only">{feito ? " (concluída)" : agora ? " (etapa atual)" : ""}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Passo({ titulo, destaque = false, children }: { titulo: string; destaque?: boolean; children: ReactNode }) {
  return (
    <section className={`cartao flex flex-col gap-1 p-4 sm:p-5 ${destaque ? "border-vinho-borda" : ""}`}>
      <h3 className="font-semibold text-tinta">{titulo}</h3>
      <div className="flex flex-col gap-3 [&>details]:mt-1">{children}</div>
    </section>
  );
}

function ContagemDoRascunho({ p, atraso }: { p: Producao; atraso: number }) {
  if (!p.entrega) return <p className="text-[0.9375rem] text-grafite">Sem prazo marcado: artigo de reserva.</p>;
  if (atraso > 0) {
    return (
      <p className="aviso aviso-erro">
        O prazo era {longa(p.entrega)}: {atraso === 1 ? "1 dia" : `${atraso} dias`} de atraso.
        {atraso > TOLERANCIA_DE_ATRASO ? " Com mais de 2 dias, o artigo perde a vaga e a diretoria marca uma nova data. Envie assim que puder." : " Envie o quanto antes: com mais de 2 dias, o artigo perde a vaga."}
      </p>
    );
  }
  const faltam = diasAte(p.entrega);
  return (
    <p className="text-[0.9375rem] text-grafite">
      <span className="numeral text-2xl font-bold text-tinta">{faltam}</span> {faltam === 1 ? "dia" : "dias"} até {longa(p.entrega)}, prazo do rascunho. O documento vai para a diretoria acadêmica e para o revisor.
    </p>
  );
}

function Parecer({ p }: { p: Producao }) {
  const a = p.andamento;
  if (!a?.parecer_conclusao) return null;
  return (
    <div className="rounded-[0.625rem] bg-sutil px-4 py-3">
      <p className="flex flex-wrap items-center gap-2 text-sm text-grafite">
        <span className={`selo ${a.parecer_conclusao === "reescrever" ? "selo-vinho" : "selo-suave"}`}>{ROTULO_CONCLUSAO[a.parecer_conclusao]}</span>
        Parecer de {nomeDoRevisor(p) ?? "revisão"}
        {a.parecer_em ? `, ${registro(a.parecer_em)}` : ""}
      </p>
      {a.parecer_texto ? <p className="mt-2 text-[0.9375rem] whitespace-pre-line text-tinta">{a.parecer_texto}</p> : null}
    </div>
  );
}

function LinkDoDocumento({ href, rotulo }: { href: string; rotulo: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="link inline-flex items-center gap-1 self-start text-[0.9375rem]">
      {rotulo}
      <ArrowUpRight aria-hidden="true" className="size-4" />
    </a>
  );
}

function FormularioDeParecer({ p, titulo, recolhido = false }: { p: Producao; titulo: string; recolhido?: boolean }) {
  const a = p.andamento;
  const prazo = prazoDoParecer(p);
  const formulario = (
    <Formulario acao={registrarParecer} className="flex flex-col gap-4">
      <input type="hidden" name="producao_id" value={p.id} />
      <Escolha
        nome="conclusao"
        rotulo="Conclusão"
        opcoes={[
          { valor: "aprovado_com_ajustes", rotulo: "Aprovado com ajustes" },
          { valor: "aprovado", rotulo: "Aprovado" },
          { valor: "reescrever", rotulo: "Reescrever" },
        ]}
      />
      <AreaDeTexto nome="parecer" rotulo="Parecer curto" obrigatorio linhas={5} maxLength={3000} placeholder="O que está bom, o que ajustar e se as fontes conferem." />
      <BotaoEnviar className="self-start">Registrar parecer</BotaoEnviar>
    </Formulario>
  );
  return (
    <Passo titulo={titulo} destaque={!recolhido}>
      <p className="text-[0.9375rem] text-grafite">
        Comente no próprio Google Docs e registre aqui a conclusão{prazo ? `, até ${longa(prazo)}` : ""}. Critérios: correção jurídica, clareza, estrutura, ABNT e fontes, originalidade e pertinência ao público da liga.
      </p>
      {a?.rascunho_link ? <LinkDoDocumento href={a.rascunho_link} rotulo="Abrir o rascunho" /> : null}
      {recolhido ? <Recolhivel titulo="Registrar o parecer">{formulario}</Recolhivel> : <div className="mt-2">{formulario}</div>}
    </Passo>
  );
}

function FormularioDeData({ p, padrao, botao }: { p: Producao; padrao: string | null; botao: string }) {
  return (
    <Formulario acao={moverArtigo} className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="producao_id" value={p.id} />
      <Campo nome="publicacao" tipo="date" rotulo="Segunda-feira de publicação" padrao={padrao ?? ""} ajuda="Os prazos de rascunho e revisão são recalculados a partir dela." />
      <div className="flex flex-col justify-end">
        <Marcar nome="reserva" rotulo="Guardar como reserva, sem data" />
      </div>
      <BotaoEnviar className="justify-self-start">{botao}</BotaoEnviar>
    </Formulario>
  );
}

function Registro({ p }: { p: Producao }) {
  const a = p.andamento;
  if (!a) return null;
  const linhas: { titulo: string; quando: string | null; detalhe?: ReactNode }[] = [];
  if (p.tema_recusado) linhas.push({ titulo: `Tema recusado: “${p.tema_recusado}”`, quando: null, detalhe: p.tema_recusa_motivo });
  if (p.tema) linhas.push({ titulo: "Tema registrado", quando: p.tema_registrado_em, detalhe: p.tema });
  if (a.rascunho_em && a.rascunho_link)
    linhas.push({
      titulo: `Rascunho entregue ${situacaoDaEntrega(p.entrega, a.rascunho_em)}`,
      quando: a.rascunho_em,
      detalhe: <LinkDoDocumento href={a.rascunho_link} rotulo="Abrir o documento" />,
    });
  if (a.parecer_conclusao)
    linhas.push({
      titulo: `Parecer: ${ROTULO_CONCLUSAO[a.parecer_conclusao]}`,
      quando: a.parecer_em,
      detalhe: a.parecer_por && a.parecer_por.nome !== nomeDoRevisor(p) ? `Registrado por ${a.parecer_por.nome}, pelo revisor` : null,
    });
  if (a.ajustes_pedidos) linhas.push({ titulo: "Ajustes pedidos pela diretoria acadêmica", quando: null });
  if (a.ajustes_em) linhas.push({ titulo: "Ajustes concluídos pela dupla", quando: a.ajustes_em });
  if (a.liberado_em) linhas.push({ titulo: "Liberado na conferência final", quando: a.liberado_em, detalhe: a.liberado_por ? `Por ${a.liberado_por.nome}` : null });
  if (p.publicado_em)
    linhas.push({
      titulo: "Publicado no LinkedIn",
      quando: p.publicado_em,
      detalhe: p.link_publicado ? <LinkDoDocumento href={p.link_publicado} rotulo="Ver a publicação" /> : null,
    });
  if (linhas.length === 0) return null;

  return (
    <section aria-labelledby="registro-titulo">
      <h2 id="registro-titulo" className="h3">
        Andamento
      </h2>
      <p className="mt-1 mb-3 text-sm text-grafite">Visível para a dupla, o revisor, a diretoria e o conselho.</p>
      <ol className="cartao divide-y divide-linha">
        {linhas.map((l) => (
          <li key={l.titulo} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="font-medium text-tinta">{l.titulo}</p>
              {l.detalhe ? <div className="mt-0.5 text-[0.9375rem] break-words text-grafite">{l.detalhe}</div> : null}
            </div>
            {l.quando ? <p className="numeral shrink-0 text-sm text-grafite">{registro(l.quando)}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function FerramentasDaDiretoria({ p, membros, espacoLivre }: { p: Producao; membros: MembroDaLista[]; espacoLivre: string | null }) {
  const autores = membros.filter((m) => m.ativo && m.papel !== "conselheiro");
  return (
    <section aria-labelledby="diretoria-titulo" className="flex flex-col gap-2.5">
      <h2 id="diretoria-titulo" className="h3">
        Diretoria
      </h2>
      {p.fase !== "publicado" ? (
        <Recolhivel titulo={p.publicacao ? "Mudar a data ou guardar como reserva" : "Marcar a data de publicação"}>
          <FormularioDeData p={p} padrao={p.publicacao ?? espacoLivre} botao="Salvar data" />
        </Recolhivel>
      ) : null}
      <Recolhivel titulo="Corrigir dados do artigo">
        <Formulario acao={salvarProducao} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input type="hidden" name="producao_id" value={p.id} />
          <input type="hidden" name="status" value={p.status} />
          <Campo nome="tema" rotulo="Tema" padrao={p.tema ?? ""} maxLength={300} className="sm:col-span-2" />
          <Campo nome="entrega" rotulo="Prazo do rascunho" tipo="date" padrao={p.entrega ?? ""} />
          <Campo nome="fim_revisao" rotulo="Fim da revisão" tipo="date" padrao={p.fim_revisao ?? ""} />
          <Campo nome="publicacao" rotulo="Publicação" tipo="date" padrao={p.publicacao ?? ""} ajuda="Vazio: artigo de reserva." />
          <Campo nome="link_publicado" rotulo="Link da publicação" tipo="url" padrao={p.link_publicado ?? ""} />
          <fieldset className="sm:col-span-2">
            <legend className="rotulo-campo">Autoria</legend>
            <p className="mb-2 text-sm text-grafite">Quem está marcado vê o artigo como seu, registra o tema e envia o rascunho. O revisor é designado pelo diretor acadêmico.</p>
            <div className="grid grid-cols-1 max-h-64 gap-x-4 overflow-y-auto rounded-[0.625rem] border border-linha-forte bg-superficie px-3 py-1 sm:grid-cols-2">
              {autores.map((m) => (
                <label key={m.id} className="flex min-h-10 cursor-pointer items-center gap-2.5 text-sm text-tinta">
                  <input type="checkbox" name="autor_ids" value={m.id} defaultChecked={p.participantes.some((x) => x.id === m.id && x.papel === "autor")} className="size-4 shrink-0 accent-vinho" />
                  <span className="min-w-0 truncate">{m.nome}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <AreaDeTexto nome="observacoes" rotulo="Observações internas" padrao={p.observacoes ?? ""} linhas={2} className="sm:col-span-2" />
          <BotaoEnviar variante="secundario" className="justify-self-start">
            Salvar
          </BotaoEnviar>
        </Formulario>
      </Recolhivel>
    </section>
  );
}
