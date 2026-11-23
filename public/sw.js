// Service worker da LDS Academy.
// Guarda no aparelho só a página "sem conexão" e as imagens dela. As páginas da plataforma
// exigem login e trazem dados dos membros, por isso nunca são guardadas: sempre vêm da rede.
// Também mostra as notificações (Web Push) e abre a página certa ao tocar nelas.
const VERSAO = "lds-academy-v2";
const OFFLINE = "/offline.html";
const ARQUIVOS = [OFFLINE, "/marca/lockup-vinho.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

// Só navegações: se a rede falhar, mostra a página "sem conexão". O resto segue o navegador.
self.addEventListener("fetch", (evento) => {
  if (evento.request.mode !== "navigate") return;
  evento.respondWith(fetch(evento.request).catch(() => caches.match(OFFLINE)));
});

// Notificação recebida: { titulo, corpo, url, tag }, enviada pela Edge Function enviar-notificacoes.
self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { titulo: "LDS Academy", corpo: evento.data ? evento.data.text() : "" };
  }
  evento.waitUntil(
    self.registration.showNotification(dados.titulo || "LDS Academy", {
      body: dados.corpo || "",
      icon: "/icones/app-192.png",
      badge: "/icones/app-192.png",
      tag: dados.tag,
      lang: "pt-BR",
      data: { url: typeof dados.url === "string" && dados.url.startsWith("/") ? dados.url : "/" },
    }),
  );
});

// Toque na notificação: foca uma aba já aberta da plataforma (e navega) ou abre uma nova.
self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.url || "/", self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      const aberta = janelas.find((j) => new URL(j.url).origin === self.location.origin);
      if (aberta) return aberta.focus().then((j) => (j && "navigate" in j ? j.navigate(destino) : undefined));
      return self.clients.openWindow(destino);
    }),
  );
});
