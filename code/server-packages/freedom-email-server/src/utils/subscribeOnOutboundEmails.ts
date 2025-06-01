import { bestEffort, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess, uncheckedResult } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { DbUser } from 'freedom-db';
import { getAllUsers, isMailSent, markMailSent } from 'freedom-db';
import { listOutboundMailIds, type MailId } from 'freedom-email-sync';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import type { OutboundEmailHandlerArgs } from '../types/OutboundEmailHandlerArgs.ts';
import { getEmailAgentSyncableStoreForUser } from './getEmailAgentSyncableStoreForUser.ts';

/**
 * Subscribes to outbound emails by polling the listOutboundMailIds function
 * for all users in the system. Will call the handler whenever new outbound
 * emails are found.
 *
 * @param trace - Trace for async operations
 * @param handler - Function to be called with the list of new mail IDs. Tracing and error handling are on the subscriber
 * @returns PR resolving to a function that can be called to stop the subscription
 */
export const subscribeOnOutboundEmails = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, handler: (trace: Trace, args: OutboundEmailHandlerArgs) => PR<undefined>): PR<() => void> => {
    let isActive = true;

    // Helper function to fetch the latest outbound emails for a specific user
    async function pollOutboundEmailsForUser(user: DbUser, syncableStore: MutableSyncableStore): Promise<void> {
      if (!isActive) {
        return;
      }

      const result = await listOutboundMailIds(trace, syncableStore, {});
      if (!result.ok) {
        // If the underlying function reports an error, we still log it, but do not suppress thrown errors
        // console.error(`Failed to retrieve outbound email IDs for user ${user.userId.replace(/\[.*/, '')}:`);
        console.error(`Failed to retrieve outbound email IDs for user ${user.userId}:`, result.value);
        return;
      }

      // Find new IDs that we haven't seen before
      const currentIds = result.value.items;
      const newIds = [] as MailId[];

      for (const id of currentIds) {
        const isSentResult = await isMailSent(trace, id);
        if (!isSentResult.ok) {
          console.error(`Failed to check mail sent status for ID: ${id}`);
          continue;
        }

        if (!isSentResult.value) {
          newIds.push(id);

          // Do not try the same email twice
          // TODO: This is dirty. In reality we should handle it smarter. Detect the outcome and report either success or bounce
          await bestEffort(trace, markMailSent(trace, id));
        } else {
          // console.log(`Skipping email ${id}`);
        }
      }

      // Call the handler with new IDs if there are any
      if (newIds.length > 0) {
        // console.log(`pollOutboundEmailsForUser: Processing an email`);
        // TODO: Revise error handling here after replacing the implementation
        try {
          const r = await handler(trace, { user, syncableStore, emailIds: newIds });
          if (!r.ok) {
            console.error(`Failed to process outbound emails for user ${user.userId}:`, r.value.errorCode, r.value.message);
          }
        } catch (e) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          console.error(`Failed to process outbound emails for user ${user.userId}:`, (e as any).errorCode, (e as any).message);
        }
      }

      // console.log(`pollOutboundEmailsForUser: Done`);
    }

    // Poll outbound emails for all users
    async function pollAllUsers(): Promise<void> {
      if (!isActive) {
        return;
      }

      const usersResult = await getAllUsers(trace);

      if (!usersResult.ok) {
        console.error('pollAllUsers: Failed to retrieve users:', usersResult.value);
        setTimeout(pollAllUsers, 1000);
        return;
      }

      const users = usersResult.value;
      // console.log(`pollAllUsers: Found ${users.length} users:\n${users.map((u) => u.email).join('\n')}`);

      // Process each user sequentially
      for (const user of users) {
        if (!isActive) {
          return;
        }
        // These are corrupted. TODO: Delete this check when the DB is restarted
        if (
          user.userId.startsWith('EMAILUSER_bbca7fed-930b-4e9e-9730-819df232a861[') ||
          user.userId.startsWith('EMAILUSER_cf1f66e7-fb51-4c06-aff1-b32ecfa500d1[')
        ) {
          // console.log(`pollAllUsers: Skipping user ${user.email}`);
          continue;
        }

        const syncableStore = await uncheckedResult(getEmailAgentSyncableStoreForUser(trace, user));

        try {
          // console.log(`Polling ${user.email} ${user.userId}`);
          await pollOutboundEmailsForUser(user, syncableStore);
        } catch (e) {
          console.error('Failed to poll outbound emails for user', user.userId, ':', e);
        }
        // console.log(`pollOutboundEmailsForUser: pollOutboundEmailsForUser is done`);
      }

      // console.log(`pollOutboundEmailsForUser: before continue, isActive=${isActive}`);
      // Continue polling if subscription is still active
      if (isActive) {
        // console.log('Renew polling');
        setTimeout(pollAllUsers, 5000);
      }
    }

    // Start the polling process
    pollAllUsers();

    // Return a function that can be used to stop the subscription
    return makeSuccess(() => {
      isActive = false;
    });
  }
);
