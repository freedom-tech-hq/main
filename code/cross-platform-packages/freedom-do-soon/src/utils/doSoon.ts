import { callAsyncFunc, log } from 'freedom-async';
import type { Trace } from 'freedom-contexts';
import type { ServiceContext } from 'freedom-trace-service-context';

interface State {
  queueIndex: number;
  isShuttingDown: boolean;
  queue: Map<number, Promise<void>>;
}

const globalContextualState = new Map<ServiceContext, State>();

export const hasMoreToDoSoon = ({ serviceContext }: { serviceContext: ServiceContext }) => {
  const state = globalContextualState.get(serviceContext);
  if (state === undefined) {
    return false;
  }

  return state.queue.size > 0;
};

export const waitForDoSoons = async ({ shutdown = false, serviceContext }: { shutdown?: boolean; serviceContext: ServiceContext }) => {
  const state = globalContextualState.get(serviceContext);
  if (state === undefined) {
    return; // Nothing to do
  }

  /* node:coverage disable */
  if (shutdown) {
    if (!state.isShuttingDown) {
      state.isShuttingDown = true;
    }
  }
  /* node:coverage enable */

  try {
    await Promise.all(Array.from(state.queue.values()));
  } finally {
    if (state.isShuttingDown) {
      if (state.queue.size === 0) {
        globalContextualState.delete(serviceContext);
      }
    }
  }
};

/** Runs the specified function soon.  Pending results can be waited for using `waitForDoSoons` and `hasMoreToDoSoon` can be used to check
 * if waiting is needed. */
export const doSoon = (
  trace: Trace,
  func: (trace: Trace) => Promise<void> | void,
  { skipOnShutdown = false, serviceContext }: { skipOnShutdown?: boolean; serviceContext: ServiceContext }
) => {
  let state = globalContextualState.get(serviceContext);
  if (state === undefined) {
    state = {
      queueIndex: 0,
      isShuttingDown: false,
      queue: new Map<number, Promise<void>>()
    };
    globalContextualState.set(serviceContext, state);
  }

  const myQueueIndex = state.queueIndex;
  state.queueIndex += 1;

  let isComplete = false;
  const promise = new Promise<void>((resolve) => {
    setTimeout(
      () =>
        callAsyncFunc(trace, {}, async (trace) => {
          try {
            /* node:coverage disable */
            if (state.isShuttingDown && skipOnShutdown) {
              return; // Skipping
            }
            /* node:coverage enable */

            await func(trace);
          } catch (e) {
            log().error?.(trace, e);
            resolve();
          } finally {
            resolve();

            isComplete = true;
            state.queue.delete(myQueueIndex);
          }
        }),
      0
    );
  });

  if (!isComplete) {
    state.queue.set(myQueueIndex, promise);
  }
};
