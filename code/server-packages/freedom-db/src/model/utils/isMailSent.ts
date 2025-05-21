import fs from 'node:fs/promises';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import { getConfig } from '../../config.ts';
import { sanitizeIdForFilename, SENT_SUBDIR } from '../internal/utils/mailSendParams.ts';

export const isMailSent = makeAsyncResultFunc([import.meta.filename], async (trace, id: string): PR<boolean> => {
  const storageRootPath = getConfig('STORAGE_ROOT_PATH');
  if (storageRootPath === undefined) {
    return makeFailure(new GeneralError(trace, { message: 'STORAGE_ROOT_PATH is not configured' }));
  }
  const sanitizedId = sanitizeIdForFilename(id);

  // Make directory
  const filePath = path.join(storageRootPath, SENT_SUBDIR, sanitizedId);

  // Test mark file
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return makeSuccess(true); // File exists
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return makeSuccess(false); // File does not exist
    }

    // For other errors (permissions, etc.)
    return makeFailure(
      new GeneralError(trace, {
        message: `Failed to check mail sent status for ID: ${id}`,
        cause: error
      })
    );
  }
});
