import { makeAsyncResultFunc, makeSuccess, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR } from 'freedom-async';
import type { Trace } from 'freedom-trace-logging-and-metrics';
import type { IsoDateTime } from 'freedom-basic-data';
import { Buffer } from 'node:buffer';

import { dbQuery } from '../../db/postgresClient.ts';
import type { DbMessage, MessageFolder } from '../types/DbMessage.ts';
import { CommonErrorCodes, InternalError } from 'freedom-common-errors';

export interface FindManyMessagesCursor {
  transferredAt: IsoDateTime;
  id: string;
}

export interface FindManyMessagesResult {
  items: DbMessage[];
  totalCount: number;
}

// Interface representing the raw row structure from the 'messages' table (camelCase due to quoted identifiers in SQL)
interface MessageDbRow {
  id: string;
  userId: string; // Raw userId string from DB, will be mapped to DbMessage.userId object
  transferredAt: Date; // Will be converted to IsoDateTime string
  folder: MessageFolder;
  listMessage: Buffer; // Will be converted to Uint8Array
  viewMessage: Buffer; // Will be converted to Uint8Array
  rawMessage: Buffer; // Will be converted to Uint8Array
}

export const findManyMessages = makeAsyncResultFunc(
  [import.meta.filename, 'findManyMessages'],
  async (
    trace: Trace,
    userId: string,
    folder: MessageFolder,
    limit: number,
    cursor?: FindManyMessagesCursor
  ): PR<FindManyMessagesResult, CommonErrorCodes> => {
    const params: unknown[] = [userId, folder];
    let cursorClause = '';

    if (cursor) {
      params.push(cursor.transferredAt, cursor.id);
      // For PostgreSQL, tuple comparison (a, b) < (x, y) is (a < x) OR (a = x AND b < y)
      // Note: $ indices are 1-based. $3 and $4 are cursor.transferredAt and cursor.id respectively.
      cursorClause = `AND ("transferredAt" < $${params.length - 1} OR ("transferredAt" = $${params.length - 1} AND "id" < $${params.length}))`;
    } else {
      // No cursor, simple limit
    }

    params.push(limit);
    const query = `
      SELECT "id", "userId", "transferredAt", "folder", "listMessage", "viewMessage", "rawMessage"
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2
      ${cursorClause}
      ORDER BY "transferredAt" DESC, "id" DESC
      LIMIT $${params.length} -- $1=userId (param), $2=folder (param), $3=limit OR $3=cursor.transferredAt, $4=cursor.id, $5=limit
    `;

    const countQuery = `
      SELECT COUNT(*) as total_count
      FROM "messages"
      WHERE "userId" = $1 AND "folder" = $2
    `;

    try {
      const [result, countResult] = await Promise.all([
        dbQuery<MessageDbRow>(query, params),
        dbQuery<{ total_count: string | number }>(countQuery, [userId, folder])
      ]);

      const items: DbMessage[] = result.rows.map((row: MessageDbRow): DbMessage => ({
        id: row.id,
        userId: { id: row.userId, type: 'email' }, // Assuming type is always 'email' as per emailUserIdInfo
        transferredAt: row.transferredAt.toISOString() as IsoDateTime,
        folder: row.folder,
        listMessage: new Uint8Array(row.listMessage),
        viewMessage: new Uint8Array(row.viewMessage),
        rawMessage: new Uint8Array(row.rawMessage)
      }));
      
      const totalCount = parseInt(countResult.rows[0]?.total_count?.toString() ?? '0', 10);

      return makeSuccess({ items, totalCount });
    } catch (error) {
      return makeFailure(
        new InternalError(trace, {
          message: 'Failed to retrieve messages from database',
          cause: error
        })
      ); 
    }
  }
);
