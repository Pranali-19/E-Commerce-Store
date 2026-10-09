import test from 'node:test';
import assert from 'node:assert/strict';

const { validateRequiredFields, validateRequest } = await import('../utils/validation.js');

test('validateRequiredFields rejects missing required values', () => {
  const result = validateRequiredFields({ name: '', email: 'test@example.com' }, ['name']);

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [{ field: 'name', message: 'name is required.' }]);
});

test('validateRequiredFields accepts valid values', () => {
  const result = validateRequiredFields({ name: 'Product', email: 'test@example.com' }, ['name']);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('validateRequest builds a consistent validation object for request payloads', () => {
  const result = validateRequest({ name: '', email: 'test@example.com' }, ['name', 'email']);

  assert.equal(result.isValid, false);
  assert.deepEqual(result.errors, [
    { field: 'name', message: 'name is required.' },
  ]);
});
