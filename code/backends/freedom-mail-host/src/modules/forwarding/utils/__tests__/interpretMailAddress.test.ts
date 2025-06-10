import { describe, it } from 'node:test';

import { expect } from 'expect';
import { NotFoundError } from 'freedom-common-errors';
import { makeTrace } from 'freedom-contexts';
import { expectNotOk } from 'freedom-testing-tools';

import { interpretMailAddress } from '../interpretMailAddress.ts';

describe('interpretMailAddress', () => {
  const trace = makeTrace();

  const mockConfig = {
    SMTP_OUR_DOMAINS: ['freedom.mail'],
    FORWARDING_ROUTES: {
      'aliased@freedom.mail': 'target@freedom.mail', // both are our
      'forwarded@freedom.mail': 'user@external-domain.com' // to external
    }
  };

  it('handles a typical user box', async () => {
    // Arrange
    const emailAddress = 'user@freedom.mail';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'our',
        denoted: 'user@freedom.mail',
        target: 'user@freedom.mail'
      }
    });
  });

  it('handles malformed email address', async () => {
    // Arrange
    const emailAddress = 'invalid-email';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expectNotOk(result);
    expect(result.value.errorCode).toBe('malformed-email-address');
    expect(result.value).toBeInstanceOf(NotFoundError);
    expect(result.value.message).toContain(`Malformed email address: '${emailAddress}'`);
  });

  it('normalizes email addresses with plus aliases', async () => {
    // Arrange
    const emailAddress = 'User+alias@Freedom.Mail';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'our',
        denoted: 'user@freedom.mail',
        target: 'user@freedom.mail'
      }
    });
  });

  it('handles external email addresses', async () => {
    // Arrange
    const emailAddress = 'user@external-domain.com';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'external',
        denoted: 'user@external-domain.com',
        target: 'user@external-domain.com'
      }
    });
  });

  it('handles forwarding to our domain', async () => {
    // Arrange
    const emailAddress = 'aliased@freedom.mail';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'forwarding-our',
        denoted: 'aliased@freedom.mail',
        target: 'target@freedom.mail'
      }
    });
  });

  it('handles forwarding to external domain', async () => {
    // Arrange
    const emailAddress = 'forwarded@freedom.mail';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'forwarding-external',
        denoted: 'forwarded@freedom.mail',
        target: 'user@external-domain.com'
      }
    });
  });

  it('normalizes email before checking forwarding routes', async () => {
    // Arrange
    const emailAddress = 'Forwarded+alias@Freedom.Mail';

    // Act
    const result = await interpretMailAddress(trace, emailAddress, mockConfig);

    // Assert
    expect(result).toEqual({
      ok: true,
      value: {
        type: 'forwarding-external',
        denoted: 'forwarded@freedom.mail',
        target: 'user@external-domain.com'
      }
    });
  });
});
