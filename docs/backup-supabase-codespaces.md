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

## Alternativa validada: pg_dump com senha interativa

Em 05/11/2026 o teste de conexao com `psql -W` no Codespaces
**funcionou** (resultado `postgres|postgres`) usando:
- host `aws-1-sa-east-1.pooler.supabase.com`;
- porta `5432`, usuario `postgres.uiszfmbmavofaecdwwxb`;
- imagem `public.ecr.aws/supabase/postgres:17.11.0.011`.

As tentativas anteriores via `SUPABASE_DB_URL` falharam, mas o teste
interativo confirmou acesso. Nao e necessario redefinir a senha.

A primeira copia deve incluir `public`, `auth` (usuarios reais) e
metadados de `storage`. A senha sera solicitada pelo proprio PostgreSQL,
sem URI nem variavel `PGPASSWORD`:

```bash
BACKUP_DIR="/home/codespace/doacoes-backup-trSymlDU"
umask 077
docker run --rm -it \
  --user "$(id -u):$(id -g)" \
  --mount "type=bind,src=$BACKUP_DIR,dst=/backup" \
  -e PGSSLMODE=require \
  --entrypoint pg_dump \
  public.ecr.aws/supabase/postgres:17.11.0.011 \
  -h aws-1-sa-east-1.pooler.supabase.com -p 5432 \
  -U postgres.uiszfmbmavofaecdwwxb -d postgres -W \
  -Fc -n public -n auth -n storage \
  -f /backup/doacoes-pre-migracao.dump
```

Verificar o tamanho e se o arquivo contem dados de `auth.users`,
`auth.identities`, `public.items` e `public.profiles`, sem exibir
conteudo:

```bash
ls -lh "$BACKUP_DIR/doacoes-pre-migracao.dump"
docker run --rm \
  --mount "type=bind,src=$BACKUP_DIR,dst=/backup,readonly" \
  --entrypoint pg_restore \
  public.ecr.aws/supabase/postgres:17.11.0.011 \
  -l /backup/doacoes-pre-migracao.dump \
  | grep -E 'TABLE DATA (auth (users|identities)|public (items|profiles))'
```

Esse arquivo **nao e um backup completo validado**: pode faltar
objetos fora dos tres esquemas, configuracoes do projeto, roles globais
e arquivos reais dos buckets. `pg_dump -n` nao garante que todas as
dependencias para restauracao isolada estejam incluidas. Sem teste de
restauracao em ambiente separado, o gate continua pendente. Nao executar
`pg_restore` no banco ativo.

## Passo 3. Fazer backup com CLI v3

Versao confirmada no Codespaces em 05/11/2026: Supabase CLI 3.0.0, Node v24.22.2 e Docker disponivel.

A CLI v3 usa a flag --remote=<postgres-url> para direcionar um comando a banco hospedado. A flag --db-url esta depreciada; sem --remote, o comando usa banco local por padrao.

Referencia: https://supabase.com/docs/guides/local-development/cli/migrating-to-v3


```bash
npx --yes supabase@3.0.0 db dump \
  -f "$BACKUP_DIR/roles.sql" --role-only --remote="$SUPABASE_DB_URL"

npx --yes supabase@3.0.0 db dump \
  -f "$BACKUP_DIR/schema.sql" --remote="$SUPABASE_DB_URL"

npx --yes supabase@3.0.0 db dump \
  -f "$BACKUP_DIR/data.sql" --data-only --use-copy \
  -x "storage.buckets_vectors" -x "storage.vector_indexes" \
  --remote="$SUPABASE_DB_URL"

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
