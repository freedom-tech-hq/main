import { log } from 'freedom-contexts';

import type { PR } from '../types/PR.ts';

/**
 * Converts a `Result` into its success value.  If the value is ever not a success, logs an error and throws.
 *
 * @throws if the specified result is a failure
 */
export const uncheckedResult = async <SuccessT, ErrorCodeT extends string = never>(value: PR<SuccessT, ErrorCodeT>): Promise<SuccessT> => {
  const res = await value;
  if (!res.ok) {
    log().error?.('Throwing from unchecked', res.value);
    throw res.value;
  } else {
    return res.value;
  }
};
