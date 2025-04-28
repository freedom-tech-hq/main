import { log } from 'freedom-contexts';
import isPromise from 'is-promise';

/** Runs the specified function and returns the result.  This supports sync and async functions.  Errors are logged. */
export const inline = <ReturnT>(func: () => ReturnT) => {
  try {
    const result = func();

    if (isPromise(result)) {
      // eslint-disable-next-line no-async-promise-executor
      return new Promise(async (resolve, reject) => {
        try {
          resolve(await result);
        } catch (e) {
          log().error?.(e);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(e);
        }
      }) as ReturnT;
    } else {
      return result;
    }
  } catch (e) {
    log().error?.(e);
    throw e;
  }
};
