import type { IsoDateTime } from 'freedom-basic-data';
import { type PageToken, pageTokenInfo } from 'freedom-paginated-data';

// For parsing the pageToken from the request
export interface PageTokenPayload {
  id: string;
  updatedAt: IsoDateTime;
}

// For constructing the cursor for database query
export interface DbQueryCursor {
  updatedAt: IsoDateTime;
  id: string;
}

export function decodePageToken(pageToken: PageToken | undefined): DbQueryCursor | undefined {
  if (pageToken === undefined) {
    return undefined;
  }
  try {
    const rawTokenData = pageTokenInfo.removePrefix(pageToken);
    const decodedString = Buffer.from(rawTokenData, 'base64').toString('utf-8');
    const tokenPayload = JSON.parse(decodedString) as PageTokenPayload;
    // TOOO: Schema validation
    // if (!tokenPayload.id || !tokenPayload.updatedAt) {
    //   return undefined;
    // }
    return tokenPayload;
  } catch {
    return undefined;
  }
}
