# Cloudflare Pages — PWA Sistema de Doações (homologação)

Este documento prepara a hospedagem do **Expo Web SPA** para a futura Microsoft Store. **Não autoriza publicação nem merge para `master`.** Base: `feature/integracao-apis-publicas`.

## Configuração no painel Cloudflare

Em **Workers & Pages → Create → Pages → Connect to Git**, conectar `AlfredPennywhorth/sistema_doacoes_app` e configurar:

| Campo | Valor |
| --- | --- |
| Project name (sugestão) | `sistema-doacoes-pwa` (verificar disponibilidade) |
| Production branch | `master` (não publicar ainda; desativar build automático de produção) |
| Preview branch | `chore/cloudflare-pages-pwa-prep-20261108` para prévia deste trabalho; depois `feature/integracao-apis-publicas` |
| Framework preset | `None` |
| Root directory | `/` |
| Build command | `npm run build:pages` |
| Build output directory | `dist` |
| Node.js | Usar versão LTS compatível com Expo e lockfile; definir `NODE_VERSION` se necessário |

**IMPORTANTE:** Projetos com integração Git podem criar um deploy inicial ao salvar. Não selecionar uma branch ainda não homologada como produção. Manter **automatic production deployments desativado** e testar exclusivamente em preview. A Cloudflare permite configurar controle de branches e URLs de preview; para validar autenticação/rotas, considerar proteger a URL de preview usando Cloudflare Access, sem pressupor que preview é privada por padrão.

O build usa `npx expo export --platform web` e `npm run verify:pwa` através do script `build:pages`. A opção `expo.web.output = "single"` precisa continuar configurada.

### Variáveis no painel Pages (Preview e, futuramente, Production)

Definir no painel (Settings → Variables and Secrets / Environment variables, conforme versão do painel), para **Preview**:

- `EXPO_PUBLIC_SUPABASE_URL`: URL correta do Supabase
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: chave pública anon/publishable (nunca Service Role)
- `EXPO_PUBLIC_SUPPORT_EMAIL`: endereço operacional de suporte
- `EXPO_PUBLIC_ALLOW_GUEST_TEST_ACCESS=false`: obrigatório, inclusive em preview público
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`: somente se necessário ao build nativo; não reutilizar chave Android como credencial web. O mapa web deve continuar usando MapLibre/OpenFreeMap conforme implementação atual.

As variáveis `EXPO_PUBLIC_*` são incorporadas ao JavaScript do navegador e **não podem conter segredos**. Revisar e eliminar arquivos `.env.production` versionados com dados reais antes de publicar. Conferir se variáveis locais carregadas no build sobrescrevem valores do painel; validar sempre o artefato final.

### Rotas SPA

Cloudflare Pages entrega automaticamente `/index.html` para rotas de SPA que não correspondem a arquivos estáticos, **desde que não exista `404.html` no topo do diretório publicado**. Não adicionar `404.html` estático nem Functions sem validar fallback. Testar diretamente no navegador:

`/`, `/help`, `/privacy`, `/delete-account`, login, Vitrine, Pedidos e `/donate/<id-real-de-teste>`.

### Gates antes de qualquer deploy público

1. `npm ci`
2. `npm run test -- --runInBand`
3. `npm run lint`
4. `npx expo-doctor`
5. `npm run build:pages`
6. Confirmar `dist/index.html`, `dist/manifest.json`, `dist/service-worker.js`, `dist/icon.png` e ausência de `dist/404.html`.
7. Em navegador Edge (também anônimo), conferir instalação da PWA, roteamento, login/logout, erros de console e origem HTTPS.
8. Testar com pelo menos duas contas RLS, reservas/retiradas, uploads e exclusão de conta. Verificar Edge Functions e migrações Supabase realmente implantadas.
9. Não expor endereço, telefone ou coordenadas residenciais precisas no mapa/HTML/API; validar pontos públicos aproximados; revisar cache do service worker em cenários autenticados.
10. Gerar ícones 192×192 e 512×512, confirmar propriedades no manifesto e executar auditoria de instalabilidade no Edge/PWABuilder.

**Bloqueadores conhecidos na revisão de 08/11/2026:** novo mapa MapLibre/OpenFreeMap sem smoke em navegador; coordenadas públicas faltantes em parte dos itens; ícones de 192 e 512 ausentes; homologação HTTPS pendente. `master` usa configuração Expo diferente e **não** deve ser usada para o PWA até release aprovado.

## Identidade Microsoft — inserir apenas no PWABuilder depois da homologação

- Package ID: `AndrWilliamdeSouza.SistemadeDoaes`
- Publisher ID: `CN=2B420EBA-3C60-4C37-9AB4-812AA425CA15`
- Publisher display name: `André William de Souza`
- Store ID: `9PDD6D61CVNX`

Ao empacotar no PWABuilder, associar a URL HTTPS homologada à identidade reservada. Gerar e inspecionar MSIX antes da submissão. Publicação somente com autorização expressa do responsável e aprovação dos gates.

## Referências

- Cloudflare Pages Git integration: https://developers.cloudflare.com/pages/configuration/git-integration/
- Cloudflare Pages SPA handling: https://developers.cloudflare.com/pages/configuration/serving-pages/
- Cloudflare build configuration: https://developers.cloudflare.com/pages/configuration/build-configuration/
- Expo web exports: https://docs.expo.dev/guides/publishing-websites/
- PWABuilder identity: https://github.com/pwa-builder/pwabuilder-windows-chromium-docs/blob/master/find-publisher.md
