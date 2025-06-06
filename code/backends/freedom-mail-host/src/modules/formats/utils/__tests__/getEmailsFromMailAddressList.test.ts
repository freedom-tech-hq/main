import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { MailAddressList } from 'freedom-email-api';

import { getEmailsFromMailAddressList } from '../getEmailsFromMailAddressList.ts';

describe('getEmailsFromMailAddressList', () => {
  it('should extract email addresses from a list of MailAddress objects', () => {
    // Arrange
    const mailAddressList: MailAddressList = [
      { name: 'User 1', address: 'user1@example.com' },
      { name: 'User 2', address: 'user2@example.com' },
      { address: 'user3@example.com' } // No name
    ];

    // Act
    const emails = getEmailsFromMailAddressList(mailAddressList);

    // Assert
    assert.deepEqual(emails, ['user1@example.com', 'user2@example.com', 'user3@example.com']);
  });

  it('should extract email addresses from a list containing MailAddressGroup objects', () => {
    // Arrange
    const mailAddressList: MailAddressList = [
      { name: 'User 1', address: 'user1@example.com' },
      {
        groupName: 'Team',
        addresses: [
          { name: 'Team Member 1', address: 'team1@example.com' },
          { name: 'Team Member 2', address: 'team2@example.com' }
        ]
      }
    ];

    // Act
    const emails = getEmailsFromMailAddressList(mailAddressList);

    // Assert
    assert.deepEqual(emails, ['user1@example.com', 'team1@example.com', 'team2@example.com']);
  });

  it('should handle empty addresses and groups', () => {
    // Arrange
    const mailAddressList: MailAddressList = [
      {
        groupName: 'Empty Team',
        addresses: [] // Empty group
      }
    ];

    // Act
    const emails = getEmailsFromMailAddressList(mailAddressList);

    // Assert
    assert.deepEqual(emails, []);
  });

  it('should handle undefined input', () => {
    // Act
    const result = getEmailsFromMailAddressList(undefined);

    // Assert
    assert.deepEqual(result, []);
  });

  it('should handle mixed and complex cases', () => {
    // Arrange
    const mailAddressList: MailAddressList = [
      { name: 'User 1', address: 'user1@example.com' },
      {
        groupName: 'Team A',
        addresses: [
          { name: 'Team A Member 1', address: 'teamA1@example.com' },
          { name: 'Team A Member 2', address: 'teamA2@example.com' }
        ]
      },
      { name: 'User 2', address: 'user2@example.com' },
      {
        groupName: 'Team B',
        addresses: [{ name: 'Team B Member 1', address: 'teamB1@example.com' }]
      }
    ];

    // Act
    const emails = getEmailsFromMailAddressList(mailAddressList);

    // Assert
    assert.deepEqual(emails, ['user1@example.com', 'teamA1@example.com', 'teamA2@example.com', 'user2@example.com', 'teamB1@example.com']);
  });
});
