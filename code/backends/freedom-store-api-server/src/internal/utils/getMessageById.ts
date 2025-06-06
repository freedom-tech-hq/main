import type { PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import type { IsoDateTime } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import type { DbMessageOut } from 'freedom-db';
import { dbQuery } from 'freedom-db';
import type { ApiViewMessage, EmailUserId, MailId } from 'freedom-email-api';

export const getMessageById = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace, { mailId, userId }: { mailId: MailId; userId: EmailUserId }): PR<ApiViewMessage, 'not-found'> => {
    const sql = `
          SELECT "id", "userId", "updatedAt", "listFields", "viewFields"
          FROM "messages"
          WHERE "id" = $1 AND "userId" = $2
        `;

    const result = await dbQuery<Pick<DbMessageOut, 'id' | 'userId' | 'updatedAt' | 'listFields' | 'viewFields'>>(sql, [mailId, userId]);

    if (result.rows.length === 0) {
      return makeFailure(
        new NotFoundError(trace, {
          errorCode: 'not-found',
          message: `Message with id ${mailId} not found`
        })
      );
    }

    const dbMsg = result.rows[0];

    return makeSuccess({
      id: dbMsg.id,
      updatedAt: dbMsg.updatedAt.toISOString() as IsoDateTime,
      listFields: dbMsg.listFields,
      viewFields: dbMsg.viewFields
    });
  }
);
