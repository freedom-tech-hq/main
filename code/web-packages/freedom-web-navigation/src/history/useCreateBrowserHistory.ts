import { debugTopic } from 'freedom-async';
import { useBindingPersistence } from 'freedom-react-binding-persistence';
import type { Location, Path } from 'history';
import { createBrowserHistory } from 'history';
import { isEqual } from 'lodash-es';
import { useEffect, useMemo, useRef } from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { matchesSchema } from '../internal/utils/matchesSchema.ts';
import { makeUrl } from '../utils/makeUrl.ts';
import { sessionBindingPersistence } from './binding-persistence.ts';
import { type HistoryState, historyStateArraySchema } from './types/HistoryState.ts';
import type { HistoryStateOptions } from './types/HistoryStateOptions.ts';
import type { IHistory } from './types/IHistory.ts';

export const useCreateBrowserHistory = (): IHistory => {
  const browserHistory = useMemo(() => createBrowserHistory(), []);

  const stack = useBindingPersistence(
    useBinding<HistoryState[]>(() => [], { id: 'browserHistoryStack' }),
    { storage: sessionBindingPersistence, isValid: matchesSchema(historyStateArraySchema) }
  );

  const canPop = useDerivedBinding(stack, (stack) => stack.length > 1, { id: 'canPop' });
  const isEmpty = useDerivedBinding(stack, (stack) => stack.length === 0, { id: 'isEmpty' });
  const top = useBinding<HistoryState>(() => cleanupLocation(browserHistory.location), { id: 'top', detectChanges: true });

  useEffect(() =>
    browserHistory.listen(({ location }) => {
      const cleanedUpLocation = cleanupLocation(location);
      DEV: debugTopic('NAV', (log) => log('Browser history changed to', cleanedUpLocation));
      top.set(cleanedUpLocation);
    })
  );

  const inBatchModeCount = useRef(0);
  const updateTop = useCallbackRef(() => {
    if (inBatchModeCount.current > 0) {
      return;
    }

    const theStack = stack.get();
    const newTop = theStack[theStack.length - 1] ?? { path: '' };
    const cleanedUpNewTop = { path: newTop.path, search: newTop.search ?? {}, hash: newTop.hash ?? '' };
    DEV: debugTopic('NAV', (log) => log('Stack top changed to', cleanedUpNewTop, top.getChangeUid()));
    top.set(cleanedUpNewTop);
    DEV: debugTopic('NAV', (log) => log('After change id', cleanedUpNewTop, top.getChangeUid()));

    const newHistoryEntry = makeBrowserHistoryEntry(newTop.path, { search: newTop.search, hash: newTop.hash, baseUrl: document.baseURI });
    if (
      browserHistory.location.pathname !== newHistoryEntry.pathname ||
      browserHistory.location.search !== newHistoryEntry.search ||
      browserHistory.location.hash !== newHistoryEntry.hash
    ) {
      browserHistory.replace(newHistoryEntry);
    }
  });

  return useMemo(
    (): IHistory => ({
      stack,
      canPop,
      isEmpty,
      top,
      batch: (...steps) => {
        inBatchModeCount.current += 1;
        try {
          for (const step of steps) {
            step();
          }
        } finally {
          inBatchModeCount.current -= 1;
          updateTop();
        }
      },
      clear: () => {
        stack.set([]);
        updateTop();
      },
      pop: () => {
        const theStack = [...stack.get()];
        theStack.pop();
        stack.set(theStack);
        updateTop();
      },
      push: (path, options = {}) => {
        const theStack = [...stack.get()];
        theStack.push({ path, ...options });
        stack.set(theStack);
        updateTop();
      },
      replace: (path, options = {}) => {
        const currentTop = top.get();
        if (
          currentTop.path === path &&
          (currentTop.hash ?? '') === (options.hash ?? '') &&
          isEqual(currentTop.search ?? {}, options.search ?? {})
        ) {
          return; // Nothing to do
        }

        const theStack = [...stack.get()];
        if (theStack.length === 0) {
          theStack.push({ path, ...options });
        } else {
          theStack[theStack.length - 1] = { path, ...options };
        }
        stack.set(theStack);
        updateTop();
      }
    }),
    [canPop, isEmpty, stack, top, updateTop]
  );
};

// Helpers

const cleanupLocation = (location: Location): HistoryState => ({
  path: location.pathname.replace(/^\//, ''),
  search: Array.from(new URLSearchParams(location.search).entries()).reduce((out: Record<string, string>, [key, value]) => {
    out[key] = value;
    return out;
  }, {}),
  hash: location.hash.replace(/^#/, '')
});

const makeBrowserHistoryEntry = (path: string, options: HistoryStateOptions & { baseUrl: string | URL }): Partial<Path> => {
  const url = makeUrl(path, options);

  return {
    pathname: url.pathname,
    search: url.searchParams.toString(),
    hash: url.hash
  };
};
