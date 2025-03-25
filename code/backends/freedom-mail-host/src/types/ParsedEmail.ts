/**
 * Email address type matching frontend implementation
 */
export interface EmailAddress {
  email: string;
  name: string;
}

/**
 * Attachment metadata for list rendering
 */
export interface EmailAttachmentRenderMetadata {
  filename: string;
  contentType: string;
  size: number;
}

/**
 * Archive metadata for storing raw data
 */
export interface EmailArchiveMetadata {
  rawHeaders: string;
}

/**
 * Type for email attachments
 */
export interface EmailAttachment {
  // Metadata for rendering in lists
  render: EmailAttachmentRenderMetadata;

  // Archive data
  // Let's simplify for now - no archive
  // archive: EmailArchiveMetadata;

  // Content only loaded on demand
  content: Buffer;
}

/**
 * Email metadata for list rendering
 */
export interface EmailRenderMetadata {
  // Note: id and timeMSec should be generated outside the parsing component
  from: EmailAddress[];
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  subject: string;
  preview: string; // body excerpt
}

/**
 * Parsed email type matching frontend implementation
 */
export interface ParsedEmail {
  // Metadata for rendering in lists
  render: EmailRenderMetadata;

  // Archive data
  archive: EmailArchiveMetadata;

  // Content only loaded on demand
  body: string; // full body content
  htmlBody: string; // HTML body content
  attachments: EmailAttachment[];
}
