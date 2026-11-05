# Sistema de Doações

Aplicativo de **doações de bens materiais**, desenvolvido com Expo/React Native e Supabase. Conecta pessoas que oferecem itens a pessoas que precisam deles, com vitrine, pedidos, reservas e organização da retirada.

> **Regra permanente do produto:** o sistema trabalha exclusivamente com **itens físicos**. Não implementar doações financeiras, PIX, QR de pagamento, cartão, transferências, arrecadações ou integrações com gateways de pagamento.

## Situação do projeto

- Repositório: `AlfredPennywhorth/sistema_doacoes_app`.
- Branch padrão: `master`; branch de evolução/homologação: `feature/integracao-apis-publicas`.
- Stack da branch de homologação: **Expo SDK 54**, React Native 0.81, Expo Router, TypeScript, Jest e Supabase.
- Plataformas: Android e Web/PWA; objetivo de distribuição web empacotada pela **Microsoft Store** e aplicativo Android pela **Google Play**.
- **Não há autorização para promover à `master` ou publicar nas lojas sem homologação.**

### O que está implementado na branch

- Cadastro e autenticação com Supabase.
- Abas **Mapa**, **Vitrine** e **Pedidos**.
- Cadastro de doações com fotos e escolha de retirada particular ou galpão.
- Publicação de pedidos, reserva de itens, cancelamento de reserva e confirmação de retirada.
- Integração com BrasilAPI/ViaCEP (CEP), IBGE (estados e municípios) e geocodificação via Supabase Edge Function.
- Avatares de fallback com DiceBear e iniciais.
- Central de Ajuda acessível em `/help`, inclusive sem login.
- Política em `/privacy` e solicitação de exclusão em `/delete-account`, ambas públicas no roteamento.
- Função `delete-user` e migrações para dados de retirada privados e limpeza de conta — **deploy e comportamento real exigem validação no Supabase**.
- Estrutura PWA inicial: manifesto, service worker, HTML de registro, ícone e mapa web baseado em Leaflet/OpenStreetMap.

A existência de arquivos no repositório **não comprova** que a infraestrutura remota, políticas RLS, exclusão de contas, permissões e distribuição estejam homologadas.

## Como usar

O módulo de ajuda integrado em `/help` explica o cadastro, a navegação, a publicação de doações, os pedidos, as reservas, o agendamento e a confirmação da retirada, além de orientações de privacidade e solução de problemas.

Fluxo típico: **cadastrar-se → consultar Mapa/Vitrine/Pedidos → publicar um item ou reservar → combinar a retirada → confirmar a entrega**.

Para facilitar a adesão, manter a ajuda acessível antes do login e por **Configurações → Como usar o aplicativo**.

## Arquitetura e organização

| Área | Implementação |
| --- | --- |
| Interface | `src/app/` — rotas do Expo Router |
| Componentes | `src/components/` |
| Integrações públicas | `src/services/api/` |
| Persistência | Supabase Auth, Postgres, Storage e Edge Functions |
| Acesso a dados | `src/services/databaseService.js` |
| Banco e políticas | `supabase/migrations/` |
| Funções de servidor | `supabase/functions/` |
| Testes | `__tests__/` |
| PWA | `public/manifest.json`, `public/service-worker.js`, `public/index.html` (SPA) e `src/app/+html.tsx` (renderização estática) |
| Configuração do aplicativo | `app.json` e `app.config.js` |
| Build Android | `eas.json` |

### Privacidade e regras de negócio

1. **Endereço residencial:** apenas o fluxo de retirada deve solicitar o endereço exato. Ele pertence a dados privados associados ao item, não ao cadastro público do usuário.
2. **Mapa e listagem:** mostrar somente cidade/região e coordenadas **públicas aproximadas** para retiradas residenciais. Galpões institucionais podem usar a localização do próprio local. Nunca aplicar fallback para latitude/longitude residenciais exatas.
3. **Autorização:** proteger dados de retirada com RLS por proprietário, pessoa autorizada pela reserva e administração; não presumir que RLS controla colunas em consultas abertas.
4. **Geocodificação:** Nominatim deve ser chamado somente pela função `geocode-address`, com validação, cache e limites de requisição. Não consultar Nominatim diretamente do cliente.
5. **Permissões:** solicitar GPS e acesso a fotos/câmera somente em ações explícitas; não pedir GPS automaticamente ao abrir um formulário ou selecionar galpão.
6. **Exclusão de conta:** validar JWT no servidor e derivar dele o ID do usuário. Antes de apagar Auth, tratar Storage, doações, pedidos, reservas e referências relacionais; verificar erros e testar cenários de falha.
7. **Minimização:** não publicar telefone, endereço exato ou dados pessoais sem necessidade e autorização. Manter Política de Privacidade e retenção compatíveis com o comportamento efetivo.
8. **Sem transações financeiras:** todas as telas, serviços, tabelas e integrações devem respeitar a restrição a bens materiais.

## Desenvolvimento no GitHub Codespaces

Não é necessário instalar Node.js no computador local. O desenvolvimento, os testes e os builds podem ser executados no **GitHub Codespaces**.

Para iniciar um Codespace novo diretamente na branch de trabalho:

```bash
git fetch origin
git switch feature/integracao-apis-publicas 2>/dev/null || \
  git switch --track -c feature/integracao-apis-publicas origin/feature/integracao-apis-publicas

npm ci
npx expo start
```

Se a branch estiver aberta e houver commits novos, execute `git pull` **antes** de rodar o gate de qualidade. Verifique `git status --short` antes de trocar de branch ou puxar alterações; preserve qualquer trabalho local.

### Gate de validação obrigatório

Execute **um comando por vez**, interrompendo no primeiro erro:

```bash
npm ci
npm run test -- --runInBand
npm run lint
npx expo-doctor
npx expo export --platform web
npm run verify:pwa
```

- Não usar `--force` ou `--legacy-peer-deps` para mascarar conflitos de dependências.
- Manter `package.json` e `package-lock.json` sincronizados.
- O gate deve ter testes, lint, Expo Doctor e exportação web concluídos. Avisos precisam ser avaliados e documentados; preferir corrigir warnings de código antes do release.
- Testar **com contas distintas** RLS, reserva, retirada, exclusão de conta, uploads, navegação web e permissões no dispositivo real.
- Registrar commit, resultados e evidências da homologação antes de preparar PR para `master`.

**Resultados observados nesta fase:** 4 suítes Jest / 16 testes passaram; exportação web concluiu com geração de `dist/`; surgiram avisos de rota `explore` e verificações adicionais da PWA. Esses resultados não representam aprovação integral para produção.

## Variáveis de ambiente e segurança

Usar `.env.example` como referência; não publicar credenciais de administração, Service Role ou tokens privados.

| Variável | Finalidade |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Chave pública do cliente Supabase |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | E-mail **real e operacional** de atendimento |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Chave Android, restrita por pacote/assinatura e APIs |
| `EXPO_PUBLIC_ALLOW_GUEST_TEST_ACCESS` | Bypass de autenticação **apenas em ambiente de desenvolvimento controlado** |

**ATENÇÃO:** variáveis `EXPO_PUBLIC_*` são incorporadas ao cliente: **não são segredos**. A chave antiga do Maps deve ser rotacionada e a nova restringida no Google Cloud.

**Bloqueio de publicação:** foi observado `EXPO_PUBLIC_ALLOW_GUEST_TEST_ACCESS=true` no arquivo `.env.production`. Antes de qualquer deploy público, desativar o bypass, protegê-lo também no código de produção e confirmar em navegador anônimo que rotas privadas exigem autenticação. Revisar igualmente os arquivos de ambiente rastreados no Git.

## Publicação Microsoft Store — Windows via PWA

**Decisão:** distribuir o cliente Windows como **PWA empacotada**, reutilizando Expo Web, sem desenvolver uma segunda aplicação Windows nativa. O empacotamento será feito pelo **PWABuilder** a partir de uma URL HTTPS pública.

### Etapas e gates

1. Completar manifesto, ícones PWA, service worker e registro no HTML, mantendo cache restrito a recursos estáticos e sem armazenar dados pessoais ou chamadas autenticadas em cache público.
2. Homologar o mapa web com **apenas coordenadas públicas** e o fluxo de doação/reserva, inclusive navegação por URL direta.
3. Utilizar `expo.web.output = "single"` para suportar rotas dinâmicas como `/donate/[id]`, com fallback de SPA no host. O template **`public/index.html`** é a entrada para manifesto, metadados e registro do service worker; `src/app/+html.tsx` não substitui esse template no modo SPA. Após exportar, executar `npm run verify:pwa` e validar as rotas diretamente no navegador.
4. Verificar no Microsoft Edge, também em janela anônima: `/`, `/help`, `/privacy`, `/delete-account`, login, Vitrine, Pedidos e detalhes de um item existente.
5. Confirmar que o site utiliza HTTPS, funciona como PWA instalável e não tem avisos críticos de manifesto, service worker, console, CSP, conteúdo misto ou cache.
6. Publicar a versão web validada em host HTTPS e verificar novamente as rotas públicas sem login.
7. Usar a URL no **PWABuilder → Package for Stores → Windows**, informar a identidade do produto e gerar o pacote de submissão para o Partner Center.
8. Preencher descrição, screenshots, categoria, classificação, política de privacidade, suporte e notas para certificação. Submeter somente após aceite funcional.

**Identidade Microsoft:** o nome do produto deve ser reservado no Partner Center. **Package ID**, **Publisher ID** e **Publisher display name** só são necessários na etapa de gerar o pacote no PWABuilder; não devem ser inventados.

**Situação após o gate de 05/11/2026:** corrigida a referência à aba inexistente `explore`; configuração `web.output = "single"` e bypass de login desativado em `.env.production`. O template `public/index.html` e a verificação `npm run verify:pwa` foram adicionados posteriormente e ainda exigem **nova exportação no Codespaces**. Permanecem pendentes: homologação funcional do mapa/Leaflet e do login em navegador anônimo; ícones PWA de 192×192 e 512×512; verificação de rotas diretas no host HTTPS. O sucesso da exportação, isoladamente, não autoriza o deploy.

## Publicação Google Play — Android

1. O perfil `production` de `eas.json` está preparado para gerar **Android App Bundle (`.aab`)**, com ambiente `production`.
2. Rodar os gates automatizados e homologar funções, Storage, RLS, exclusão de conta, localização e câmera em dispositivo Android real.
3. Rotacionar a chave do Google Maps e configurar restrições apropriadas para o pacote Android e a assinatura utilizada na distribuição.
4. Publicar as páginas públicas reais de política de privacidade e exclusão de conta; utilizar e-mail de suporte válido.
5. Preparar ícone, capturas de tela, descrição, classificação indicativa, declarações de segurança de dados e eventuais testes exigidos pelo tipo de conta Google Play.
6. Gerar `.aab` com EAS somente depois da aprovação da homologação, e enviar pela Play Console.

A publicação na Microsoft Store **não equivale** à homologação Android: as duas distribuições compartilham regras, mas possuem pacotes, testes e requisitos de loja próprios.

## Fluxo de trabalho e decisões de release

`feature/integracao-apis-publicas` → revisão e testes no Codespaces → correções → homologação funcional Web/Android → PR → autorização expressa → merge na `master` → distribuição.

- **Não** executar merge automático ou alteração de produção sem autorização.
- **Não** implantar migrações destrutivas, Edge Functions, variáveis ou pacotes de loja sem validação e confirmação apropriadas.
- Usar commits pequenos, mensagens descritivas, evidências de teste e controle de versão.
- Manter as orientações da Central de Ajuda atualizadas quando a interface ou os fluxos mudarem.
- Antes de divulgar link/QR ou submeter um pacote, verificar o ambiente, o commit implantado, as rotas públicas e a ausência de bypass de autenticação.

## Referências

- [Expo — documentação](https://docs.expo.dev/)
- [Expo — Progressive Web Apps](https://docs.expo.dev/guides/progressive-web-apps/)
- [Supabase — documentação](https://supabase.com/docs)
- [Microsoft — Progressive Web Apps](https://learn.microsoft.com/en-us/microsoft-edge/progressive-web-apps/)
- [PWABuilder](https://www.pwabuilder.com/)
