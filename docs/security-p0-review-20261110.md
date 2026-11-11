# Gate P0 — revisão técnica inicial (10/11/2026)

**Estado:** Em andamento. Nenhum SQL executado no Supabase, nenhum merge em master.

## Evidências
- A migração pendente revoga leitura direta de dados sensíveis e usa RPCs SECURITY DEFINER.
- O diagnóstico anterior comprovou SELECT de linhas de terceiros para authenticated nas políticas permissivas.
- Havia grants UPDATE em `items.user_id`, `items.status`, `items.requested_by` e `profiles.is_admin` para anon/authenticated (a eficácia depende de RLS).
- A alteração desta branch revoga explicitamente grants **de coluna**, inclusive UPDATE que um REVOKE de tabela isolado pode deixar intacto, e amplia as assertivas transacionais.
- `databaseService.js` usa RPCs para criar, reservar, liberar, completar e excluir doações; ainda faz DML direto em `item_requests` e `warehouses`.
- `supabase/migrations/fix_items_rls.sql` é legado e cria políticas permissivas. Não reaplicar.
- A leitura de dados legados em `item_pickup_details` exige validação para não perder detalhes de endereços antigos.
- A segurança de `SECURITY DEFINER` requer auditoria do owner, de privilégios EXECUTE, dos objetos referenciados e das RLS, além dos testes de identidade.

## Gates ainda bloqueados
1. Revisar esquema real de todas as colunas incluídas no REVOKE, funções e triggers. **Não executar a migração se houver divergências.**
2. Em Supabase isolado com auth e Storage, executar a migração em transação, validar rollback, contagens e dados legados.
3. Rodar `supabase/diagnostics/20261110_p0_authorization_assertions.sql`; todas as linhas devem ser PASS.
4. Testar REST com anon, usuário A, usuário B e administrador, verificando negação de escrita/leitura indevida e fluxos positivos sem expor dados.
5. Ajustar permissões de `item_requests`/`warehouses` com base nas regras de negócio e testes.
6. Corrigir qualquer incompatibilidade do cliente, CI e revisão por Codex/CodeRabbit.
7. Somente após homologação isolada, planejar migração de produção com autorização expressa.

**Importante:** este commit é uma correção parcial em DRAFT, não uma migração homologada nem uma remediação de produção.
