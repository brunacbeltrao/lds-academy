import Link from "next/link";
import { CartaoOportunidade } from "@/components/cartao-oportunidade";
import { Abas, CabecalhoDaPagina, Grade, Pagina, Recolhivel, Vazio, type Aba } from "@/components/ui";
import { ROTULO_TIPO, type Oportunidade, type TipoOportunidade } from "@/lib/oportunidades-formato";
import { FormularioDaOportunidade } from "./formulario";

/** Mural de oportunidades: abertas e encerradas, com filtro por tipo. A diretoria publica. */
export function ConteudoDoMural({
  oportunidades,
  aba,
  tipo,
  diretoria,
}: {
  oportunidades: Oportunidade[];
  aba: "abertas" | "encerradas";
  tipo: TipoOportunidade | null;
  diretoria: boolean;
}) {
  const abertas = oportunidades.filter((o) => o.aberta);
  const encerradas = oportunidades.filter((o) => !o.aberta);
  const daAba = aba === "abertas" ? abertas : encerradas;
  const tiposPresentes = (Object.keys(ROTULO_TIPO) as TipoOportunidade[]).filter((t) => daAba.some((o) => o.tipo === t));
  const lista = tipo ? daAba.filter((o) => o.tipo === tipo) : daAba;
  const abas: Aba[] = [
    { id: "abertas", rotulo: "Abertas", contagem: abertas.length },
    { id: "encerradas", rotulo: "Encerradas", contagem: encerradas.length },
  ];
  const base = aba === "abertas" ? "/oportunidades" : "/oportunidades?aba=encerradas";
  const comTipo = (t: TipoOportunidade) => `/oportunidades?${new URLSearchParams({ ...(aba === "encerradas" ? { aba } : {}), tipo: t })}`;

  return (
    <Pagina larga>
      <CabecalhoDaPagina
        titulo="Oportunidades"
        descricao="Vagas de estágio, cursos, eventos, concursos e conteúdos que chegam à liga, num só lugar e com os prazos à vista."
      />

      {diretoria ? (
        <div className="mb-7">
          <Recolhivel titulo="Publicar oportunidade">
            <FormularioDaOportunidade />
          </Recolhivel>
        </div>
      ) : null}

      <Abas base="/oportunidades" atual={aba} itens={abas} />

      {tiposPresentes.length > 1 ? (
        <nav aria-label="Filtrar por tipo" className="-mt-2 mb-6 flex gap-1.5 overflow-x-auto pb-1">
          <Link
            href={base}
            scroll={false}
            aria-current={!tipo ? "true" : undefined}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-medium ${
              !tipo ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
            }`}
          >
            Todas
          </Link>
          {tiposPresentes.map((t) => (
            <Link
              key={t}
              href={comTipo(t)}
              scroll={false}
              aria-current={tipo === t ? "true" : undefined}
              className={`inline-flex min-h-9 shrink-0 items-center rounded-full px-3.5 text-sm font-medium ${
                tipo === t ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
              }`}
            >
              {ROTULO_TIPO[t]}
            </Link>
          ))}
        </nav>
      ) : null}

      {lista.length === 0 ? (
        aba === "abertas" ? (
          <Vazio
            titulo="Nenhuma oportunidade aberta"
            texto={diretoria ? "Publique vagas, cursos e eventos em “Publicar oportunidade”." : "Quando a diretoria divulgar vagas, cursos ou eventos, eles aparecem aqui."}
          />
        ) : (
          <Vazio titulo="Nada encerrado ainda" texto="Oportunidades com o prazo vencido ficam guardadas aqui." />
        )
      ) : (
        <Grade colunas={3}>
          {lista.map((o) => (
            <CartaoOportunidade key={o.id} oportunidade={o} />
          ))}
        </Grade>
      )}
    </Pagina>
  );
}
