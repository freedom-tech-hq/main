import { useBindingPersistence } from 'freedom-react-binding-persistence';
import { useMemo, useRef } from 'react';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';

import { matchesSchema } from '../internal/utils/matchesSchema.ts';
import { sessionBindingPersistence } from './binding-persistence.ts';
import { type HistoryState, historyStateArraySchema } from './types/HistoryState.ts';
import type { IHistory } from './types/IHistory.ts';

export const useCreateInMemoryHistory = (initialState?: HistoryState): IHistory => {
  const stack = useBindingPersistence(
    useBinding<HistoryState[]>(() => [], { id: 'inMemoryHistoryStack' }),
    { storage: sessionBindingPersistence, isValid: matchesSchema(historyStateArraySchema) }
  );

  const canPop = useDerivedBinding(stack, (stack) => stack.length > 1, { id: 'canPop' });
  const isEmpty = useDerivedBinding(stack, (stack) => stack.length === 0, { id: 'isEmpty' });
  const top = useBinding<HistoryState>(() => initialState ?? { path: '', search: {}, hash: '' }, { id: 'top', detectChanges: true });

  const inBatchModeCount = useRef(0);
  const updateTop = useCallbackRef(() => {
    if (inBatchModeCount.current > 0) {
      return;
    }

    const theStack = stack.get();
    const newTop = theStack[theStack.length - 1] ?? { path: '' };
    top.set({ path: newTop.path, search: newTop.search ?? {}, hash: newTop.hash ?? '' });
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
