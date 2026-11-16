import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { AcaoRapida, AreaDeTexto, BotaoEnviar, Campo, Escolha, Formulario } from "@/components/formulario";
import { CabecalhoDaPagina, Pagina, Recolhivel } from "@/components/ui";
import { getEventos, ROTULO_TIPO_EVENTO, type Evento, type TipoEvento } from "@/lib/calendario";
import { dia, hoje, hora, longa, nomeDoMes } from "@/lib/datas";
import { getMembroAtual } from "@/lib/membro";
import { apagarEvento, criarEvento } from "./actions";

export const metadata: Metadata = { title: "Calendário" };

const COR: Record<TipoEvento, string> = {
  aula: "bg-vinho text-white",
  evento: "bg-tinta text-white",
  competicao: "bg-vinho-suave text-vinho ring-1 ring-inset ring-vinho-borda",
  prazo: "bg-sutil text-tinta ring-1 ring-inset ring-linha-forte",
  outro: "bg-sutil text-grafite ring-1 ring-inset ring-linha",
};
const FILTROS: { id: string; rotulo: string }[] = [
  { id: "todos", rotulo: "Tudo" },
  { id: "aula", rotulo: "Aulas" },
  { id: "evento", rotulo: "Eventos" },
  { id: "prazo", rotulo: "Prazos" },
  { id: "competicao", rotulo: "Competições" },
];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  const [params, membro] = await Promise.all([searchParams, getMembroAtual()]);
  const pedido = typeof params.mes === "string" && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : hoje().slice(0, 7);
  const filtro = FILTROS.some((f) => f.id === params.tipo) ? (params.tipo as string) : "todos";
  const [ano, mes] = pedido.split("-").map(Number);

  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const de = `${pedido}-01`;
  const ate = `${pedido}-${String(diasNoMes).padStart(2, "0")}`;
  const todos = await getEventos(de, ate);
  const eventos = filtro === "todos" ? todos : todos.filter((e) => e.tipo === filtro);

  const porDia = new Map<string, Evento[]>();
  for (const e of eventos) {
    const d = dia(e.inicio);
    porDia.set(d, [...(porDia.get(d) ?? []), e]);
  }

  const anterior = new Date(Date.UTC(ano, mes - 2, 1)).toISOString().slice(0, 7);
  const seguinte = new Date(Date.UTC(ano, mes, 1)).toISOString().slice(0, 7);
  const link = (m: string, t = filtro) => `/calendario?${new URLSearchParams({ mes: m, ...(t !== "todos" ? { tipo: t } : {}) })}`;
  const vazios = primeiro.getUTCDay();
  const dataDeHoje = hoje();
  const diretoria = membro.papel === "diretoria";

  return (
    <Pagina larga>
      <CabecalhoDaPagina titulo="Calendário" descricao="Aulas, eventos, competições e prazos da liga." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link href={link(anterior)} aria-label="Mês anterior" className="flex size-10 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta hover:bg-sutil">
            <ChevronLeft aria-hidden="true" className="size-5" />
          </Link>
          <h2 className="min-w-44 text-center text-lg font-bold tracking-[-0.01em] text-tinta first-letter:uppercase">{nomeDoMes(ano, mes)}</h2>
          <Link href={link(seguinte)} aria-label="Próximo mês" className="flex size-10 items-center justify-center rounded-lg border border-linha bg-superficie text-tinta hover:bg-sutil">
            <ChevronRight aria-hidden="true" className="size-5" />
          </Link>
          {pedido !== dataDeHoje.slice(0, 7) ? (
            <Link href={link(dataDeHoje.slice(0, 7))} className="ml-1 text-sm font-medium text-grafite hover:text-vinho">
              Hoje
            </Link>
          ) : null}
        </div>
        <nav aria-label="Filtrar por tipo" className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <Link
              key={f.id}
              href={link(pedido, f.id)}
              aria-current={f.id === filtro ? "true" : undefined}
              className={`inline-flex min-h-9 items-center rounded-full px-3.5 text-sm font-medium transition-colors ${
                f.id === filtro ? "bg-tinta text-white" : "bg-superficie text-tinta ring-1 ring-linha hover:ring-linha-forte"
              }`}
            >
              {f.rotulo}
            </Link>
          ))}
        </nav>
      </div>

      {/* Grade do mês (computador e tablet) */}
      <div className="cartao hidden overflow-hidden md:block">
        <div className="grid grid-cols-7 border-b border-linha bg-sutil">
          {DIAS.map((d) => (
            <p key={d} className="px-3 py-2 text-xs font-semibold text-grafite">
              {d}
            </p>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: vazios }, (_, i) => (
            <div key={`v${i}`} className="min-h-28 border-r border-b border-linha bg-sutil/40" />
          ))}
          {Array.from({ length: diasNoMes }, (_, i) => {
            const d = `${pedido}-${String(i + 1).padStart(2, "0")}`;
            const doDia = porDia.get(d) ?? [];
            const ehHoje = d === dataDeHoje;
            return (
              <div key={d} className={`min-h-28 border-r border-b border-linha p-1.5 [&:nth-child(7n)]:border-r-0 ${ehHoje ? "bg-vinho-suave/50" : ""}`}>
                <p className={`numeral mb-1 flex size-7 items-center justify-center rounded-full text-sm ${ehHoje ? "bg-vinho font-bold text-white" : "text-grafite"}`}>
                  {i + 1}
                </p>
                <ul className="flex flex-col gap-1">
                  {doDia.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <ChipDeEvento evento={e} />
                    </li>
                  ))}
                  {doDia.length > 3 ? <li className="px-1 text-xs text-grafite">+{doDia.length - 3}</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda do mês (sempre no celular; no computador, abaixo da grade) */}
      <section aria-label="Agenda do mês" className="mt-6">
        <h2 className="h3 mb-3 hidden md:block">Agenda</h2>
        {eventos.length === 0 ? (
          <p className="cartao p-5 text-grafite">Nada marcado neste mês.</p>
        ) : (
          <ul className="cartao divide-y divide-linha">
            {eventos.map((e) => (
              <li key={e.id} className="flex items-start gap-4 p-4">
                <div className="w-14 shrink-0 text-center">
                  <p className="numeral text-2xl leading-none font-bold text-tinta">{dia(e.inicio).slice(8)}</p>
                  <p className="mt-1 text-xs text-grafite">{e.origem === "producao" ? "dia" : hora(e.inicio)}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold ${COR[e.tipo]}`}>{ROTULO_TIPO_EVENTO[e.tipo]}</span>
                  <p className="mt-1 font-semibold text-tinta">
                    {e.aulaId ? (
                      <Link href={`/ciclos/aulas/${e.aulaId}`} className="hover:text-vinho">
                        {e.titulo}
                      </Link>
                    ) : (
                      e.titulo
                    )}
                  </p>
                  <p className="text-sm text-grafite first-letter:uppercase">
                    {longa(e.inicio)}
                    {e.local ? ` · ${e.local}` : ""}
                  </p>
                  {e.descricao ? <p className="mt-1 text-[0.9375rem] text-grafite">{e.descricao}</p> : null}
                </div>
                {diretoria && e.origem === "evento" && !e.aulaId ? (
                  <AcaoRapida acao={apagarEvento} confirmar={`Apagar "${e.titulo}"?`}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" aria-label={`Apagar ${e.titulo}`} className="flex size-9 items-center justify-center rounded-lg text-grafite hover:bg-sutil hover:text-vinho-escuro">
                      <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
                    </button>
                  </AcaoRapida>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {diretoria ? (
        <div className="mt-6">
          <Recolhivel titulo="Novo evento no calendário">
            <Formulario acao={criarEvento} resetar className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Campo nome="titulo" rotulo="Título" obrigatorio maxLength={200} className="sm:col-span-2" />
              <Escolha
                nome="tipo"
                rotulo="Tipo"
                opcoes={[
                  { valor: "evento", rotulo: "Evento" },
                  { valor: "prazo", rotulo: "Prazo" },
                  { valor: "competicao", rotulo: "Competição" },
                  { valor: "outro", rotulo: "Outro" },
                ]}
              />
              <Campo nome="local" rotulo="Local" maxLength={200} />
              <Campo nome="data" rotulo="Data" tipo="date" obrigatorio />
              <Campo nome="hora" rotulo="Horário" tipo="time" obrigatorio padrao="20:00" />
              <AreaDeTexto nome="descricao" rotulo="Descrição" linhas={3} className="sm:col-span-2" />
              <BotaoEnviar className="justify-self-start">Criar evento</BotaoEnviar>
            </Formulario>
          </Recolhivel>
        </div>
      ) : null}
    </Pagina>
  );
}

function ChipDeEvento({ evento: e }: { evento: Evento }) {
  const classe = `block truncate rounded-md px-1.5 py-0.5 text-xs font-medium ${COR[e.tipo]}`;
  const texto = `${e.origem === "producao" ? "" : `${hora(e.inicio)} `}${e.titulo}`;
  return e.aulaId ? (
    <Link href={`/ciclos/aulas/${e.aulaId}`} title={e.titulo} className={`${classe} hover:opacity-85`}>
      {texto}
    </Link>
  ) : (
    <span title={e.titulo} className={classe}>
      {texto}
    </span>
  );
}
