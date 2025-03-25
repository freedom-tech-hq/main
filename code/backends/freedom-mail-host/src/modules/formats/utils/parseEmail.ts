import { simpleParser } from 'mailparser';
import type { ParsedEmail, EmailAddress, EmailAttachment } from '../../../types/ParsedEmail.ts';
import { createPreview } from './createPreview.ts';

/**
 * Extracts email addresses from mailparser address objects
 *
 * @param addresses Address objects from mailparser
 * @returns Array of EmailAddress objects
 */
function extractEmailAddresses(addresses: any): EmailAddress[] {
  if (!addresses || !addresses.value) {
    return [];
  }

  return addresses.value.map((addr: any) => ({
    email: addr.address || '',
    name: addr.name || ''
  }));
}

/**
 * Convert mailparser attachments to our format
 *
 * @param attachments Attachments from mailparser
 * @returns Array of EmailAttachment objects
 */
function convertAttachments(attachments: any[]): EmailAttachment[] {
  if (!attachments || !Array.isArray(attachments)) {
    return [];
  }

  return attachments.map(att => ({
    render: {
      filename: att.filename || 'unnamed-attachment',
      contentType: att.contentType || 'application/octet-stream',
      size: att.size || 0
    },
    archive: {
      rawHeaders: att.headers || ''
    },
    content: att.content
  }));
}

/**
 * Extract raw headers as a string
 *
 * @param headerLines Header lines from mailparser
 * @returns Raw headers as a string
 */
function extractRawHeadersAsString(headerLines: ReadonlyArray<any> | null | undefined): string {
  if (!headerLines || !Array.isArray(headerLines)) {
    return '';
  }

  // TODO: Consider to get it from the raw input, instead of from the parsing output
  return headerLines.map(line => line.line).join('\n');
}

/**
 * Parse an email string into the Email type
 *
 * @param emailData Raw email data as a string
 * @returns Promise resolving to the parsed Email object
 */
export async function parseEmail(emailData: string): Promise<ParsedEmail> {
  // Parse with the 3rd party library
  const parsed = await simpleParser(emailData);

  // Convert to our custom format
  return {
    render: {
      // Note: id and timeMSec should be generated outside the parsing component
      from: extractEmailAddresses(parsed.from),
      to: extractEmailAddresses(parsed.to),
      cc: extractEmailAddresses(parsed.cc),
      bcc: extractEmailAddresses(parsed.bcc),
      subject: parsed.subject || '',
      preview: createPreview(parsed.text, parsed.html || undefined)
    },
    archive: {
      rawHeaders: extractRawHeadersAsString(parsed.headerLines)
    },
    body: parsed.text || '', // Plain text body
    htmlBody: parsed.html || '', // HTML body
    attachments: convertAttachments(parsed.attachments)
  };
}
