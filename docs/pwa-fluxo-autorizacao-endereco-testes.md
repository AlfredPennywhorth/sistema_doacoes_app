# Gate PWA — autorização expressa de liberação do endereço

**Status: PROPOSTA NÃO EXECUTADA, NÃO COMPILADA E NÃO HOMOLOGADA.**
Depende de PR #5 (migração base de privacidade), PR #6 (Central de Ajuda) e issue #2.
**Não executar** `supabase/pending/20261109_explicit_pickup_release_DO_NOT_RUN.sql` na instância atual.

## Modelo de autorização

- A oferta permanece na vitrine/mapa com localização pública residencial aproximada.
- A reserva atômica define `items.status='reserved'` e `requested_by`; **não concede endereço automaticamente**.
- O doador, autenticado, vê um controle para autorizar expressamente liberação ao reservante atual.
- O doador deve indicar se o imóvel é de terceiros; nesse caso, só é permitido autorizar se também confirmar permissão prévia do proprietário ou responsável.
- A RPC `confirm_donation_pickup_release` confere no backend que `auth.uid()` é o doador, que a doação está reservada e há reservante atual, sob `FOR UPDATE`.
- A tabela privada `item_pickup_release_approvals` registra o reservante e doador exatos e a atestação (sem acesso direto do cliente).
- `get_donation_pickup` retorna endereço/telefone ao doador ou ao reservante **somente após** a autorização registrada para a reserva atual. Contatos do doador são protegidos no mesmo gate.
- `reserve_donation` e `release_donation` excluem a autorização antiga; uma nova reserva pelo mesmo usuário exige nova confirmação.
- Doações feitas em resposta a pedidos podem nascer reservadas: **continuam sem liberação automática**.
- A aprovação pode ser uma autodeclaração; o aplicativo **não consegue comprovar juridicamente** que um terceiro concedeu permissão. A operação pode exigir registro de consentimento por outro canal, política de retenção e procedimento de contestação.

## Casos mínimos para homologação

| Caso | Conta/ação | Resultado esperado |
|---|---|---|
| 01 | Visitante consulta a oferta | Sem acesso ao endereço e telefone privado |
| 02 | Pessoa B, sem reserva, consulta item da conta A | Apenas dados públicos, região aproximada |
| 03 | Pessoa B reserva item de A | Status reservado; dados de retirada ainda ocultos |
| 04 | Pessoa B chama RPC de endereço antes da aprovação | Sem linhas |
| 05 | Pessoa C chama RPC de liberação para item de A | Negada |
| 06 | Doador A tenta liberar item sem reserva | Negado |
| 07 | A assinala imóvel de terceiros, mas não atesta autorização | Botão bloqueado e RPC rejeita |
| 08 | A confirma imóvel próprio e aprova liberação | Status autorizado para reserva B |
| 09 | A confirma imóvel de terceiros com atestação | Endereço autorizado a B |
| 10 | Após aprovação, B consulta dados privados | Retorna apenas campos autorizados |
| 11 | Pessoa C consulta dados de retirada de A/B | Sem linhas |
| 12 | B cancela reserva | Aprovação revogada; acesso privado negado |
| 13 | Mesmo B reserva novamente | Sem acesso privado até nova aprovação |
| 14 | A cancela reserva | Aprovação revogada |
| 15 | Item nasce reservado devido a pedido existente | Sem aprovação automática |
| 16 | Itens em galpão público | Endereço institucional público segue regra própria |
| 17 | Itens legados (5 available, 5 reserved, 1 donated) | Status preservados e sem liberação automática |
| 18 | Duas reservas concorrentes | Uma única reserva efetiva; sem aprovação cruzada |
| 19 | Doação concluída | Reservante não obtém novamente endereço por RPC |
| 20 | Recarregar navegador/reativar sessão | Estado de autorização é persistido no banco |

## Revisões obrigatórias antes de aprovar

1. **Backup restaurável** de banco, Auth, Storage e ensaio de restore (CSV das cinco tabelas é somente contingência).
2. Confirmar que nenhum SELECT, view, RPC ou bucket público entrega `pickup_address`, `pickup_instructions`, `latitude`, `longitude` ou `profiles.phone` sem autorização.
3. A PR #5 precisa revogar privilégios diretos de SELECT/UPDATE de colunas sensíveis, mesmo que as políticas RLS antigas sejam amplas.
4. Conferir RPC `create_donation_with_pickup_details` e todos os caminhos de status (inclusive item criado para um pedido, editado por dono ou administração). Nenhum caminho pode evitar limpar aprovação; considerar trigger de revogação como defesa adicional.
5. Compatibilidade com cliente antigo antes de alteração de banco. Ao mudar o backend, usuários em versões antigas não devem receber dados privados.
6. Revisar tratamento Web de confirmações, acessibilidade, e botão para autorizar sem depender só de `Alert.alert` nativo.
7. Revisar uso de telefone/WhatsApp e outros caminhos públicos, que devem estar protegidos pela mesma condição.
8. Testar os 20 casos com duas ou três contas distintas em ambiente isolado; CI/build/lint ainda não realizados neste draft.
9. Revisar política para endereços de terceiros e localização aproximada quanto à identificação involuntária.

**Não fazer merge/deploy/submissão à loja até conclusão dos gates.**
