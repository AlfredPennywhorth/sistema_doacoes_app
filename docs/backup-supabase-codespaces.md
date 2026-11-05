# Gate de backup — Supabase Doacoes (antes de qualquer migração)

O projeto esta no plano Free, que **nao tem backup diario automatico**.
Este roteiro deve ser feito no GitHub Codespaces, sem transferir dados
sensíveis para o repositorio ou para esta conversa.

Documentacao oficial:
- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore

## ALERTA IMPORTANTE: usuario real no Auth

O comando `supabase db dump` tem filtros para esquemas gerenciados
(inclusive `auth` e `storage`) por padrao; portanto, **nao considerar
`roles.sql`, `schema.sql` e `data.sql` como copia comprovadamente completa
das contas em `auth.users`/ `auth.identities`**. A exportacao de dados do
Auth, incluindo hashes de senha, deve ser feita e VALIDADA separadamente com
ferramenta compativel de PostgreSQL (por exemplo `pg_dump` limitado a `auth`,
em ambiente seguro) ou metodo oficial de restauracao que inclua Auth, antes de
alteracoes destrutivas. **Nao executar `pg_restore` no projeto ativo.**

A documentacao do CLI informa as exclusoes padrao:
https://supabase.com/docs/reference/cli/introduction
A documentacao da migracao de usuarios confirma que dados Auth e hashes
de senha requerem tratamento especial:
https://supabase.com/kb/troubleshooting/migrating-auth-users-between-projects

Para a migracao incremental planejada aqui, nenhuma tabela de Auth sera
modificada; ainda assim, **o objetivo de seguranca e um backup realmente
recuperavel**, com restauracao verificada em ambiente separado.

## Dados que precisamos preservar

- Usuarios e credenciais existentes no Auth (`auth.users` e demais dados do Auth).
- Perfis reais (`public.profiles`); configuracoes e autorizacoes.
- Dados e esquema atual das tabelas de doacoes, pedidos e galpoes.
- Metadados e objetos do Supabase Storage (o dump SQL nao inclui o conteudo dos arquivos).
- Nenhum item de teste sera excluido durante o processo. A limpeza de itens
  fica para depois da publicacao Microsoft Store, com autorizacao.

## Passo 1. Preparar Codespaces

O comando `supabase db dump` da CLI usa container Docker.
Verifique o Docker e o Node (>=20):

```bash
docker info >/dev/null && echo "Docker disponivel"
node --version
```

Se nao houver Docker, **pare aqui**: nao instale toda a pilha Supabase
nem aplique a migracao sem verificar outra forma de backup.

## Passo 2. Preparar destino fora do Git

No terminal do Codespaces:

```bash
umask 077
BACKUP_DIR="$(mktemp -d "$HOME/doacoes-backup-XXXXXXXX")"
printf "Diretorio de backup: %s\n" "$BACKUP_DIR"
```

No Dashboard Supabase do **projeto Doacoes**, em **Connect**, copie
a conexao via **Session pooler** (recomendado em ambientes IPv4).
A senha fica somente no ambiente do terminal e nunca deve ser digitada
em argumentos literais, arquivos do Git, mensagens ou capturas de tela.

```bash
read -r -s -p "Cole a URI de conexao do Supabase Doacoes: " SUPABASE_DB_URL
printf '\n'
```

## Passo 3. Fazer backup

```bash
npx --yes supabase@latest db dump --db-url "$SUPABASE_DB_URL" \
  -f "$BACKUP_DIR/roles.sql" --role-only

npx --yes supabase@latest db dump --db-url "$SUPABASE_DB_URL" \
  -f "$BACKUP_DIR/schema.sql"

npx --yes supabase@latest db dump --db-url "$SUPABASE_DB_URL" \
  -f "$BACKUP_DIR/data.sql" --data-only --use-copy \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

unset SUPABASE_DB_URL

ls -lh "$BACKUP_DIR"/{roles,schema,data}.sql
```

Estes tres arquivos sao o primeiro checkpoint de backup. **Antes de migrar, verificar se `auth.users` e `auth.identities` foram realmente incluidos em alguma copia recuperavel.** Nao presumir isso com base nos nomes dos arquivos.\n\nVerificar se cada comando terminou sem erro, se os tres arquivos foram
criados e se os arquivos `schema.sql` e `data.sql` nao estao vazios.
**Tamanho nao garante restauracao valida**: conferir via restauracao
em banco de testes ou validação de restauração isolada conforme guia oficial.

## Passo 4. Copia externa protegida

- Criar um arquivo criptografado com senha forte, sem salvar a senha
  no repositorio, e baixar por meio privado e protegido.
- Nao colar `data.sql`, trechos de `auth.users`, telefones, nomes,
  enderecos ou cadeias de conexao nesta conversa.
- Apagar as copias em claro do Codespaces depois de confirmar a copia
  criptografada externa e a validacao da restauracao.
- Nao adicionar backup em commit, release, issue ou artefato CI de acesso publico.

**Storage:** a copia logica do banco inclui metadados, mas **nao os
arquivos de fotos**. Se houver objetos reais a preservar, exportar os
objetos dos buckets de forma independente; nao apagar o bucket.

## Gate para executar SQL

Informacoes seguras que o usuario pode compartilhar:
`roles: OK | schema: OK | data: OK | auth: OK/pendente | restauracao: OK/pendente | arquivos: OK/pendente`.

O SQL rascunho `supabase/pending/20261105_secure_donations_draft.sql`
**nao deve ser executado ate que o backup externo esteja confirmado**.
