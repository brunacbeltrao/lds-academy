import type { Metadata } from "next";
import Link from "next/link";
import { CartaoProducao } from "@/components/cartao-producao";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, Lista, Pagina, Recolhivel, Vazio, type Aba } from "@/components/ui";
import { curta, hoje, quando } from "@/lib/datas";
import { getFotos } from "@/lib/fotos";
import { getMembroAtual } from "@/lib/membro";
import { getProducoes } from "@/lib/producao";
import type { Producao } from "@/lib/producao-formato";
import { BANCO_DE_TEMAS, ORIENTACOES_ARTIGO, ORIENTACOES_CARROSSEL, TIPOS_DE_POST } from "@/lib/producao-orientacoes";

export const metadata: Metadata = { title: "Produção" };

export default async function ProducaoPage({ searchParams }: PageProps<"/producao">) {
  const [params, membro, producoes, fotos] = await Promise.all([searchParams, getMembroAtual(), getProducoes(), getFotos()]);
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
  const minhasPendentes = producoes.filter((p) => doMembro(p) && p.status !== "publicado" && p.publicacao >= hoje());

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Produção"
        descricao="O calendário de carrosséis do Instagram e mini-artigos do LinkedIn: quem escreve, prazos e entregas."
      />

      {minhasPendentes.length > 0 ? (
        <div className="mb-7 flex flex-col gap-3 rounded-[0.875rem] border border-vinho-borda bg-vinho-suave p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="font-semibold text-tinta">
              Você tem {minhasPendentes.length} {minhasPendentes.length === 1 ? "publicação" : "publicações"} pela frente
            </p>
            <p className="text-[0.9375rem] text-grafite">
              A próxima: {minhasPendentes[0].tipo === "artigo" ? "artigo" : "carrossel"} {String(minhasPendentes[0].numero ?? "").padStart(2, "0")}, publicação{" "}
              {quando(minhasPendentes[0].publicacao)} ({curta(minhasPendentes[0].publicacao)}).
            </p>
          </div>
          <Link href={`/producao/${minhasPendentes[0].id}`} className="botao shrink-0 self-start sm:self-auto">
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
              className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                minhas ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
              }`}
            >
              Só as minhas
            </Link>
          </div>
          {lista.length === 0 ? (
            <Vazio titulo={minhas ? "Você não está em nenhuma publicação desta lista" : "Nenhuma publicação cadastrada"} />
          ) : (
            <Grade>
              {lista.map((p) => (
                <CartaoProducao key={p.id} producao={p} minha={doMembro(p)} fotos={fotos} />
              ))}
            </Grade>
          )}
        </>
      ) : null}

      {ativa === "orientacoes" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <section className="cartao p-5 sm:p-6">
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
          <p className="prosa mb-5 text-grafite">Sugestões livres: a dupla escolhe o tema e comunica à diretoria acadêmica no início do ciclo, para evitar repetição.</p>
          <Grade>
            {BANCO_DE_TEMAS.map(([tema, area, angulo]) => (
              <div key={tema} className="cartao p-4 sm:p-5">
                <span className="selo">{area}</span>
                <h2 className="h3 mt-2">{tema}</h2>
                <p className="mt-1 text-[0.9375rem] text-grafite">{angulo}</p>
              </div>
            ))}
          </Grade>
        </>
      ) : null}
    </Pagina>
  );
}
