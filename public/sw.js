// Service worker da LDS Academy.
// Guarda no aparelho só a página "sem conexão" e as imagens dela. As páginas da plataforma
// exigem login e trazem dados dos membros, por isso nunca são guardadas: sempre vêm da rede.
const VERSAO = "lds-academy-v1";
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
