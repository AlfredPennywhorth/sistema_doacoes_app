# Gate de segurança PWA/Supabase — 09/11/2026

Status: **PENDENTE — NÃO EXECUTAR MIGRAÇÃO**. Vinculado à issue #2. Documento de planejamento/auditoria, sem autorização para alterar o banco.

## Evidência confirmada pelo responsável no SQL Editor
- `public.items`: 19 colunas; cinco colunas de mapa público ausentes (`city`, `state`, `public_latitude`, `public_longitude`, `location_precision`).
- 11 itens preservados: 5 `available`, 5 `reserved`, 1 `donated`.
- `latitude`, `longitude`, `pickup_address`, `pickup_instructions` existem na tabela de itens.
- RLS ativo em `items`; duas políticas SELECT para `authenticated` usam `true`, e os GRANTs permitem ler as quatro colunas privadas. Qualquer autenticado pode estar autorizado a ler endereços dos demais: **incidente de autorização crítico**.
- `profiles` possui política SELECT `true` para autenticados; auditoria de grants sobre telefone e escrita administrativa ainda pendente.
- Preview Cloudflare está online; proteger acesso ao site não substitui corrigir grants/RLS na API Supabase.

## Regra funcional aprovada
1. Listagem/vitrine: todos os itens disponíveis e reservados adequadamente classificados; omitir endereços privados. Não transformar erro de consulta em “nenhuma doação”.
2. Mapa: para itens residenciais, **posição pública deliberadamente aproximada da região próxima à residência**, nunca coordenada exata, e nunca fallback para `latitude/longitude` legadas. O grau de aproximação precisa ser avaliado contra reidentificação e locais isolados.
3. Galpão institucional com endereço publicamente divulgado: localização exata somente se aprovada como informação pública.
4. Endereço completo/contato/instruções: doador e usuário cuja reserva esteja **efetivamente confirmada**. Verificação obrigatória por JWT `auth.uid()`, item e status no backend/RPC. Liberar a consulta após reserva atômica confirmada; cancelar revoga acesso.
5. Itens legados: não inferir coordenadas públicas a partir das antigas sem processo de conversão/auditoria aprovado; até lá podem aparecer na vitrine sem marcador.

## Revisão crítica do draft existente
`supabase/pending/20261105_secure_donations_draft.sql` é uma **transação DDL/DML de alto impacto** e NÃO está homologada.
- Migra dados legados para `item_pickup_details` mas mantém colunas antigas em `items`: é obrigatório remover acesso efetivo às colunas privadas via GRANTs e verificar canais alternativos (views, RPCs, storage).
- Faz `REVOKE ALL` de `items` e `profiles`; pode interromper versões antigas do app, criação/atualização de perfil, inserção direta e outras telas. Conferir todas as chamadas antes da execução.
- Define RPCs de criação/reserva/liberação/retirada/exclusão e altera política de concessões; conferir assinatura real, foreign keys, triggers, privilégios de execução, função de exclusão de conta e políticas antigas permissivas.
- O campo público arredondado a 2 casas decimais representa uma área aproximada, mas **não garante privacidade por si só**, especialmente em locais com poucos domicílios. Testar localização aprovada, minimizar dados e considerar ajuste de resolução conforme densidade.
- Os 11 itens legados não ganham latitude pública automaticamente; mapa pode continuar vazio até procedimento seguro de atribuição/aceite das regiões aproximadas.
- Conferir se `item_requests`, `warehouses`, `profiles` têm regras compatíveis de leitura/escrita e se campos pessoais aparecem em selects amplos.
- Verificar se `get_donation_pickup` é acessível somente a participante autorizado com reserva ativa; nunca confiar apenas em ocultar o endereço na UI.

## Ordem operacional obrigatória
1. Impedir divulgação do Preview e mitigar exposição via Supabase; um site protegido no Cloudflare não torna uma API Supabase pública segura.
2. Obter **backup verificável e procedimento de restauração**; confirmar plano/retention e possibilidade efetiva de restaurar no ambiente de teste antes de DDL.
3. Executar `supabase/diagnostics/20261109_pwa_security_gate_readonly.sql` no projeto correto e revisar resultados (apenas metadados).
4. Revisar dependências e gerar migração revisada em **PR separada**, incluindo assertivas/rollback e instruções explícitas.
5. Homologar com duas contas de teste + visitante; negar endereços e telefones não autorizados, preservar 11 registros, garantir reservas atômicas e cancelamentos.
6. Só então executar migração **aprovada** no Supabase, verificar e, separadamente, corrigir vitrine, ícones e MapLibre no Preview.
7. **Sem merge para master, sem publicação da Microsoft Store e sem execução de SQL mutável até aprovação.**

## Nota sobre proteção imediata
Uma mitigação temporária (restringir acesso de leitura a colunas privadas) exige análise de dependências e autorização explícita, pois pode interromper clientes existentes. Não aplicar automaticamente `REVOKE`, `ALTER POLICY`, `DROP` ou comandos de atualização no SQL Editor.
