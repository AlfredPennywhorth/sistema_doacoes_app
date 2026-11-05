import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  const registerServiceWorker = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('/service-worker.js').catch(function (error) {
          console.warn('[PWA] Falha ao registrar service worker', error);
        });
      });
    }
  `;

  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#003366" />
        <meta
          name="description"
          content="Sistema de Doações — plataforma filantrópica para conectar doadores a pessoas que precisam de itens."
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.png" />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </body>
    </html>
  );
}
