import type { Metadata } from "next";
import Link from "next/link";
import { CartaoProducao } from "@/components/cartao-producao";
import { BotaoEnviar, Campo, Formulario, Marcar } from "@/components/formulario";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, Lista, Pagina, Recolhivel, Vazio, type Aba } from "@/components/ui";
import { pendenciasDeArtigos, proximoEspacoLivre, rotuloDoArtigo, temasParecidos, type Pendencia } from "@/lib/artigo";
import { curta, hoje, longa, quando } from "@/lib/datas";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getMembros, type MembroDaLista } from "@/lib/membros";
import { getProducoes } from "@/lib/producao";
import type { Producao } from "@/lib/producao-formato";
import { BANCO_DE_TEMAS, ORIENTACOES_ARTIGO, ORIENTACOES_CARROSSEL, TIPOS_DE_POST } from "@/lib/producao-orientacoes";
import { criarArtigo } from "./fluxo";

export const metadata: Metadata = { title: "Produção" };

export default async function ProducaoPage({ searchParams }: PageProps<"/producao">) {
  const [params, membro, producoes, fotos] = await Promise.all([searchParams, getMembroAtual(), getProducoes(), getFotos()]);
  const diretoria = membro.papel === "diretoria";
  const membros = diretoria ? await getMembros() : [];
  const minhas = params.minhas === "1";
  const doMembro = (p: Producao) => p.participantes.some((x) => x.id === membro.id);
  const carrosseis = producoes.filter((p) => p.tipo === "carrossel");
  const artigos = producoes.filter((p) => p.tipo === "artigo");

  const abas: Aba[] = [
    { id: "carrosseis", rotulo: "Carrosséis", contagem: carrosseis.length },
    { id: "artigos", rotulo: "Mini-artigos", contagem: artigos.length },
    { id: "orientacoes", rotulo: "Orientações" },
    { id: "temas", rotulo: "Banco de temas" },
  ];
  const ativa = abaAtual(params.aba, abas);
  const lista = (ativa === "artigos" ? artigos : carrosseis).filter((p) => !minhas || doMembro(p));
  const comData = lista.filter((p) => p.publicacao);
  const reservas = lista.filter((p) => !p.publicacao);

  const dataDeHoje = hoje();
  const carrosseisPendentes = carrosseis.filter((p) => doMembro(p) && p.status !== "publicado" && (p.publicacao ?? "") >= dataDeHoje);
  const pendencias = pendenciasDeArtigos(artigos, membro);
  const temasUsados = artigos.filter((a) => a.tema).map((a) => ({ rotulo: rotuloDoArtigo(a), tema: a.tema as string }));

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Produção"
        descricao="O calendário de carrosséis do Instagram e mini-artigos do LinkedIn: quem escreve, prazos e entregas."
      />

      {pendencias.length > 0 ? (
        <FilaDePendencias itens={pendencias} titulo={membro.diretorAcademico ? "Fila da diretoria acadêmica e suas pendências" : "Suas pendências nos mini-artigos"} />
      ) : null}

      {carrosseisPendentes.length > 0 && ativa === "carrosseis" ? (
        <div className="mb-7 flex flex-col gap-3 rounded-[0.875rem] border border-vinho-borda bg-vinho-suave p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="font-semibold text-tinta">
              Você tem {carrosseisPendentes.length} {carrosseisPendentes.length === 1 ? "carrossel" : "carrosséis"} pela frente
            </p>
            <p className="text-[0.9375rem] text-grafite">
              O próximo: carrossel {String(carrosseisPendentes[0].numero ?? "").padStart(2, "0")}, publicação {quando(carrosseisPendentes[0].publicacao as string)} (
              {curta(carrosseisPendentes[0].publicacao as string)}).
            </p>
          </div>
          <Link href={`/producao/${carrosseisPendentes[0].id}`} className="botao shrink-0 self-start sm:self-auto">
            Abrir e enviar
          </Link>
        </div>
      ) : null}

      <Abas base="/producao" atual={ativa} itens={abas} />

      {ativa === "carrosseis" || ativa === "artigos" ? (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="prosa text-[0.9375rem] text-grafite">
              {ativa === "artigos"
                ? "Em dupla ou trio, com revisão. Duas semanas de redação e até uma de revisão; uma publicação a cada duas semanas, às segundas."
                : "Em dupla, toda terça-feira. A entrega é até a segunda anterior, às 18h, para a revisão interna."}
            </p>
            <Link
              href={`/producao?${new URLSearchParams({ ...(ativa !== "carrosseis" ? { aba: ativa } : {}), ...(minhas ? {} : { minhas: "1" }) })}`}
              aria-pressed={minhas}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium transition-colors ${
                minhas ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
              }`}
            >
              Só as minhas
            </Link>
          </div>

          {ativa === "artigos" && diretoria ? <NovaVaga membros={membros} sugestao={proximoEspacoLivre(artigos)} /> : null}

          {comData.length === 0 && reservas.length === 0 ? (
            <Vazio titulo={minhas ? "Você não está em nenhuma publicação desta lista" : "Nenhuma publicação cadastrada"} />
          ) : (
            <Grade>
              {comData.map((p) => (
                <CartaoProducao key={p.id} producao={p} minha={doMembro(p)} fotos={fotos} />
              ))}
            </Grade>
          )}

          {reservas.length > 0 ? (
            <section aria-labelledby="reservas-titulo" className="mt-8">
              <h2 id="reservas-titulo" className="h3">
                Reserva
              </h2>
              <p className="mt-1 mb-4 text-[0.9375rem] text-grafite">Artigos sem data marcada, guardados para cobrir uma vaga perdida.</p>
              <Grade>
                {reservas.map((p) => (
                  <CartaoProducao key={p.id} producao={p} minha={doMembro(p)} fotos={fotos} />
                ))}
              </Grade>
            </section>
          ) : null}
        </>
      ) : null}

      {ativa === "orientacoes" ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="cartao p-4 sm:p-6">
            <h2 className="h3 mb-4">Carrosséis do Instagram</h2>
            <Lista itens={ORIENTACOES_CARROSSEL} />
            <h3 className="mt-6 mb-3 text-[0.9375rem] font-semibold text-tinta">Tipos de post</h3>
            <dl className="flex flex-col gap-3">
              {TIPOS_DE_POST.map(([tipo, descricao]) => (
                <div key={tipo}>
                  <dt className="font-semibold text-tinta">{tipo}</dt>
                  <dd className="text-[0.9375rem] text-grafite">{descricao}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="flex flex-col gap-3">
            {ORIENTACOES_ARTIGO.map((bloco, i) => (
              <Recolhivel key={bloco.titulo} titulo={`Mini-artigos: ${bloco.titulo.charAt(0).toLowerCase()}${bloco.titulo.slice(1)}`} abertoInicial={i === 0}>
                <Lista itens={bloco.itens} />
              </Recolhivel>
            ))}
          </div>
        </div>
      ) : null}

      {ativa === "temas" ? (
        <>
          <p className="prosa mb-5 text-grafite">
            Sugestões livres: a dupla escolhe o tema e o registra na página do artigo, na primeira semana. A diretoria acadêmica vê o tema assim que é registrado.
          </p>
          <Grade>
            {BANCO_DE_TEMAS.map(([tema, area, angulo]) => {
              const usado = temasParecidos(tema, temasUsados)[0];
              return (
                <div key={tema} className="cartao p-4 sm:p-5">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="selo">{area}</span>
                    {usado ? <span className="selo selo-suave">Usado no {usado.rotulo.toLowerCase()}</span> : null}
                  </div>
                  <h2 className="h3 mt-2">{tema}</h2>
                  <p className="mt-1 text-[0.9375rem] text-grafite">{angulo}</p>
                </div>
              );
            })}
          </Grade>
        </>
      ) : null}
    </Pagina>
  );
}

function FilaDePendencias({ itens, titulo }: { itens: Pendencia[]; titulo: string }) {
  return (
    <section aria-labelledby="fila-titulo" className="cartao mb-7 p-4 sm:p-5">
      <h2 id="fila-titulo" className="text-[0.9375rem] font-semibold text-tinta">
        {titulo}
      </h2>
      <ul className="mt-2 divide-y divide-linha">
        {itens.map((p, i) => (
          <li key={i}>
            <Link href={p.href} className="group flex items-start gap-3 py-2.5">
              <span aria-hidden="true" className={`mt-2 size-1.5 shrink-0 rounded-full ${p.urgente ? "bg-vinho" : "bg-linha-forte"}`} />
              <span className="min-w-0">
                <span className="block font-medium text-tinta group-hover:text-vinho">{p.texto}</span>
                <span className="block text-sm text-grafite">{p.detalhe}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function NovaVaga({ membros, sugestao }: { membros: MembroDaLista[]; sugestao: string | null }) {
  const candidatos = membros.filter((m) => m.ativo && m.papel !== "conselheiro");
  return (
    <div className="mb-5">
      <Recolhivel titulo="Abrir vaga de artigo">
        <Formulario acao={criarArtigo} resetar className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="rotulo-campo">Quem escreve (dupla ou trio)</legend>
            <div className="grid grid-cols-1 max-h-64 gap-x-4 overflow-y-auto rounded-[0.625rem] border border-linha-forte bg-superficie px-3 py-1 sm:grid-cols-2">
              {candidatos.map((m) => (
                <label key={m.id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-tinta">
                  <input type="checkbox" name="autor_ids" value={m.id} className="size-[1.125rem] shrink-0 accent-vinho" />
                  <span className="min-w-0 truncate">{m.nome}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Campo
            nome="publicacao"
            tipo="date"
            rotulo="Segunda-feira de publicação"
            padrao={sugestao ?? ""}
            ajuda={sugestao ? `Próximo espaço livre: ${longa(sugestao)}. Rascunho 8 dias antes, revisão até a véspera.` : "Rascunho 8 dias antes, revisão até a véspera."}
          />
          <div className="flex flex-col gap-1">
            <Marcar nome="reserva" rotulo="Artigo de reserva, sem data" />
            <Campo nome="entrega" tipo="date" rotulo="Prazo do rascunho, se for reserva" />
          </div>
          <BotaoEnviar className="justify-self-start">Abrir vaga</BotaoEnviar>
        </Formulario>
      </Recolhivel>
    </div>
  );
}
