/** Metadata for a non-body MIME part. */
export interface AttachmentMeta {
  /** Unique inside the message */
  partId: string;
  /** RFC 2231 decoded file name */
  filename: string;
  /** Full type/subtype */
  mimeType: string;
  /** Encoded size in bytes */
  size: number;
  /** true ⇒ disposition=inline */
  isInline: boolean;
  /** <cid> stripped of brackets */
  contentId?: string;
  /** Pre-signed fetch URL (generated) */
  downloadUrl?: string;
}
