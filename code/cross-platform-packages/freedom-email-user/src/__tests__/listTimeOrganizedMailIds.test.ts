import { afterEach, describe, it } from 'node:test';

import { ONE_HOUR_MSEC } from 'freedom-basic-data';
import { addMail, listTimeOrganizedMailIds } from 'freedom-email-sync';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import type { PageToken } from 'freedom-paginated-data';
import { expectOk, expectStrictEqual } from 'freedom-testing-tools';

import { createEmailStoreTestStack } from '../__test_dependency__/createEmailStoreTestStack.ts';
import { createInitialSyncableStoreStructureForUser } from '../utils/createInitialSyncableStoreStructureForUser.ts';
import { getUserMailPaths } from '../utils/getUserMailPaths.ts';

describe('listTimeOrganizedMailIds', () => {
  afterEach(invalidateAllInMemoryCaches);

  it('should work with no emails', async () => {
    // Arrange
    const { trace, access } = await createEmailStoreTestStack();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    expectOk(await createInitialSyncableStoreStructureForUser(trace, access));

    // Act
    const mailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedMailStorage: paths.storage });
    expectOk(mailIds);

    // Assert
    expectStrictEqual(mailIds.value.items.length, 0);
  });

  it('should work with single email', async () => {
    // Arrange
    const { trace, access } = await createEmailStoreTestStack();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    expectOk(await createInitialSyncableStoreStructureForUser(trace, access));

    expectOk(
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-02T03:00:00.000Z').getTime()
      })
    );

    // Act
    const mailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedMailStorage: paths.storage });
    expectOk(mailIds);

    // Assert
    expectStrictEqual(mailIds.value.items.length, 1);
  });

  it('should work with multiple emails', async () => {
    // Arrange
    const { trace, access } = await createEmailStoreTestStack();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    expectOk(await createInitialSyncableStoreStructureForUser(trace, access));

    expectOk(
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-02T03:00:00.000Z').getTime()
      })
    );
    expectOk(
      // Same year, month, day, hour
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-02T03:01:00.000Z').getTime()
      })
    );
    expectOk(
      // Same year, month, day
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-02T02:00:00.000Z').getTime()
      })
    );
    expectOk(
      // Same year, month
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-01T00:00:00.000Z').getTime()
      })
    );
    expectOk(
      // Same year
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-02-01T00:00:00.000Z').getTime()
      })
    );
    expectOk(
      // Different year
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2024-01-01T00:00:00.000Z').getTime()
      })
    );

    // Act
    const mailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedMailStorage: paths.storage });
    expectOk(mailIds);

    // Assert
    expectStrictEqual(mailIds.value.items.length, 6);
  });

  it('pagination should work with multiple emails', async () => {
    // Arrange
    const { trace, access } = await createEmailStoreTestStack();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    expectOk(await createInitialSyncableStoreStructureForUser(trace, access));

    for (let index = 0; index < 100; index += 1) {
      await addMail(trace, access, {
        from: 'test@freedomtechhq.com',
        to: ['test@freedomtechhq.com'],
        subject: 'Welcome to Freedom!',
        body: 'This is a test email',
        timeMSec: new Date('2025-01-01T00:00:00.000Z').getTime() + index * ONE_HOUR_MSEC
      });
    }

    // Act
    let pageToken: PageToken | undefined;
    let totalMailIdCount = 0;
    while (true) {
      const mailIds = await listTimeOrganizedMailIds(trace, access, { timeOrganizedMailStorage: paths.storage, pageToken });
      expectOk(mailIds);

      if (mailIds.value.nextPageToken === undefined || mailIds.value.items.length === 0) {
        break;
      }

      totalMailIdCount += mailIds.value.items.length;

      pageToken = mailIds.value.nextPageToken;
    }

    expectStrictEqual(totalMailIdCount, 100);
  });
});
