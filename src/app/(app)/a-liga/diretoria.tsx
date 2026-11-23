import { Avatar } from "@/components/ui";
import type { Fotos } from "@/lib/fotos";
import type { OcupanteDeCargo } from "@/lib/membros";

/** Diretoria atual, na ordem dos cargos. Recebe os dados por parâmetro para poder ser conferida com dados de exemplo. */
export function ListaDaDiretoria({ diretoria, fotos }: { diretoria: OcupanteDeCargo[]; fotos: Fotos }) {
  return (
    <section className="cartao mt-3 p-5 sm:p-8">
      <h2 className="h2">Diretoria atual</h2>
      <p className="prosa mt-1.5 text-grafite">Os associados diretores eleitos pela Assembleia Geral e o cargo de cada um.</p>
      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {diretoria.map((o) => (
          <li key={o.cargo} className="flex min-h-[4.5rem] items-center gap-3 rounded-xl bg-sutil p-4">
            {o.membro ? <Avatar nome={o.membro.nome} foto={fotos[o.membro.id] ?? null} /> : null}
            <div className="min-w-0">
              <p className="text-sm text-grafite">{o.rotulo}</p>
              {o.membro ? (
                <p className="font-semibold text-tinta">{o.membro.nome}</p>
              ) : (
                <p className="text-grafite">Cargo vago</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
