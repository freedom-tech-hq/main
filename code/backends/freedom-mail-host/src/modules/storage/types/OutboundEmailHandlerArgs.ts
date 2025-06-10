import type { DbUser } from 'freedom-db';
import type { DecryptedViewMessage } from 'freedom-email-api';

// Not sure about semantics, but it has all the fields for that case so we can use clientApi.decryptViewMessage()
type DecryptedAgentMessage = DecryptedViewMessage;

export interface OutboundEmailHandlerArgs {
  user: DbUser;
  message: DecryptedAgentMessage;
}
