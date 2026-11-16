import { LinhaDoTempo, type Momento } from "@/components/linha-do-tempo";
import { Atalhos, CabecalhoDaPagina, Lista, Pagina, Recolhivel, Secao } from "@/components/ui";
import { ehAutor, formatarData, ROTULO_STATUS, type Producao } from "@/lib/producao-formato";
import { BANCO_DE_TEMAS, ORIENTACOES_ARTIGO, ORIENTACOES_CARROSSEL, TIPOS_DE_POST } from "@/lib/producao-orientacoes";

const nomeDoMes = (data: string) =>
  new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC", month: "long" }).format(new Date(`${data}T12:00:00Z`));

function Calendario({ itens, nome, hoje, artigo }: { itens: Producao[]; nome: string; hoje: string; artigo: boolean }) {
  const ano = hoje.slice(0, 4);
  const proximaId = itens.find((p) => p.publicacao >= hoje)?.id ?? null;
  if (itens.length === 0) return <p className="cartao p-5 text-grafite">Nenhuma publicação cadastrada.</p>;

  return (
    <LinhaDoTempo
      itens={itens.map((p) => {
        const momento: Momento = p.id === proximaId ? "proximo" : p.publicacao < hoje ? "passado" : "futuro";
        const minha = ehAutor(p.autores, nome);
        const outroAno = p.publicacao.slice(0, 4) !== ano;
        return {
          id: p.id,
          dia: p.publicacao.slice(8, 10),
          apoio: outroAno ? p.publicacao.slice(0, 4) : artigo ? "segunda" : "terça",
          grupo: outroAno ? `${nomeDoMes(p.publicacao)} de ${p.publicacao.slice(0, 4)}` : nomeDoMes(p.publicacao),
          momento,
          conteudo: (
            <>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="selo">
                  {artigo ? "Artigo" : "Post"} {String(p.numero ?? "").padStart(2, "0")}
                </span>
                {momento === "proximo" ? <span className="selo selo-vinho">Próxima</span> : null}
                {minha ? <span className="selo selo-suave">Sua autoria</span> : null}
                {p.status !== "a_definir" ? <span className="selo">{ROTULO_STATUS[p.status]}</span> : null}
              </div>
              <h4 className={`mt-2 ${p.tema ? `h3 ${momento === "passado" ? "text-grafite" : ""}` : "text-[1.0625rem] text-grafite"}`}>
                {p.tema ?? "Tema a definir"}
              </h4>
              <p className={`mt-0.5 text-[0.9375rem] ${momento === "passado" ? "text-grafite" : "text-tinta"}`}>{p.autores ?? "Autores a definir"}</p>
              <p className="mt-1.5 text-sm text-grafite">
                {artigo ? (
                  <>
                    Rascunho até {formatarData(p.entrega, ano)} · revisão até {formatarData(p.fim_revisao, ano)} ·{" "}
                    {p.revisor ? `revisão de ${p.revisor}` : "revisor a definir"}
                  </>
                ) : (
                  <>Entrega até segunda, {formatarData(p.entrega, ano)}, às 18h</>
                )}
              </p>
            </>
          ),
        };
      })}
    />
  );
}

export function ConteudoDaProducao({ producoes, nome, hoje }: { producoes: Producao[]; nome: string; hoje: string }) {
  const carrosseis = producoes.filter((p) => p.tipo === "carrossel");
  const artigos = producoes.filter((p) => p.tipo === "artigo");

  return (
    <Pagina>
      <CabecalhoDaPagina titulo="Produção" descricao="O que a liga publica, quem escreve e quando: carrosséis semanais no Instagram e mini-artigos quinzenais no LinkedIn.">
        <Atalhos
          itens={[
            { id: "carrosseis", rotulo: "Carrosséis do Instagram" },
            { id: "mini-artigos", rotulo: "Mini-artigos do LinkedIn" },
          ]}
        />
      </CabecalhoDaPagina>

      <Secao
        id="carrosseis"
        titulo="Carrosséis do Instagram"
        descricao="Posts semanais em dupla, às terças-feiras, acompanhando os temas do ciclo. O objetivo é criar conteúdo de autoridade e dar visibilidade aos membros e à liga."
      >
        <Calendario itens={carrosseis} nome={nome} hoje={hoje} artigo={false} />
        <div className="mt-8 flex flex-col gap-2.5">
          <Recolhivel titulo="Orientações para o carrossel">
            <Lista itens={ORIENTACOES_CARROSSEL} />
          </Recolhivel>
          <Recolhivel titulo="Tipos de post do calendário">
            <dl className="prosa flex flex-col gap-3.5">
              {TIPOS_DE_POST.map(([tipo, descricao]) => (
                <div key={tipo}>
                  <dt className="font-semibold text-tinta">{tipo}</dt>
                  <dd className="text-grafite">{descricao}</dd>
                </div>
              ))}
            </dl>
          </Recolhivel>
        </div>
      </Secao>

      <Secao
        id="mini-artigos"
        titulo="Mini-artigos do LinkedIn"
        descricao="Textos mais aprofundados, em dupla ou trio, com revisão. Cada artigo leva duas semanas de redação e até uma de revisão; como os ciclos se sobrepõem, há uma publicação a cada duas semanas, às segundas-feiras."
      >
        <Calendario itens={artigos} nome={nome} hoje={hoje} artigo />
        <div className="mt-8 flex flex-col gap-2.5">
          {ORIENTACOES_ARTIGO.map((bloco) => (
            <Recolhivel key={bloco.titulo} titulo={bloco.titulo}>
              <Lista itens={bloco.itens} />
            </Recolhivel>
          ))}
          <Recolhivel titulo="Banco de temas sugeridos">
            <p className="prosa mb-4 text-grafite">Sugestões livres: a dupla escolhe o tema e pode usar esta lista como inspiração.</p>
            <ul className="flex flex-col">
              {BANCO_DE_TEMAS.map(([tema, area, angulo]) => (
                <li key={tema} className="border-t border-linha py-3 first:border-t-0 first:pt-0 last:pb-0">
                  <p className="font-medium text-tinta">{tema}</p>
                  <p className="text-sm text-grafite">
                    {area} · {angulo}
                  </p>
                </li>
              ))}
            </ul>
          </Recolhivel>
        </div>
      </Secao>
    </Pagina>
  );
}
