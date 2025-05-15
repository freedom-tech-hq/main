import { describe, it } from 'node:test';

import { expect } from 'expect';

import { makeForwardingHeaders } from '../makeForwardingHeaders.ts';

// See real-life sample in code/dev-packages/freedom-mock-smtp-server/real-samples/forward/
describe('makeForwardingHeaders', () => {
  it('handles a typical case', async () => {
    // Act
    const result = makeForwardingHeaders({
      ourEmailAlias: 'alice@domain.com',
      targetEmails: ['a.smith@job-domain.com', 'morning@other-domain.com'],
      now: 1747053664865 // Mon, 12 May 2025 12:41:04 GMT
    });

    // Assert
    expect(result).toBe(
      [
        // TODO: Consider adding this in delivery scenarios too, not only on forwarding
        // Our server 'Received' header
        // 'smtp1.example.com' is from config.SMTP_HOST_NAME
        `Received: by smtp1.example.com for <alice@domain.com>; Mon, 12 May 2025 12:41:04 +0000`,

        // Forwarding-related headers
        'X-Forwarded-To: a.smith@job-domain.com, morning@other-domain.com',
        'X-Forwarded-For: alice@domain.com a.smith@job-domain.com, morning@other-domain.com'
      ].join('\r\n')
    );
  });
});
