'use strict';
// Read-only authorization smoke test. Runs ONLY against deliberately configured
// isolated fixture projects. Never prints row bodies or secrets.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isPrivilegeDenied } = require('./security-p0-response.cjs');

const required = [
  'P0_ISOLATED_URL','P0_ISOLATED_ANON_KEY','P0_TEST_JWT_A',
  'P0_TEST_JWT_B','P0_ITEM_A_ID','P0_ITEM_B_ID'
];
test('isolated Supabase REST/RPC authorization matrix (read-only)', { skip: process.env.P0_CONFIRM_ISOLATED_FIXTURES !== 'YES_ISOLATED_FIXTURES' ? 'explicit isolated-fixture confirmation required' : false }, async (t) => {
  for (const key of required) assert.ok(process.env[key], 'Required isolated test env missing: ' + key);
  const url = new URL(process.env.P0_ISOLATED_URL);
  assert.equal(url.protocol, 'https:');
  assert.match(url.hostname, /^[a-z0-9-]+\.supabase\.co$/);
  assert.ok(process.env.P0_TEST_JWT_A !== process.env.P0_TEST_JWT_B, 'Use two distinct fixture accounts');
  assert.ok(process.env.P0_ITEM_A_ID !== process.env.P0_ITEM_B_ID, 'Use two distinct fixture items');

  // Optional defense-in-depth: deny the *known* production project reference.
  if (process.env.P0_PRODUCTION_PROJECT_REF) {
    assert.notEqual(url.hostname.split('.')[0], process.env.P0_PRODUCTION_PROJECT_REF,
      'Refusing to test against the production Supabase project');
  } else {
    throw new Error('P0_PRODUCTION_PROJECT_REF is required to exclude production');
  }
  const key = process.env.P0_ISOLATED_ANON_KEY;
  async function request(route, jwt, method = 'GET', body) {
    const response = await fetch(url.origin + route, {
      method,
      headers: {
        apikey: key,
        Authorization: 'Bearer ' + (jwt || key),
        ...(body === undefined ? {} : {'Content-Type':'application/json'})
      },
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
      signal: AbortSignal.timeout(12000)
    });
    // Response parsed in memory only; never compare objects containing private values in assertions.
    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  }
  const jwtA = process.env.P0_TEST_JWT_A, jwtB = process.env.P0_TEST_JWT_B;
  const itemA = process.env.P0_ITEM_A_ID, itemB = process.env.P0_ITEM_B_ID;

  async function identities(jwt) {
    const r = await request('/auth/v1/user', jwt);
    assert.equal(r.status, 200, 'Fixture JWT must be valid');
    assert.match(r.data?.id || '', /^[0-9a-f-]{36}$/i);
    return r.data.id;
  }
  const uidA = await identities(jwtA), uidB = await identities(jwtB);
  assert.ok(uidA !== uidB, 'Fixture users must be different');

  for (const [label,jwt] of [['anon',null],['user A',jwtA],['user B',jwtB]]) {
    await t.test(label + ': direct reads of sensitive columns denied', async () => {
      for (const [table,column] of [
        ['items','latitude'],['items','longitude'],
        ['items','pickup_address'],['items','pickup_instructions'],
        ['profiles','phone']
      ]) {
        const r = await request('/rest/v1/' + table + '?select=' + column + '&limit=1',jwt);
        assert.ok(isPrivilegeDenied(r),
          label + ': expected PostgreSQL 42501 privilege denial for ' + table + '.' + column);
      }
    });
  }

  // Ensure fixture ownership and state through public, nonsensitive metadata.
  for (const [jwt,id,owner] of [[jwtA,itemA,uidA],[jwtB,itemB,uidB]]) {
    const r = await request('/rest/v1/items?select=id,user_id,status,requested_by&id=eq.' + encodeURIComponent(id),jwt);
    assert.equal(r.status,200,'Fixture item must be visible to its owner');
    assert.equal(r.data?.length,1,'Fixture item must exist');
    assert.ok(r.data[0].user_id === owner,'Fixture item must belong to expected user');
    assert.equal(r.data[0].status,'available','Fixture must be unreserved for cross-user negative test');
  }

  for (const [label,jwt,own,other] of [
    ['A',jwtA,itemA,itemB],['B',jwtB,itemB,itemA]
  ]) {
    await t.test('user ' + label + ': pickup RPC permits own item, rejects other item',async () => {
      const ownResult = await request('/rest/v1/rpc/get_donation_pickup',jwt,'POST',{p_item_id:own});
      assert.equal(ownResult.status,200,'Own pickup RPC should succeed');
      assert.equal(ownResult.data?.length,1,'Own pickup should return exactly one row');
      const otherResult = await request('/rest/v1/rpc/get_donation_pickup',jwt,'POST',{p_item_id:other});
      assert.equal(otherResult.status,200,'Denied RPC should respond with empty result');
      assert.ok(Array.isArray(otherResult.data) && otherResult.data.length === 0,
        'Pickup details leaked across users');
    });
  }
  await t.test('anonymous pickup RPC cannot be invoked',async () => {
    const r = await request('/rest/v1/rpc/get_donation_pickup',null,'POST',{p_item_id:itemA});
    assert.ok(isPrivilegeDenied(r),'Anonymous pickup RPC unexpectedly callable');
  });
});
