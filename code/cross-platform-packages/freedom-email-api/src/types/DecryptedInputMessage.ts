import type { ExcludedFromInputMessage } from './ApiInputMessage.ts';
import type { MailMessage } from './MailMessage.ts';

export type DecryptedInputMessage = Omit<MailMessage, ExcludedFromInputMessage>;
// Note: 'from' is not excluded, but it should be verified by the delivery server code
