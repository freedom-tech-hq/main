/** Standard cursor-based pagination parameters. */
export interface PaginationInput {
  /** Opaque cursor pointing to the first item of the next slice; omit for the first page */
  cursor?: string;
  /** Maximum number of items to return; server may enforce an upper bound */
  limit?: number;
}
