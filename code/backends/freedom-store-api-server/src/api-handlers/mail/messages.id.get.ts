import { makeFailure, makeSuccess } from 'freedom-async';
import { InputSchemaValidationError, NotFoundError, InternalError } from 'freedom-common-errors';
import { type DbMessage, dbQuery, type MessageFolder } from 'freedom-db';
import { type EmailUserId, emailUserIdInfo, decryptedViewMessagePartSchema } from 'freedom-email-sync';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { api, type types } from 'freedom-store-api-server-api';
import { findUserByEmail, userDecryptValue, type UserKeys } from 'freedom-crypto-service';

// Helper to get userId (similar to the list handler)
function getUserIdFromAuthorizationHeader(headers: Record<string, string> | undefined): EmailUserId | undefined {
  const authorizationHeader = headers?.authorization;
  if (authorizationHeader === undefined || !authorizationHeader.startsWith('Bearer ')) {
    return undefined;
  }
  return emailUserIdInfo.parse(authorizationHeader, 7)?.value;
}

export default makeHttpApiHandler(
  [import.meta.filename],
  { api: api.mail.messages.getById }, // Use the new getById API definition
  async (
    trace,
    {
      input: {
        headers,
        pathParams: { messageId }
      }
      // auth // Assuming auth.userId is available
    }
  ) => {
    const currentUserId = getUserIdFromAuthorizationHeader(headers); // TODO: Replace with actual auth context
    if (currentUserId === undefined) {
      return makeFailure(new InputSchemaValidationError(trace, { message: 'User ID not found in auth context' }));
    }

    // Fetch user to get keys for decryption
    // Assuming currentUserId is the email for findUserByEmail, or adapt as needed.
    const userResult = await findUserByEmail(trace, currentUserId);
    if (!userResult.ok) {
      // This could be a NotFoundError or an internal error depending on findUserByEmail's contract
      return makeFailure(new NotFoundError(trace, { message: 'User not found for decryption keys', errorCode: 'user.not_found' }));
    }
    // Ensure userResult.value and userResult.value.keys exist and match UserKeys type
    const userKeys: UserKeys = userResult.value.keys; 

    const sql = `
      SELECT "id", "userId", "transferredAt", "folder", "viewMessage", "rawMessage"
      FROM "messages"
      WHERE "id" = $1 AND "userId" = $2
    `;
    
    const result = await dbQuery<Pick<DbMessage, 'id' | 'userId' | 'transferredAt' | 'folder' | 'viewMessage' | 'rawMessage'>>(sql, [messageId, currentUserId]);

    if (result.rows.length === 0) {
      return makeFailure(new NotFoundError(trace, { message: `Message with id ${messageId} not found`, errorCode: 'message.not_found' }));
    }

    const dbMsg = result.rows[0];

    const decryptedViewPartResult = await userDecryptValue(trace, {
      encryptedValue: dbMsg.viewMessage, 
      userKeys,
      schema: decryptedViewMessagePartSchema
    });

    if (!decryptedViewPartResult.ok) {
      return makeFailure(new InternalError(trace, { message: 'Failed to decrypt message content', cause: decryptedViewPartResult.error }));
    }
    const decryptedViewPart = decryptedViewPartResult.value;

    const hasAttachments = false; // TODO: Implement attachment detection

    const responseBody: types.mail.ViewMessage = {
      id: dbMsg.id,
      transferredAt: dbMsg.transferredAt.toISOString(),
      folder: dbMsg.folder as MessageFolder, // Cast to MessageFolder
      from: decryptedViewPart.from,
      to: decryptedViewPart.to,
      cc: decryptedViewPart.cc,
      onBehalf: decryptedViewPart.onBehalf,
      body: decryptedViewPart.body,
      rawMessage: dbMsg.rawMessage,
      hasAttachments
    };

    return makeSuccess({ body: responseBody });
  }
);
