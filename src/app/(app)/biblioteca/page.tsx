import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Search, Star, Trash2 } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { Abas, abaAtual, CabecalhoDaPagina, Grade, nomeCurto, Pagina, Recolhivel, Vazio, type Aba } from "@/components/ui";
import { getBiblioteca, ROTULO_TIPO, type TipoItem } from "@/lib/biblioteca";
import { curta } from "@/lib/datas";
import { getMembroAtual } from "@/lib/membro";
import { getProducoes } from "@/lib/producao";
import { adicionarItem, alternarFavorito, removerItem } from "./actions";

export const metadata: Metadata = { title: "Biblioteca" };

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default async function BibliotecaPage({ searchParams }: PageProps<"/biblioteca">) {
  const [params, membro, producoes] = await Promise.all([searchParams, getMembroAtual(), getProducoes()]);
  const itens = await getBiblioteca(membro.id);
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const tipo = typeof params.tipo === "string" && params.tipo in ROTULO_TIPO ? (params.tipo as TipoItem) : null;

  const abas: Aba[] = [
    { id: "todos", rotulo: "Acervo", contagem: itens.length },
    { id: "favoritos", rotulo: "Meus favoritos", contagem: itens.filter((i) => i.favorito).length },
  ];
  const ativa = abaAtual(params.aba, abas);

  const termo = semAcento(q);
  const filtrados = itens.filter(
    (i) =>
      (ativa === "todos" || i.favorito) &&
      (!tipo || i.tipo === tipo) &&
      (!termo || semAcento(`${i.titulo} ${i.autor ?? ""} ${i.tema ?? ""} ${i.descricao ?? ""}`).includes(termo)),
  );
  // Mini-artigos publicados pela liga (fluxo da Produção), com o link do LinkedIn.
  const artigosDaLiga = producoes.filter(
    (p) =>
      p.tipo === "artigo" &&
      p.fase === "publicado" &&
      p.link_publicado &&
      ativa === "todos" &&
      (!tipo || tipo === "artigo") &&
      (!termo || semAcento(`${p.tema ?? ""} ${p.participantes.map((x) => x.nome).join(" ")}`).includes(termo)),
  );
  const tiposPresentes = (Object.keys(ROTULO_TIPO) as TipoItem[]).filter((t) => itens.some((i) => i.tipo === t) || (t === "artigo" && producoes.some((p) => p.fase === "publicado")));
  const diretoria = membro.papel === "diretoria";
  const extra = (t: TipoItem | null) => ({ ...(ativa !== "todos" ? { aba: ativa } : {}), ...(q ? { q } : {}), ...(t ? { tipo: t } : {}) });

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Biblioteca"
        descricao="Doutrina, legislação e materiais da liga. Os livros abrem no Drive; as leis, no site do Planalto."
      />
      <Abas base="/biblioteca" atual={ativa} itens={abas} extra={{ ...(q ? { q } : {}), ...(tipo ? { tipo } : {}) }} />

      <form action="/biblioteca" className="mb-4 flex gap-2">
        {ativa !== "todos" ? <input type="hidden" name="aba" value={ativa} /> : null}
        {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
        <label htmlFor="q" className="sr-only">
          Buscar na biblioteca
        </label>
        <div className="relative flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-grafite" />
          <input id="q" name="q" type="search" defaultValue={q} placeholder="Título, autor ou tema" className="campo pl-10" />
        </div>
        <button type="submit" className="botao botao-secundario">
          Buscar
        </button>
      </form>

      <nav aria-label="Filtrar por tipo" className="mb-6 flex flex-wrap gap-1.5">
        {[null, ...tiposPresentes].map((t) => {
          const ativo = t === tipo;
          const params = new URLSearchParams(extra(t));
          return (
            <Link
              key={t ?? "todos"}
              href={params.size ? `/biblioteca?${params}` : "/biblioteca"}
              aria-current={ativo ? "true" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                ativo ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
              }`}
            >
              {t ? ROTULO_TIPO[t] : "Todos os tipos"}
            </Link>
          );
        })}
      </nav>

      {artigosDaLiga.length > 0 ? (
        <section aria-labelledby="artigos-da-liga" className="mb-8">
          <h2 id="artigos-da-liga" className="h3 mb-3">
            Artigos produzidos pela liga
          </h2>
          <Grade>
            {artigosDaLiga.map((p) => (
              <article key={p.id} className="cartao flex flex-col p-4 sm:p-5">
                <span className="selo self-start">Artigo da liga</span>
                <h3 className="h3 mt-2 break-words">{p.tema}</h3>
                <p className="mt-0.5 text-[0.9375rem] text-tinta">
                  {p.participantes
                    .filter((x) => x.papel === "autor")
                    .map((x) => nomeCurto(x.nome))
                    .join(" e ") || p.autores}
                </p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                  <span className="text-sm text-grafite">{p.publicado_em ? `LinkedIn, ${curta(p.publicado_em)}` : "LinkedIn"}</span>
                  <a href={p.link_publicado as string} target="_blank" rel="noopener noreferrer" className="group inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-vinho">
                    Abrir
                    <ArrowUpRight aria-hidden="true" className="seta size-4" />
                  </a>
                </div>
              </article>
            ))}
          </Grade>
        </section>
      ) : null}

      {filtrados.length === 0 && artigosDaLiga.length > 0 ? null : filtrados.length === 0 ? (
        <Vazio
          titulo={ativa === "favoritos" && !q && !tipo ? "Nenhum favorito ainda" : "Nada encontrado"}
          texto={ativa === "favoritos" && !q && !tipo ? "Toque na estrela de um item para guardá-lo aqui." : "Tente outro termo ou limpe os filtros."}
        />
      ) : (
        <Grade>
          {filtrados.map((i) => (
            <article key={i.id} className="cartao flex flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="selo">{ROTULO_TIPO[i.tipo]}</span>
                <div className="-mt-1.5 -mr-2 flex">
                  {membro.papel !== "conselheiro" ? (
                    <AcaoRapida acao={alternarFavorito}>
                      <input type="hidden" name="id" value={i.id} />
                      <input type="hidden" name="favorito" value={i.favorito ? "sim" : "nao"} />
                      <button
                        type="submit"
                        aria-label={i.favorito ? `Tirar ${i.titulo} dos favoritos` : `Salvar ${i.titulo} nos favoritos`}
                        aria-pressed={i.favorito}
                        className="flex size-9 items-center justify-center rounded-lg text-grafite transition-colors hover:bg-sutil hover:text-vinho"
                      >
                        <Star aria-hidden="true" className={`size-[1.125rem] ${i.favorito ? "fill-vinho text-vinho" : ""}`} strokeWidth={1.75} />
                      </button>
                    </AcaoRapida>
                  ) : null}
                  {diretoria ? (
                    <AcaoRapida acao={removerItem} confirmar={`Remover "${i.titulo}" da biblioteca?`}>
                      <input type="hidden" name="id" value={i.id} />
                      <button type="submit" aria-label={`Remover ${i.titulo}`} className="flex size-9 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
                        <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
                      </button>
                    </AcaoRapida>
                  ) : null}
                </div>
              </div>
              <h2 className="h3 mt-2">{i.titulo}</h2>
              {i.autor ? <p className="mt-0.5 text-[0.9375rem] font-medium text-tinta">{i.autor}</p> : null}
              {i.descricao ? <p className="mt-1.5 line-clamp-3 text-[0.9375rem] text-grafite">{i.descricao}</p> : null}
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <span className="truncate text-sm text-grafite">{i.tema}</span>
                <a href={i.url} target="_blank" rel="noopener noreferrer" className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-vinho">
                  Abrir
                  <ArrowUpRight aria-hidden="true" className="seta size-4" />
                </a>
              </div>
            </article>
          ))}
        </Grade>
      )}

      {diretoria ? (
        <div className="mt-8">
          <Recolhivel titulo="Adicionar à biblioteca">
            <Formulario acao={adicionarItem} resetar className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo nome="titulo" rotulo="Título" obrigatorio maxLength={300} className="sm:col-span-2" />
              <Campo nome="url" rotulo="Link" tipo="url" obrigatorio placeholder="https://drive.google.com/..." className="sm:col-span-2" ajuda="Link do Drive (com acesso para os membros) ou de fonte oficial." />
              <Campo nome="autor" rotulo="Autor" maxLength={200} />
              <Escolha nome="tipo" rotulo="Tipo" opcoes={(Object.keys(ROTULO_TIPO) as TipoItem[]).map((t) => ({ valor: t, rotulo: ROTULO_TIPO[t] }))} />
              <Campo nome="tema" rotulo="Tema" maxLength={100} placeholder="Ex.: Sociedades Anônimas" />
              <AreaDeTexto nome="descricao" rotulo="Descrição" linhas={2} className="sm:col-span-2" />
              <BotaoEnviar className="justify-self-start">Adicionar</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </div>
      ) : null}
    </Pagina>
  );
}
