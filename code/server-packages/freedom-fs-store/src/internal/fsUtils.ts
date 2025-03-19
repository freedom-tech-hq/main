/**
 * Utility functions for file system operations
 */

/**
 * Checks if an error is a "file not found" error (ENOENT)
 * @param error The error to check
 * @returns True if the error is an ENOENT error, false otherwise
 */
export function isFileNotFoundError(error: unknown): boolean {
  return (error as any) && (error as NodeJS.ErrnoException).code === 'ENOENT';
}
