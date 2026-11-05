import fs from 'fs';
import path from 'path';

const source = fs.readFileSync(
  path.join(process.cwd(), 'src/services/databaseService.js'), 'utf8'
);
const pendingSql = fs.readFileSync(
  path.join(process.cwd(), 'supabase/pending/20261105_secure_donations_draft.sql'),
  'utf8'
);

describe('Gate de privacidade: doacoes, retiradas e contatos', () => {
  it('nao usa SELECT * em items nem incorpora telefone nos joins publicos', () => {
    expect(source).not.toMatch(/\.select\(\s*['"`]\*['"`]\s*\)/);
    expect(source).not.toContain('profiles!user_id(name, phone)');
    expect(source).not.toContain('profiles!requested_by(name, phone)');
    expect(source).not.toContain('profiles!user_id(name,phone)');
    expect(source).toContain('PUBLIC_ITEM_COLUMNS');
  });

  it('consulta telefone/endereco somente via funcao autorizada', () => {
    expect(source).toContain("supabase.rpc('get_donation_pickup'");
    expect(pendingSql).toContain('CREATE OR REPLACE FUNCTION public.get_donation_pickup');
    expect(pendingSql).toMatch(/i\.user_id\s*=\s*auth\.uid\(\)/);
    expect(pendingSql).toMatch(/i\.requested_by\s*=\s*auth\.uid\(\)\s+AND\s+i\.status\s*=\s*'reserved'/);
  });

  it('restringe leitura de campos sensiveis e preserva registros existentes', () => {
    expect(pendingSql).toMatch(/REVOKE ALL ON TABLE public\.items FROM PUBLIC, anon, authenticated/i);
    expect(pendingSql).toMatch(/REVOKE SELECT \(latitude, longitude, pickup_address, pickup_instructions\)/i);
    expect(pendingSql).toMatch(/REVOKE SELECT \(phone\) ON TABLE public\.profiles/i);
    expect(pendingSql).toMatch(/ON CONFLICT \(item_id\) DO NOTHING/i);
    expect(pendingSql).not.toMatch(/DELETE\s+FROM\s+(?:auth\.users|public\.profiles)/i);
    expect(pendingSql).not.toMatch(/TRUNCATE\s+/i);
  });

  it('usa RPCs para reservar, liberar, concluir e excluir doacoes', () => {
    for (const fn of ['reserve_donation', 'release_donation', 'complete_donation', 'delete_donation']) {
      expect(source).toContain(`supabase.rpc('${fn}'`);
      expect(pendingSql).toContain(`CREATE OR REPLACE FUNCTION public.${fn}`);
    }
  });
});
