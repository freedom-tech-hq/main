import { afterEach, describe, it } from 'node:test';

import { makeSuccess, type PR } from 'freedom-async';
import type { BottomUpMailStorageTraversalResult } from 'freedom-email-sync';
import { addMail, traverseTimeOrganizedMailStorageFromTheBottomUp } from 'freedom-email-sync';
import { invalidateAllInMemoryCaches } from 'freedom-in-memory-cache';
import { expectDeepStrictEqual, expectOk } from 'freedom-testing-tools';

import { createEmailStoreTestStack } from '../__test_dependency__/createEmailStoreTestStack.ts';
import { createInitialSyncableStoreStructureForUser } from '../utils/createInitialSyncableStoreStructureForUser.ts';
import { getUserMailPaths } from '../utils/getUserMailPaths.ts';

describe('traverseTimeOrganizedMailStorageFromTheBottomUp', () => {
  afterEach(invalidateAllInMemoryCaches);

  it('should work with no emails', async () => {
    // Arrange
    const { trace, access } = await createEmailStoreTestStack();

    const userFs = access.userFs;
    const paths = await getUserMailPaths(userFs);

    expectOk(await createInitialSyncableStoreStructureForUser(trace, access));

    // Act
    const callOrder: string[] = [];
    expectOk(
      await traverseTimeOrganizedMailStorageFromTheBottomUp(
        trace,
        access,
        { timeOrganizedPaths: paths.storage },
        async (_trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
          callOrder.push(
            `${cursor.type}:${cursor.value.year}${cursor.value.month !== undefined ? `/${cursor.value.month}` : ''}${cursor.value.day !== undefined ? `/${cursor.value.day}` : ''}${cursor.value.hour !== undefined ? `/${cursor.value.hour}` : ''}`
          );
          return makeSuccess('inspect' as const);
        }
      )
    );

    // Assert
    expectDeepStrictEqual(callOrder, []);
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
    const callOrder: string[] = [];
    expectOk(
      await traverseTimeOrganizedMailStorageFromTheBottomUp(
        trace,
        access,
        { timeOrganizedPaths: paths.storage },
        async (_trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
          callOrder.push(
            `${cursor.type}:${cursor.value.year}${cursor.value.month !== undefined ? `/${cursor.value.month}` : ''}${cursor.value.day !== undefined ? `/${cursor.value.day}` : ''}${cursor.value.hour !== undefined ? `/${cursor.value.hour}` : ''}`
          );
          return makeSuccess('inspect' as const);
        }
      )
    );

    // Assert
    expectDeepStrictEqual(callOrder, [`year:2025`, `month:2025/1`, `day:2025/1/2`, `hour:2025/1/2/3`]);
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
    const callOrder: string[] = [];
    expectOk(
      await traverseTimeOrganizedMailStorageFromTheBottomUp(
        trace,
        access,
        { timeOrganizedPaths: paths.storage },
        async (_trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
          callOrder.push(
            `${cursor.type}:${cursor.value.year}${cursor.value.month !== undefined ? `/${cursor.value.month}` : ''}${cursor.value.day !== undefined ? `/${cursor.value.day}` : ''}${cursor.value.hour !== undefined ? `/${cursor.value.hour}` : ''}`
          );
          return makeSuccess('inspect' as const);
        }
      )
    );

    // Assert
    expectDeepStrictEqual(callOrder, [
      `year:2025`,
      `month:2025/2`,
      `day:2025/2/1`,
      `hour:2025/2/1/0`,
      `month:2025/1`,
      `day:2025/1/2`,
      `hour:2025/1/2/3`,
      `hour:2025/1/2/2`,
      `day:2025/1/1`,
      `hour:2025/1/1/0`,
      `year:2024`,
      `month:2024/1`,
      `day:2024/1/1`,
      `hour:2024/1/1/0`
    ]);
  });

  it('stopping and resuming using offset should work with multiple emails', async () => {
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
    const callOrder1: string[] = [];
    expectOk(
      await traverseTimeOrganizedMailStorageFromTheBottomUp(
        trace,
        access,
        { timeOrganizedPaths: paths.storage },
        async (_trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
          if (
            cursor.type === 'hour' &&
            cursor.value.year === 2025 &&
            cursor.value.month === 1 &&
            cursor.value.day === 2 &&
            cursor.value.hour === 3
          ) {
            return makeSuccess('stop' as const);
          }

          callOrder1.push(
            `${cursor.type}:${cursor.value.year}${cursor.value.month !== undefined ? `/${cursor.value.month}` : ''}${cursor.value.day !== undefined ? `/${cursor.value.day}` : ''}${cursor.value.hour !== undefined ? `/${cursor.value.hour}` : ''}`
          );
          return makeSuccess('inspect' as const);
        }
      )
    );

    const callOrder2: string[] = [];
    expectOk(
      await traverseTimeOrganizedMailStorageFromTheBottomUp(
        trace,
        access,
        { timeOrganizedPaths: paths.storage, offset: { year: 2025, month: 1, day: 2, hour: 3 } },
        async (_trace, cursor): PR<BottomUpMailStorageTraversalResult> => {
          callOrder2.push(
            `${cursor.type}:${cursor.value.year}${cursor.value.month !== undefined ? `/${cursor.value.month}` : ''}${cursor.value.day !== undefined ? `/${cursor.value.day}` : ''}${cursor.value.hour !== undefined ? `/${cursor.value.hour}` : ''}`
          );
          return makeSuccess('inspect' as const);
        }
      )
    );

    // Assert
    expectDeepStrictEqual(callOrder1, [`year:2025`, `month:2025/2`, `day:2025/2/1`, `hour:2025/2/1/0`, `month:2025/1`, `day:2025/1/2`]);
    expectDeepStrictEqual(callOrder2, [
      `hour:2025/1/2/3`,
      `hour:2025/1/2/2`,
      `day:2025/1/1`,
      `hour:2025/1/1/0`,
      `year:2024`,
      `month:2024/1`,
      `day:2024/1/1`,
      `hour:2024/1/1/0`
    ]);
  });
});
