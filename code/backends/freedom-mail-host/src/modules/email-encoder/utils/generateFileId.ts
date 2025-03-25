import { createHash } from 'node:crypto';

/**
 * Generates a file ID by creating a SHA-256 hash of the content
 *
 * @param content Content to hash
 * @returns SHA-256 hash as a hex string
 */
export function generateFileId(content: string | Buffer): string {
  const hash = createHash('sha256');
  if (content instanceof Buffer) {
    hash.update(content);
  } else {
    hash.update(Buffer.from(content));
  }
  return hash.digest('hex');
}
