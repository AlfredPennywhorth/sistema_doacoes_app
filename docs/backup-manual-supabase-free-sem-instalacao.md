# Supabase Free — contingência pelo navegador e backup integral posterior

**Status:** orientação operacional, não é um backup executado nem autorização para executar migração. Nenhum dado pessoal deve ser anexado a PR, issue, chat, planilha pública ou artifact não criptografado.

## Limitação fundamental
- O SQL Editor e o Table Editor permitem copiar/exportar linhas por CSV, quando a opção estiver disponível. **CSV é só um retrato de dados de uma tabela**, não exporta constraints, funções, gatilhos, RLS, grants, contas completas do Supabase Auth, metadados/objetos Storage ou recursos da plataforma.
- Backup de recuperação requer `pg_dump`/Supabase CLI + exportação de papéis e planejamento de restauração, e cópia independente dos arquivos Storage. Não efetuar nenhuma DDL/DML sensível com base apenas nos CSVs.
- No plano Free não há backups agendados pelo painel; a documentação oficial recomenda `supabase db dump`: https://supabase.com/docs/guides/platform/backups ; https://supabase.com/docs/guides/deployment/ci/backups

## Contingência de dados — somente se permitido pela política do computador
1. Se o computador for gerenciado por organização, **confirmar autorização** para baixar arquivos com dados pessoais; se não houver, realizar em casa.
2. Criar pasta local fora de diretórios públicos/sincronizados, por exemplo `SistemaDoacoes/backup-contingencia-2026-11-09`. Evitar OneDrive empresarial ou qualquer serviço automático sem avaliação.
3. No projeto Supabase correto, em `Table Editor` → schema `public`, usar opção `Export to CSV` / download CSV, conforme disponível, para `items`, `item_requests`, `profiles`, `warehouses` (e outras tabelas de domínio descobertas). Se não houver opção, não improvisar `SELECT *` e colar dados sensíveis no chat.
4. Validar localmente o número de linhas (itens: 11, distribuídos em 5 available, 5 reserved e 1 donated); anotar data/hora, projeto e quantidades. Não enviar os CSVs à conversa ou ao GitHub.
5. Guardar os CSVs em mídia/armazenamento pessoal autorizado, preferencialmente criptografado, e limitar acesso. Apagar downloads provisórios de locais não confiáveis após transferir com segurança.
6. No Storage, verificar buckets e objetos; baixar arquivos importantes individualmente, se necessário e permitido. CSV não cobre imagens.
7. **Esta contingência não libera a migração**: faltam backup recuperável da estrutura, papéis, Auth, funções/policies e teste de restauração.

## Preparação de um backup recuperável completo — em casa ou runner privado e seguro
- Ferramenta PostgreSQL/pg_dump compatível com a versão do servidor; usar `Session pooler` (porta 5432, IPv4) com TLS.
- Capturar estrutura + dados em formato customizado, papéis/grants e dependências. Documentar as exclusões e diferenças em relação a Supabase Auth/Storage.
- Nunca colocar URL com senha na linha de comando visível em logs ou mensagens. Não versionar dumps em Git.
- Validar integridade do arquivo e capacidade real de restauração em ambiente isolado, sem sobrescrever projeto atual.
- Na documentação de backup via Actions: GitHub-hosted runners somente IPv4; usar Session pooler. Um repo público **não é destino seguro para dumps nem artifacts em claro**. Para uso remoto, preferir projeto/repositório privado, segredos e criptografia antes do upload.

## Gate de segurança confirmado
- `items`: 11 registros; RLS SELECT verdadeiro para todo `authenticated`, com grants para `pickup_address`, `pickup_instructions`, `latitude`, `longitude`. Não usar a visibilidade ampla de itens para liberar os campos privados.
- Localização pública residencial: próxima **aproximadamente**, sem detalhar residência; endereço privado apenas ao reservante após confirmação atômica e ao doador.
- Migrar a partir do SQL `supabase/pending/20261105_secure_donations_draft.sql` **somente após** backup verificável, auditoria dos efeitos em clientes antigos, revisão da migração, aprovação e testes.

## Checklist de liberação
- [ ] Dados e estrutura exportados de maneira recuperável
- [ ] Cópia segura de Storage ou decisão documentada de escopo
- [ ] Teste de restauração concluído em ambiente isolado
- [ ] PR de migração revisada e aprovada
- [ ] Testes RLS com duas contas: outro usuário não vê endereço privado
- [ ] 11 itens e status preservados após migração
- [ ] Vitrine, mapa e ícones aprovados em Preview
