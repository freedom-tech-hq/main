import { DoubleLinkedList } from 'doublell';
import type { PR, Result } from 'freedom-async';
import { makeAsyncFunc, makeAsyncResultFunc, makeFailure, makeSuccess } from 'freedom-async';
import { InternalStateError } from 'freedom-common-errors';
import type { Trace } from 'freedom-contexts';
import { makeUuid } from 'freedom-contexts';

import { DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC, DEFAULT_LOCK_TIMEOUT_MSEC } from '../consts/timeout.ts';
import type { Lock } from './Lock.ts';
import type { LockStore } from './LockStore.ts';
import type { LockToken } from './LockToken.ts';
import { lockTokenInfo } from './LockToken.ts';

export class InMemoryLockStore<KeyT extends string> implements LockStore<KeyT> {
  public readonly uid = makeUuid();

  private readonly storage_ = new Map<KeyT, { token: LockToken; onRelease: DoubleLinkedList<() => void> }>();

  constructor(_args: { _keyType?: KeyT } = {}) {}

  // LockStore Methods

  public lock(key: KeyT): Lock {
    return {
      acquire: makeAsyncResultFunc(
        [import.meta.filename, 'acquire'],
        async (
          trace: Trace,
          {
            timeoutMSec = DEFAULT_LOCK_TIMEOUT_MSEC,
            autoReleaseAfterMSec = DEFAULT_LOCK_AUTO_RELEASE_AFTER_MSEC
          }: { timeoutMSec?: number; autoReleaseAfterMSec?: number } = {}
        ): PR<LockToken, 'lock-timeout'> => {
          const found = this.storage_.get(key);
          if (found === undefined) {
            // If unlocked, immediately acquire

            const token = lockTokenInfo.make(makeUuid());
            const onRelease = new DoubleLinkedList<() => void>();
            this.handleAcquire_(trace, key, { token, onRelease, autoReleaseAfterMSec });
            return makeSuccess(token);
          } else if (timeoutMSec <= 0) {
            // If the timeout is zero or negative, immediately fail with 'lock-timeout'

            return makeFailure(new InternalStateError(trace, { message: "Lock wasn't immediately available", errorCode: 'lock-timeout' }));
          } else {
            // Otherwise, wait for the lock to be released

            return new Promise<Result<LockToken, 'lock-timeout'>>((resolve) => {
              const newOnReleaseNode = found.onRelease.append(() => {
                clearTimeout(timeout);

                const token = lockTokenInfo.make(makeUuid());
                this.handleAcquire_(trace, key, { token, onRelease: found.onRelease, autoReleaseAfterMSec });
                resolve(makeSuccess(token));
              });

              const timeout = setTimeout(() => {
                found.onRelease.remove(newOnReleaseNode);
                resolve(
                  makeFailure(
                    new InternalStateError(trace, { message: `Lock wasn't acquired within ${timeoutMSec}ms`, errorCode: 'lock-timeout' })
                  )
                );
              }, timeoutMSec);
            });
          }
        }
      ),

      release: makeAsyncResultFunc([import.meta.filename, 'release'], async (_trace: Trace, token: LockToken): PR<undefined> => {
        const found = this.storage_.get(key);
        if (found === undefined || found.token !== token) {
          return makeSuccess(undefined); // Nothing to do / wrong token (ignoring)
        }

        this.handleRelease_(key);
        return makeSuccess(undefined);
      })
    };
  }

  // Private Methods

  private readonly handleAcquire_ = makeAsyncFunc(
    [import.meta.filename, 'handleAcquire_'],
    async (
      trace: Trace,
      key: KeyT,
      {
        token,
        onRelease,
        autoReleaseAfterMSec
      }: { token: LockToken; onRelease: DoubleLinkedList<() => void>; autoReleaseAfterMSec: number }
    ) => {
      const autoReleaseTimeout = setTimeout(() => this.lock(key).release(trace, token), autoReleaseAfterMSec);

      onRelease.prepend(() => {
        clearTimeout(autoReleaseTimeout);
        this.handleRelease_(key);
      });

      this.storage_.set(key, { token, onRelease });
    }
  );

  private readonly handleRelease_ = (key: KeyT) => {
    const onRelease = this.storage_.get(key)?.onRelease;
    if (onRelease === undefined) {
      return; // Nothing to do
    }

    const head = onRelease.getHead();
    if (head !== undefined) {
      onRelease.remove(head);
      head.value();
    } else {
      this.storage_.delete(key);
    }
  };
}
