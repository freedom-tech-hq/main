import { describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { expectNotOk, expectOk, expectStrictEqual } from 'freedom-testing-tools';

import { encryptBufferWithPassword } from '../../encrypting/encryptBufferWithPassword.ts';
import { decryptBufferWithPassword } from '../decryptBufferWithPassword.ts';

describe('decryptBufferWithPassword', () => {
  it('should work for correct passwords', async () => {
    const trace = makeTrace('test');

    const encrypted = await encryptBufferWithPassword(trace, { buffer: Buffer.from('hello world'), password: 'this is a test' });
    expectOk(encrypted);

    const decrypted = await decryptBufferWithPassword(trace, { encryptedValue: encrypted.value, password: 'this is a test' });
    expectOk(decrypted);

    expectStrictEqual(Buffer.from(decrypted.value).toString('utf-8'), 'hello world');
  });

  it("shouldn't work for incorrect passwords", async () => {
    const trace = makeTrace('test');

    const encrypted = await encryptBufferWithPassword(trace, { buffer: Buffer.from('hello world'), password: 'this is a test' });
    expectOk(encrypted);

    const decrypted = await decryptBufferWithPassword(trace, { encryptedValue: encrypted.value, password: 'wrong password' });
    expectNotOk(decrypted);
  });
});
