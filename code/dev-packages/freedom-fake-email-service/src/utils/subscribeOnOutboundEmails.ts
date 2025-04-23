import { uncheckedResult } from 'freedom-async';
import { makeTrace } from 'freedom-contexts';
import type { EmailAccess } from 'freedom-email-sync';
import { listOutboundMailIds } from 'freedom-email-sync';

import type { OutboundEmailHandlerArgs } from '../types/OutboundEmailHandlerArgs.ts';
import { getAllUsers } from './getAllUsers.ts';
import { getOrCreateEmailAccessForUserPure } from './getOrCreateEmailAccessForUserPure.ts';
import type { User } from './getUserStore.ts';

/**
 * Subscribes to outbound emails by polling the listOutboundMailIds function
 * for all users in the system. Will call the handler whenever new outbound
 * emails are found.
 *
 * @param handler - Function to be called with the list of new mail IDs
 * @returns A function that can be called to stop the subscription
 */
export async function subscribeOnOutboundEmails(handler: (args: OutboundEmailHandlerArgs) => void): Promise<() => void> {
  const trace = makeTrace('freedom-fake-email-service');
  let isActive = true;

  // Track last seen IDs for each user
  const lastSeenIdsByUser = new Map<string, Set<string>>();

  // Helper function to fetch the latest outbound emails for a specific user
  async function pollOutboundEmailsForUser(user: User, access: EmailAccess): Promise<void> {
    if (!isActive) return;

    const result = await listOutboundMailIds(trace, access, {});
    if (!result.ok) {
      // If the underlying function reports an error, we still log it, but do not suppress thrown errors
      // console.error(`Failed to retrieve outbound email IDs for user ${user.userId.replace(/\[.*/, '')}:`);
      console.error(`Failed to retrieve outbound email IDs for user ${user.userId}:`, result.value);
      return;
    }

    // Get or initialize the set of last seen IDs for this user
    let lastSeenIds = lastSeenIdsByUser.get(user.userId);
    if (!lastSeenIds) {
      lastSeenIds = new Set<string>();
      lastSeenIdsByUser.set(user.userId, lastSeenIds);
    }

    // Find new IDs that we haven't seen before
    const currentIds = result.value.items;
    const newIds = currentIds.filter((id) => !lastSeenIds.has(id));

    // Update our tracking set with all current IDs
    lastSeenIdsByUser.set(user.userId, new Set([...currentIds]));

    // Call the handler with new IDs if there are any
    if (newIds.length > 0) {
      handler({ user, access, emailIds: newIds });
    }
  }

  // Poll outbound emails for all users
  async function pollAllUsers(): Promise<void> {
    if (!isActive) return;

    const usersResult = await getAllUsers(trace);

    if (!usersResult.ok) {
      console.error('Failed to retrieve users:', usersResult.value);
      setTimeout(pollAllUsers, 1000);
      return;
    }

    const users = usersResult.value;

    // Process each user sequentially
    for (const user of users) {
      if (!isActive) return;

      const access = await uncheckedResult(
        getOrCreateEmailAccessForUserPure(trace, {
          userId: user.userId,
          publicKeys: user.publicKeys,
          saltsById: { SALT_default: user.defaultSalt }
        })
      );

      await pollOutboundEmailsForUser(user, access);
    }
    // Continue polling if subscription is still active
    if (isActive) {
      setTimeout(pollAllUsers, 5000);
    }
  }

  // Start the polling process
  pollAllUsers();

  // Return a function that can be used to stop the subscription
  return () => {
    isActive = false;
  };
}
