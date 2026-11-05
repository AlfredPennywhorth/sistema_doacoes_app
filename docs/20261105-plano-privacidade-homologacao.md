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
