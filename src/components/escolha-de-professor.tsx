"use client";

import Link from "next/link";
import type { OpcaoDeProfessor } from "@/lib/professores";

/**
 * Escolha do professor no banco. Ao escolher, preenche no mesmo formulário os campos de nome
 * e de apresentação (que continuam editáveis). Envia `professor_id`, vazio quando ninguém foi escolhido.
 */
export function EscolhaDeProfessor({
  professores,
  padrao,
  campoNome = "professor",
  campoApresentacao = "professor_bio",
  prefixo,
}: {
  professores: OpcaoDeProfessor[];
  padrao?: string | null;
  campoNome?: string;
  campoApresentacao?: string;
  prefixo?: string;
}) {
  const campoId = prefixo ? `${prefixo}-professor_id` : "professor_id";

  function aoEscolher(e: React.ChangeEvent<HTMLSelectElement>) {
    const escolhido = professores.find((p) => p.id === e.currentTarget.value);
    const formulario = e.currentTarget.form;
    if (!escolhido || !formulario) return;
    const nome = formulario.elements.namedItem(campoNome);
    const apresentacao = formulario.elements.namedItem(campoApresentacao);
    if (nome instanceof HTMLInputElement) nome.value = escolhido.nome;
    if (apresentacao instanceof HTMLTextAreaElement && escolhido.apresentacao) apresentacao.value = escolhido.apresentacao;
  }

  return (
    <div>
      <label htmlFor={campoId} className="rotulo-campo">
        Professor do banco <span className="font-normal text-grafite">(opcional)</span>
      </label>
      <select id={campoId} name="professor_id" defaultValue={padrao ?? ""} onChange={aoEscolher} className="campo">
        <option value="">Nenhum (só o nome abaixo)</option>
        {professores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
            {p.disponivel ? "" : " (não convidar por ora)"}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-sm text-grafite">
        Liga a aula à ficha do professor e preenche o nome e a apresentação.{" "}
        <Link href="/professores" className="link">
          Abrir o banco
        </Link>
      </p>
    </div>
  );
}
