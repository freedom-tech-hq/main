/** Generic cursor-based pagination response wrapper. */
export interface PaginationOutput<Item> {
  /** Returned items for the requested slice */
  items: Item[];
  /** Cursor to fetch the next slice; null when no further pages */
  nextCursor: string | null;
  /** Optional total number of items that match the query */
  total?: number;
}
