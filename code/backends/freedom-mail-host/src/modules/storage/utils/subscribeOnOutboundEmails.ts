import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { type IsoDateTime } from 'freedom-basic-data';
import type { Trace } from 'freedom-contexts';
import { type DbMessageOut, dbQuery, type DbUser } from 'freedom-db';
import { clientApi } from 'freedom-email-api';

import type { OutboundEmailHandlerArgs } from '../types/OutboundEmailHandlerArgs.ts';
import { getMailAgentUserKeys } from './getMailAgentUserKeys.ts';

const POLLING_INTERVAL_MS = 5000; // 5 seconds
const MESSAGES_FETCH_LIMIT = 10;

/**
 * Subscribes to outbound emails by polling the 'messages' table for messages in the 'outbox' folder.
 * For each message, it loads the associated user information, calls the handler,
 * and deletes the message if processing is successful.
 *
 * @param trace - Trace for async operations
 * @param handler - Function to be called with the message data.
 * @returns PR resolving to a function that can be called to stop the subscription.
 */
export const subscribeOnOutboundEmails = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, handler: (trace: Trace, args: OutboundEmailHandlerArgs) => PR<undefined>): PR<() => void> => {
    let isActive = true;

    async function pollAgentOutboxMessages(): Promise<void> {
      if (!isActive) {
        return;
      }

      const query = `
        SELECT * FROM "messages"
        WHERE "folder" = $1
        ORDER BY "updatedAt" ASC
        LIMIT $2
      `;
      const params = ['outbox', MESSAGES_FETCH_LIMIT];
      const selectResult = await dbQuery<DbMessageOut>(query, params);

      if (selectResult.rows.length > 0) {
        console.log(`[${new Date().toISOString()}] Found ${selectResult.rows.length} messages in agent outbox.`);
      }

      for (const dbMessage of selectResult.rows) {
        if (!isActive) {
          break;
        }

        // Load the user information (we only need email address)
        const userQuery = `
          SELECT "userId", "email" FROM "users"
          WHERE "userId" = $1
          LIMIT 1
        `;
        const userResult = await dbQuery<Pick<DbUser, 'userId' | 'email'>>(userQuery, [dbMessage.userId]);

        if (userResult.rows.length === 0) {
          console.error(`[${new Date().toISOString()}] User not found for message ${dbMessage.id} with userId ${dbMessage.userId}`);
          continue;
        }

        const user = userResult.rows[0] as DbUser;

        const userKeysResult = await getMailAgentUserKeys(trace);
        if (!userKeysResult.ok) {
          console.error(`[${new Date().toISOString()}] Failed to get user keys for user ${user.userId}:`, userKeysResult.value.message);
          continue;
        }

        // Decrypt message. ViewMessage is a superset of InputMessage
        const decryptedViewMessageResult = await clientApi.decryptViewMessage(trace, userKeysResult.value, {
          ...dbMessage,
          updatedAt: dbMessage.updatedAt.toISOString() as IsoDateTime
        });
        if (!decryptedViewMessageResult.ok) {
          console.error(
            `[${new Date().toISOString()}] Failed to decrypt message ${dbMessage.id}:`,
            decryptedViewMessageResult.value.message
          );
          continue;
        }

        const result = await handler(trace, {
          user,
          message: decryptedViewMessageResult.value
        });

        if (result.ok) {
          const deleteQuery = `
            DELETE
            FROM "messages"
            WHERE "id" = $1
          `;
          await dbQuery(deleteQuery, [dbMessage.id]);
          console.log(`[${new Date().toISOString()}] Successfully processed and deleted agent message: ${dbMessage.id}`);
        } else {
          console.error(`Failed to process outbound emails for user ${user.userId}:`, result.value.errorCode, result.value.message);
          // Message remains in outbox for retry
        }
        // console.log(`pollOutboundEmailsForUser: pollOutboundEmailsForUser is done`);
      }

      // console.log(`pollOutboundEmailsForUser: before continue, isActive=${isActive}`);
      // Continue polling if subscription is still active
      if (isActive) {
        // console.log('Renew polling');
        setTimeout(pollAgentOutboxMessages, POLLING_INTERVAL_MS);
      }
    }

    // Start the polling process
    void pollAgentOutboxMessages();

    // Return a function that can be used to stop the subscription
    return makeSuccess(() => {
      isActive = false;
    });
  }
);
