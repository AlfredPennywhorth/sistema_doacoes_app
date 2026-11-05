# Plano de adequacao do Supabase para publicacao (05/11/2026)

**Situacao:** documentacao de planejamento; **nenhuma alteracao de banco executada por este arquivo**.

## Decisao sobre os registros

- As **11 doacoes atualmente cadastradas sao exclusivamente de teste**. Permanecerao disponiveis para homologar o aplicativo e serao **excluidas depois que a publicacao na Microsoft Store estiver concluida**, conforme decisao do responsavel. Nao remover antes sem autorizacao.
- **Os logins sao de usuarios reais e devem ser preservados**: manter `auth.users`, `auth.identities`, `public.profiles`, hashes de senha e configuracoes de autenticacao existentes. Nunca fazer `TRUNCATE`, `DROP`, seed destrutivo ou reset do projeto.
- Os dados de localizacao/endereco cadastrados durante testes **nao devem ser tratados automaticamente como ficticios**. Verificar e proteger como dados pessoais ate haver confirmacao de que sao sinteticos.
- A exclusao posterior dos itens deve remover tambem imagens de teste e dados de retirada associados, preservando usuarios e configuracoes de producao.

## Diagnostico conhecido

- `public.items`: 11 registros, todos com `latitude` e `longitude`; sete com `pickup_address`; nenhum em galpao; nao existem `public_latitude` nem `public_longitude`.
- `public.item_pickup_details`: ainda nao existe.
- `public.profiles`: `id, name, phone, created_at, is_admin`; nao possui `role` nem `avatar_url`.
- O aplicativo possui consultas amplas `SELECT *` e joins com `profiles.phone`.
- Políticas RLS de `items` e `profiles` permitem leitura ampla de registros para usuários autenticados. **RLS nao limita colunas**. Precisamos confirmar grants efetivos e proteger dados privados antes de deploy publico.
- O mapa web usa somente coordenadas publicas; enquanto elas nao existirem, as 11 doacoes aparecem na lista mas nao geram marcadores.

## Gates antes de alterar o banco

1. Executar a auditoria **somente leitura**: `supabase/diagnostics/20261105_privacy_preflight.sql`, no projeto Supabase correto.
2. Capturar backup/restore verificavel das tabelas e do Storage sem apagar usuarios.
3. Inspecionar grants efetivos de colunas, RLS, funcoes SQL, relacionamentos com `auth.users` e dependencias de `warehouse_id`.
4. Registrar a estrategia de reversao, a versao do codigo e a janela de homologacao.

## Implementacao planejada

1. Criar campos **publicos aproximados** e tabela protegida de retirada, com RLS e grants minimos. A migracao SQL legada `20260729_add_pickup_details_and_rpc.sql` **nao deve ser executada sem adaptacao**, porque usa `profiles.role` inexistente.
2. Corrigir funcoes e consultas para expor somente campos publicos na vitrine/mapa. Endereco e instrucoes devem ficar acessiveis por fluxo autorizado ao doador e destinatario da reserva; telefone real nao deve ser lido por qualquer autenticado.
3. Tratar os 11 itens como **dados de teste**: nao e preciso reconstruir historico permanente nem geocodificar enderecos reais. Para testar marcadores, incluir coordenadas publicas sinteticas ou aprovadas, sem fallback para coordenadas privadas. Se for necessario testar retirada com itens antigos, migrar os respectivos dados privados com validacao.
4. Aplicar migrações somente após aprovação do preflight e teste de autenticação, RLS e concorrência com contas distintas.
5. Antes da publicacao, homologar login, listagem, mapa, pedidos, reservas, retirada, imagem, privacidade, exclusao de conta e rotas publicas.
6. **Depois de concluida a publicacao na Microsoft Store**, realizar a limpeza controlada dos registros e imagens de teste, com verificacao por contagem. Nao apagar contas reais, perfis, configuracoes ou dados que venham a ser cadastrados por usuarios reais nesse intervalo.

## Regras operacionais

- Nunca rodar `DROP SCHEMA`, `TRUNCATE auth.users`, `supabase db reset` ou recriar o projeto.
- Nao aplicar `DELETE FROM items` sem escopo e aprovacao; para a limpeza futura, identificar inequivocamente os IDs de teste.
- Nao publicar o aplicativo com as atuais permissoes amplas sobre coordenadas, enderecos e telefones.
- Gate: branch de homologacao → testes → aprovacao funcional/institucional → autorizacao explicita → publicacao.

## Resultado da auditoria de GRANTs (05/11/2026)

A checagem `has_column_privilege` devolveu `true` para `anon` e
`authenticated` em `items.latitude`, `items.longitude`,
`items.pickup_address`, `items.pickup_instructions` e `profiles.phone`.
Esse resultado mede concessoes SQL; **nao prova acesso efetivo anonimo** porque
as politicas RLS tambem sao consideradas. As politicas `SELECT USING (true)`
para autenticados tornam a exposicao de linhas a esses usuarios possivel.

### Correcao preparada, nao aplicada

- `supabase/pending/20261105_secure_donations_draft.sql`: migracao transacional
  **em rascunho**. Cria `item_pickup_details`, copia dados legados sem apagar os
  originais, adiciona colunas publicas, aplica grants de coluna e inclui RPCs
  autenticadas de reserva/retirada/contato.
- `src/services/databaseService.js`: consultas de listagem e detalhes passaram
  a usar lista explicita de campos publicos. Endereco e contato sao obtidos apenas
  via RPC autorizada. Operacoes de reserva/liberacao/conclusao/exclusao usam RPCs.
- `__tests__/donations-privacy-gate.test.ts`: teste estatico para impedir que
  SELECT * e joins diretos com telefone retornem.

**Dependencia critica:** o cliente atualizado precisa das novas colunas e RPCs.
**Nao atualizar o Codespaces para testar navegacao com esse codigo antes de
alinharmos o banco**. O SQL esta em `supabase/pending`, nao em
`supabase/migrations`, justamente para evitar aplicacao acidental.

### Sequencia obrigatoria

1. Confirmar os gatilhos que criam `profiles` na inscricao e as funcoes
   existentes por assinatura, evitando interromper cadastro e demais fluxos.
2. Fazer backup externo verificavel dos dados e do Storage. Nenhuma credencial
   ou dump com dados pessoais deve ser registrado no Git.
3. Revisar o rascunho de SQL, executar os testes Jest/lint e preparar uma janela
   sem novos cadastros nem reservas durante a aplicacao.
4. Aplicar o SQL em uma transacao no projeto Supabase de Doacoes apenas apos
   aprovacao expressa. Se alguma assertiva de grants falhar, a transacao
   inteira devera ser revertida.
5. Atualizar a branch no Codespaces, recompilar a PWA e homologar com **duas
   contas distintas**: vitrine nao recebe endereco/telefone, reservante
   autorizado recebe contato, usuario nao autorizado nao recebe detalhes
   privados, somente dono confirma a retirada, e anon nao acessa dados.
6. Se o cadastro real de contas deixar de funcionar por algum grant de perfil,
   interromper a homologacao e revisar o gatilho/politica antes de liberar uso.
7. Prosseguir para Microsoft Store somente depois de testes funcionais e
   seguranca aprovados. Excluir as 11 doacoes **somente apos publicacao
   concluida**, preservando auth.users e profiles.
