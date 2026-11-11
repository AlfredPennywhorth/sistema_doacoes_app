'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isPrivilegeDenied } = require('./security-p0-response.cjs');

test('accepts only explicit privilege errors', () => {
  assert.ok(isPrivilegeDenied({status:403,data:{code:'42501',message:'permission denied'}}));
  assert.ok(isPrivilegeDenied({status:401,data:{code:'42501'}}));
});

test('does not mark nonexistent columns or malformed queries as authorized denial', () => {
  for (const response of [
    {status:400,data:{code:'42703',message:'column does not exist'}},
    {status:400,data:{code:'PGRST100',message:'invalid query'}},
    {status:400,data:{code:'42501'}},
    {status:404,data:{code:'PGRST202'}},
    {status:401,data:{code:'PGRST301'}},
    {status:403,data:{code:'other'}},
    {status:200,data:[]},
    {status:403,data:null}
  ]) assert.ok(!isPrivilegeDenied(response),'Invalid or unrelated response was accepted');
});

test('failed boolean assertion never serializes sensitive response bodies or tokens', () => {
  const privateBody = [{pickup_address:'NEVER_LOG_PRIVATE_ADDRESS',donor_phone:'NEVER_LOG_PRIVATE_PHONE'}];
  const secretA = 'NEVER_LOG_JWT_A', secretB = secretA;
  let message = '';
  try {
    assert.ok(Array.isArray(privateBody) && privateBody.length === 0, 'Pickup details leaked across users');
  } catch (e) { message = String(e.stack || e); }
  assert.ok(message.includes('Pickup details leaked across users'));
  assert.ok(!message.includes('NEVER_LOG_PRIVATE_ADDRESS'));
  assert.ok(!message.includes('NEVER_LOG_PRIVATE_PHONE'));
  try {
    assert.ok(secretA !== secretB, 'Use two distinct fixture accounts');
  } catch (e) { message = String(e.stack || e); }
  assert.ok(!message.includes('NEVER_LOG_JWT_A'));
});
