/**
 * Email metadata for storage
 */
export interface EmailMetadata {
  messageId: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  contentType: string;
  timestamp: string;
  headers: string;
}

/**
 * Email to be stored in user's vault
 */
// TODO: Revise the contract. Should include all the fields of ParsedEmail, some encoded, some not
export interface EncryptedEmail {
  metadata: EmailMetadata;
  body: string;
}
