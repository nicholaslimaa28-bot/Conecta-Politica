// Service worker do Conecta Política: recebe os alertas (Web Push) e abre a página certa ao tocar.
self.addEventListener("push", (event) => {
  let dados = { titulo: "Conecta Política", corpo: "Há novidades sobre o que você segue.", url: "/alertas" };
  try { if (event.data) dados = { ...dados, ...event.data.json() }; } catch (_) { /* aviso sem JSON */ }
  event.waitUntil(
    self.registration.showNotification(dados.titulo, {
      body: dados.corpo,
      icon: "/icone-192.png",
      badge: "/icone-192.png",
      data: { url: dados.url },
      lang: "pt-BR",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) if (j.url === url && "focus" in j) return j.focus();
      return self.clients.openWindow(url);
    }),
  );
});
