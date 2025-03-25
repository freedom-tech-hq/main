import striptags from 'striptags';

const MAX_LENGTH = 100;

/**
 * Creates a preview from the email body, prioritizing text content when available
 *
 * @param text Plain text email body
 * @param htmlText HTML email body
 * @returns Truncated preview string
 */
export function createPreview(
  text: string | undefined,
  htmlText: string | undefined
): string {
  // Use plain text if available, otherwise convert HTML to text
  let content = '';

  if (text && text.trim()) {
    content = text;
  } else if (htmlText) {
    // Convert HTML to plain text using striptags
    content = striptags(htmlText);
  }

  if (!content) return '';

  // Remove extra whitespace and newlines
  const cleaned = content.replace(/\s+/g, ' ').trim();

  if (cleaned.length <= MAX_LENGTH) {
    return cleaned;
  }

  return cleaned.substring(0, MAX_LENGTH) + '...';
}
