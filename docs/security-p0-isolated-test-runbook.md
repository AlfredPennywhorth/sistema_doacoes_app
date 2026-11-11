# Preparação do teste real P0 — somente ambiente Supabase isolado

## O que já está automatizado
- `node --test tests/security-p0-static.test.cjs`: teste estático no CI, sem credenciais.
- `node --test tests/security-p0-rest.test.cjs`: teste REST **somente leitura**, que permanece ignorado por padrão.
- O teste REST compara anon, usuário A e usuário B: cinco colunas sensíveis e liberação da retirada por RPC apenas ao dono. Não imprime telefones, endereços, coordenadas nem tokens.

## Pré-condições obrigatórias
1. Projeto Supabase de testes **distinto** da produção, com `auth`, Storage e `public` compatíveis.
2. Migração `20261105_secure_donations_draft.sql` revisada e aplicada **apenas ao isolado**. Executar `20261110_p0_authorization_assertions.sql` e exigir 18 PASS, sem FAIL.
3. Duas contas fictícias próprias do ambiente isolado, A e B, cada qual com um item **fictício disponível** e sem reserva, de sua própria autoria.
4. Dois JWTs de sessão válidos dessas contas, URL do projeto isolado e chave pública `anon`. Esses valores vão apenas em variáveis de ambiente seguras; nunca em comentários, PRs, logs ou commits.
5. Referência do projeto de produção em `P0_PRODUCTION_PROJECT_REF`, para impedir execução acidental nele.
6. `P0_CONFIRM_ISOLATED_FIXTURES=YES_ISOLATED_FIXTURES`, **somente quando tudo estiver pronto**. Sem essa confirmação, o teste é ignorado.

## Execução por operador autorizado
`node --test tests/security-p0-rest.test.cjs`

Variáveis exigidas: `P0_ISOLATED_URL`, `P0_ISOLATED_ANON_KEY`, `P0_TEST_JWT_A`, `P0_TEST_JWT_B`, `P0_ITEM_A_ID`, `P0_ITEM_B_ID`, `P0_PRODUCTION_PROJECT_REF` e `P0_CONFIRM_ISOLATED_FIXTURES`.

**Não armazenar essas variáveis no repositório; não cadastrar segredos de produção no GitHub.** Não usar contas ou dados reais. Não se habilita a execução REST automaticamente no CI.

## O que ainda falta
- Testes isolados **de escrita** (negação de update `profiles.is_admin`, `items.user_id`, reserva concorrente, exclusão, conclusão e gestão de pedidos/galpões) com fixtures descartáveis e rollback.
- Conferir o dono efetivo das funções `SECURITY DEFINER` e privilégios `EXECUTE`.
- Verificar a preservação dos 31 registros originais no processo de restauração, sem expor PII.
- Revisar semântica de `releaseItem(requestId)` e o fluxo de `item_requests` para evitar estado inconsistente.
- Exigir revisão de segurança do código mais recente, CI verde e homologação humana antes da produção.

## Gate
Sem evidências de execução real no Supabase isolado, o marco Segurança P0 continua **em andamento**; marco Recuperação Integral Supabase continua **pendente**.
