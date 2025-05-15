import { DateTime } from 'luxon';

import * as config from '../../../config.ts';

export interface ForwardingHeadersParams {
  ourEmailAlias: string;
  targetEmails: string[];
  now?: number;
}

export function makeForwardingHeaders(params: ForwardingHeadersParams): string {
  const timestamp = DateTime.fromMillis(params.now ?? Date.now())
    .setZone('UTC')
    .toRFC2822();

  const headers = [
    `Received: by ${config.SMTP_HOST_NAME} for <${params.ourEmailAlias}>; ${timestamp}`,
    `X-Forwarded-To: ${params.targetEmails.join(', ')}`,
    `X-Forwarded-For: ${params.ourEmailAlias} ${params.targetEmails.join(', ')}`
  ];

  return headers.join('\r\n');
}
