import { Avatar, Cartao, nomeCurto } from "@/components/ui";
import { diasDeAtraso, nomeDoRevisor, seloDoArtigo } from "@/lib/artigo";
import { curta, diasAte, quando, semana } from "@/lib/datas";
import type { Fotos } from "@/lib/fotos";
import { ROTULO_STATUS, type Producao } from "@/lib/producao-formato";

/** Cartão de um carrossel ou mini-artigo no calendário de produção. */

export function CartaoProducao({ producao: p, minha, fotos = {} }: { producao: Producao; minha: boolean; fotos?: Fotos }) {
  const artigo = p.tipo === "artigo";
  const passada = p.publicacao ? diasAte(p.publicacao) < 0 : false;
  const autores = p.participantes.filter((x) => x.papel === "autor");
  const selo = artigo ? seloDoArtigo(p) : { texto: ROTULO_STATUS[p.status], tom: p.status === "publicado" ? "suave" : p.status === "atrasado" ? "forte" : "neutro" };
  const tom = selo.tom === "forte" ? "selo-vinho" : selo.tom === "suave" ? "selo-suave" : "";
  const encerrado = artigo ? p.fase === "publicado" : passada && p.status === "publicado";

  return (
    <Cartao href={`/producao/${p.id}`} destaque={minha && !encerrado} className={`min-h-52 ${encerrado ? "opacity-80" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-vinho">
          {artigo ? "Artigo" : "Carrossel"} {String(p.numero ?? "").padStart(2, "0")}
        </p>
        {selo.texto ? <span className={`selo ${tom}`}>{selo.texto}</span> : null}
      </div>
      <p className="numeral mt-3 text-2xl leading-none font-bold tracking-[-0.02em] text-tinta">
        {p.publicacao ? (
          <>
            {curta(p.publicacao)} <span className="text-sm font-medium text-grafite">{semana(p.publicacao)}</span>
          </>
        ) : (
          <span className="text-lg text-grafite">Reserva</span>
        )}
      </p>
      <h2 className={`mt-2 font-semibold break-words ${p.tema ? "text-tinta" : "text-grafite"}`}>{p.tema ?? "Tema a definir"}</h2>
      <div className="mt-3 flex min-w-0 items-center gap-2">
        <div className="flex shrink-0 -space-x-1.5">
          {autores.map((a) => (
            <Avatar key={a.id} nome={a.nome} foto={fotos[a.id]} tamanho="sm" />
          ))}
        </div>
        <p className="min-w-0 truncate text-sm text-grafite">
          {autores.length ? autores.map((a) => nomeCurto(a.nome)).join(" e ") : (p.autores ?? "Autores a definir")}
        </p>
      </div>
      <p className="mt-auto pt-4 text-sm text-grafite">{artigo ? rodapeDoArtigo(p) : rodapeDoCarrossel(p, passada)}</p>
    </Cartao>
  );
}

function rodapeDoArtigo(p: Producao): string {
  const revisor = nomeDoRevisor(p);
  switch (p.fase) {
    case "tema":
    case "redacao": {
      if (!p.entrega) return "Rascunho sem prazo marcado";
      const atraso = diasDeAtraso(p);
      return atraso > 0 ? `Rascunho venceu em ${curta(p.entrega)}` : `Rascunho até ${curta(p.entrega)} (${quando(p.entrega)})`;
    }
    case "revisao":
      return revisor ? `Revisão de ${nomeCurto(revisor)}` : "Aguardando a designação do revisor";
    case "publicado":
      return revisor ? `Revisão de ${nomeCurto(revisor)}` : "Publicado no LinkedIn";
    default:
      return p.fim_revisao ? `Versão final até ${curta(p.fim_revisao)}` : "Versão final em andamento";
  }
}

function rodapeDoCarrossel(p: Producao, passada: boolean): string {
  const ultimaEntrega = p.entregas[0];
  const prazo = p.entrega ?? p.publicacao;
  if (ultimaEntrega) return `Última entrega: ${ultimaEntrega.etapa === "rascunho" ? "arte" : ultimaEntrega.etapa === "final" ? "versão final" : "parecer"}, ${curta(ultimaEntrega.criado_em)}`;
  if (passada || !prazo) return "Sem entregas registradas";
  return `Entrega até ${curta(prazo)} (${quando(prazo)})`;
}
