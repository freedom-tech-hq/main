import type { EmailArchiveMetadata, EmailAttachmentRenderMetadata, EmailRenderMetadata } from './ParsedEmail.ts';

/**
 * Email metadata for storage
 */
export interface EncryptedPart<Source> {
  source: Source;

  // No extension, only the id
  // sha256 hash of the content, unless different is defined
  filename: string;

  // Data to be stored to the respective file
  payload: string;
}

/**
 * Email to be stored in user's vault (parts)
 *
 * Every destination.payload is an encrypted version of JSON.stringify(source)
 */
export interface EncryptedEmail {
  render: EncryptedPart< // filename = sha256 + '.email'
    EmailRenderMetadata & {
      receivedAt: string; // ISO 8601, to seconds
      bodyId: string; // filename of the body part
    }
  >;

  archive: EncryptedPart<EmailArchiveMetadata>;

  body: EncryptedPart<{
    body: string; // full body content
    htmlBody: string; // HTML body content
    attachments: (EmailAttachmentRenderMetadata & {
      contentId: string; // filename of attachment
    })[];
    archiveId: string; // filename of archive
  }>;

  attachments: EncryptedPart<Buffer>[];
}
