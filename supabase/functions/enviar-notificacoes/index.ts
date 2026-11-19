// Edge Function: esvazia a fila de notificações (tabela public.notificacoes) por Web Push.
//
// Chamada pelo banco (pg_net) a cada notificação nova e a cada 10 minutos (pg_cron).
// Não recebe dados de quem chama: só envia o que o banco já colocou na fila. Por isso não
// exige login (verify_jwt desligado); chamá-la de fora apenas adianta um envio já decidido.
//
// Segredo necessário (Supabase → Edge Functions → Secrets): VAPID_PRIVATE_KEY.
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem no ambiente das Edge Functions.

import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import webpush from "npm:web-push@3.6.7";

// Chave pública VAPID (pública por definição; a mesma do navegador, em src/lib/notificacoes-formato.ts).
const VAPID_PUBLICA = "BIRVWVGmqDMynT3dIKYWs3xpvGQ7-A-Ao6VrX6t5fztUYFAMkNyWOMSsivmRMxIg_euQVyGpVCKeMAYD_c-KsxE";
const VAPID_ASSUNTO = "https://lds-academy.vercel.app";

type Notificacao = { id: string; membro_id: string; titulo: string; corpo: string; url: string };
type Inscricao = { id: string; membro_id: string; endpoint: string; p256dh: string; auth: string };

function resposta(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { "Content-Type": "application/json" } });
}

Deno.serve(async () => {
  const privada = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!privada) return resposta({ erro: "VAPID_PRIVATE_KEY não configurada" }, 503);
  webpush.setVapidDetails(VAPID_ASSUNTO, VAPID_PUBLICA, privada);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let enviadas = 0;
  let falhas = 0;
  let aparelhosRemovidos = 0;

  for (let rodada = 0; rodada < 5; rodada++) {
    const { data, error } = await supabase.rpc("reservar_notificacoes", { p_limite: 100 });
    if (error) return resposta({ erro: error.message }, 500);
    const lote = (data ?? []) as Notificacao[];
    if (lote.length === 0) break;

    const membros = [...new Set(lote.map((n) => n.membro_id))];
    const { data: inscricoesDados } = await supabase
      .from("inscricoes_push")
      .select("id, membro_id, endpoint, p256dh, auth")
      .in("membro_id", membros);
    const inscricoes = (inscricoesDados ?? []) as Inscricao[];

    for (const n of lote) {
      const destinos = inscricoes.filter((i) => i.membro_id === n.membro_id);
      const carga = JSON.stringify({ titulo: n.titulo, corpo: n.corpo, url: n.url, tag: n.id });
      // Sem aparelho (todos removidos), não há o que tentar de novo.
      let entregue = destinos.length === 0;

      await Promise.all(
        destinos.map(async (i) => {
          try {
            await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, carga, {
              TTL: 60 * 60 * 12,
              urgency: "normal",
            });
            entregue = true;
          } catch (e) {
            const status = (e as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
              // A inscrição expirou ou foi desfeita no aparelho.
              await supabase.from("inscricoes_push").delete().eq("id", i.id);
              aparelhosRemovidos++;
            } else {
              falhas++;
            }
          }
        }),
      );

      if (entregue) {
        await supabase.from("notificacoes").update({ enviada_em: new Date().toISOString() }).eq("id", n.id);
        enviadas++;
      }
    }
  }

  return resposta({ enviadas, falhas, aparelhosRemovidos });
});
