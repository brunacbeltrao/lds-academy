import { Avatar, Cartao, nomeCurto } from "@/components/ui";
import { curta, diasAte, quando, semana } from "@/lib/datas";
import type { Fotos } from "@/lib/fotos";
import { ROTULO_STATUS, type Producao } from "@/lib/producao-formato";

/** Cartão de um carrossel ou mini-artigo no calendário de produção. */

export function CartaoProducao({ producao: p, minha, fotos = {} }: { producao: Producao; minha: boolean; fotos?: Fotos }) {
  const passada = diasAte(p.publicacao) < 0;
  const autores = p.participantes.filter((x) => x.papel === "autor");
  const prazo = p.entrega ?? p.publicacao;
  const ultimaEntrega = p.entregas[0];
  return (
    <Cartao href={`/producao/${p.id}`} destaque={minha && !passada} className={`min-h-52 ${passada && p.status === "publicado" ? "opacity-80" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-vinho">
          {p.tipo === "artigo" ? "Artigo" : "Carrossel"} {String(p.numero ?? "").padStart(2, "0")}
        </p>
        <span className={`selo ${p.status === "publicado" ? "selo-suave" : p.status === "atrasado" ? "selo-vinho" : ""}`}>{ROTULO_STATUS[p.status]}</span>
      </div>
      <p className="numeral mt-3 text-2xl leading-none font-bold tracking-[-0.02em] text-tinta">
        {curta(p.publicacao)} <span className="text-sm font-medium text-grafite">{semana(p.publicacao)}</span>
      </p>
      <h2 className={`mt-2 font-semibold ${p.tema ? "text-tinta" : "text-grafite"}`}>{p.tema ?? "Tema a definir"}</h2>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex -space-x-1.5">
          {autores.map((a) => (
            <Avatar key={a.id} nome={a.nome} foto={fotos[a.id]} tamanho="sm" />
          ))}
        </div>
        <p className="truncate text-sm text-grafite">
          {autores.length ? autores.map((a) => nomeCurto(a.nome)).join(" e ") : (p.autores ?? "Autores a definir")}
        </p>
      </div>
      <p className="mt-auto pt-4 text-sm text-grafite">
        {ultimaEntrega
          ? `Última entrega: ${ultimaEntrega.etapa === "rascunho" ? "rascunho" : ultimaEntrega.etapa === "final" ? "versão final" : "parecer"}, ${curta(ultimaEntrega.criado_em)}`
          : passada
            ? "Sem entregas registradas"
            : `${p.tipo === "artigo" ? "Rascunho" : "Entrega"} até ${curta(prazo)} (${quando(prazo)})`}
      </p>
    </Cartao>
  );
}
