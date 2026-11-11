'use strict';
// Static P0 safety gate. This does NOT exercise PostgreSQL, RLS, or RPC authorization.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const draft = fs.readFileSync(path.join(root, 'supabase/pending/20261105_secure_donations_draft.sql'), 'utf8');
const checks = fs.readFileSync(path.join(root, 'supabase/diagnostics/20261110_p0_authorization_assertions.sql'), 'utf8');
const service = fs.readFileSync(path.join(root, 'src/services/databaseService.js'), 'utf8');
const normalized = (s) => s.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').toLowerCase();

test('migration remains explicitly gated and transactional', () => {
  assert.match(draft, /DRAFT \/ GATE PENDENTE/);
  assert.match(normalized(draft), /\bbegin\s*;/);
  assert.match(normalized(draft), /\bcommit\s*;/);
  assert.match(draft, /CREATE TABLE IF NOT EXISTS public\.item_pickup_details/i);
  assert.match(draft, /ENABLE ROW LEVEL SECURITY/i);
});

test('sensitive table and column grants are explicitly revoked', () => {
  for (const table of ['items', 'profiles']) {
    assert.match(normalized(draft), new RegExp('revoke all on table public\\.' + table + ' from public, anon, authenticated'));
    assert.match(normalized(draft), new RegExp('revoke insert \\([\\s\\S]*?\\), update \\([\\s\\S]*?\\), references \\([\\s\\S]*?\\) on table public\\.' + table + ' from public, anon, authenticated'));
  }
  for (const column of ['latitude','longitude','pickup_address','pickup_instructions']) {
    assert.match(draft, new RegExp('\\b' + column + '\\b'));
  }
  assert.match(normalized(draft), /revoke select \(phone\) on table public\.profiles from public, anon, authenticated/);
  for (const column of ['is_admin','user_id','requested_by','status']) {
    assert.match(draft, new RegExp("has_column_privilege\\(v_role, 'public\\.(?:items|profiles)', '" + column + "', 'UPDATE'\\)"));
  }
});

test('diagnostic checks explicit roles and all expected sensitive privileges', () => {
  assert.match(checks, /has_column_privilege\(role_name, table_name, column_name, privilege\)/);
  assert.doesNotMatch(checks, /has_column_privilege\(role_name, scope, privilege\)/);
  const rows = [...checks.matchAll(/\('(anon|authenticated)','public\.(items|profiles)','([a-z_]+)','(SELECT|UPDATE)',false\)/g)];
  assert.equal(rows.length, 18);
  const expected = [
    ...['latitude','longitude','pickup_address','pickup_instructions'].map(column => ['items',column,'SELECT']),
    ['profiles','phone','SELECT'], ['profiles','is_admin','UPDATE'],
    ...['user_id','requested_by','status'].map(column => ['items',column,'UPDATE'])
  ];
  for (const role of ['anon','authenticated']) {
    for (const [table,column,privilege] of expected) {
      assert.equal(rows.filter(row => row[1]===role && row[2]===table && row[3]===column && row[4]===privilege).length, 1,
        'Missing/duplicate check: ' + [role,table,column,privilege].join('/'));
    }
  }
});

test('database service uses RPC for sensitive donation state transitions', () => {
  for (const rpc of [
    'get_donation_pickup','create_donation_with_pickup_details',
    'reserve_donation','release_donation','complete_donation','delete_donation'
  ]) assert.ok(service.includes("supabase.rpc('" + rpc + "'"), 'Missing RPC: ' + rpc);
  for (const field of ['latitude','longitude','pickup_address','pickup_instructions']) {
    const publicColumns = service.match(/const PUBLIC_ITEM_COLUMNS = \[([\s\S]*?)\]\.join\(','\)/);
    assert.ok(publicColumns, 'PUBLIC_ITEM_COLUMNS missing');
    assert.doesNotMatch(publicColumns[1], new RegExp("['\\\"]" + field + "['\\\"]"));
  }
});

test('migration requires explicit privileged RPC execution grants', () => {
  for (const name of ['get_donation_pickup','create_donation_with_pickup_details','reserve_donation','release_donation','complete_donation','delete_donation']) {
    assert.match(draft, new RegExp('REVOKE ALL ON FUNCTION public\\.' + name + '\\(', 'i'));
    assert.match(draft, new RegExp('GRANT EXECUTE ON FUNCTION public\\.' + name + '\\(', 'i'));
  }
});
