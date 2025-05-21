import fs from 'node:fs/promises';
import path from 'node:path';

import type { PR } from 'freedom-async';
import { GeneralError, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';

import { getConfig } from '../../config.ts';
import { sanitizeIdForFilename, SENT_SUBDIR } from '../internal/utils/mailSendParams.ts';

export const markMailSent = makeAsyncResultFunc([import.meta.filename], async (trace, id: string): PR<undefined> => {
  const storageRootPath = getConfig('STORAGE_ROOT_PATH');
  if (storageRootPath === undefined) {
    return makeFailure(new GeneralError(trace, { message: 'STORAGE_ROOT_PATH is not configured' }));
  }
  const sanitizedId = sanitizeIdForFilename(id);

  // Make directory
  const sentDirectory = path.join(storageRootPath, SENT_SUBDIR);
  const filePath = path.join(sentDirectory, sanitizedId);
  await fs.mkdir(sentDirectory, { recursive: true });

  // Create mark file
  await fs.writeFile(filePath, '');

  return makeSuccess(undefined);
});
