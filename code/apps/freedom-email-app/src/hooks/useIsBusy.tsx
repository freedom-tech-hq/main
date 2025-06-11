import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { ReadonlyBinding } from 'react-bindings';
import { useBinding, useCallbackRef, useDerivedBinding } from 'react-bindings';

export interface IsBusy extends ReadonlyBinding<boolean> {
  markBusy: () => () => void;
  busyWhile: <ReturnT>(callback: () => Promise<ReturnT>) => Promise<ReturnT>;
}

const IsBusyContext = createContext<IsBusy | undefined>(undefined);

export const IsBusyProvider = ({ children }: { children?: ReactNode }) => (
  <IsBusyContext.Provider value={useNewIsBusy()}>{children}</IsBusyContext.Provider>
);

export const useIsBusy = (): IsBusy => {
  const isBusy = useContext(IsBusyContext);
  if (isBusy === undefined) {
    throw new Error('useIsBusy must be used within an IsBusyProvider');
  }

  return isBusy;
};

// Helpers

const useNewIsBusy = (): IsBusy => {
  const isBusyCount = useBinding(() => 0, { id: 'isBusyCount', detectChanges: true });
  const isBusy = useDerivedBinding(isBusyCount, (count) => count > 0, { id: 'isBusy', limitType: 'none' }) as IsBusy;

  isBusy.markBusy = useCallbackRef(() => {
    isBusyCount.set(isBusyCount.get() + 1);

    let alreadyUnmarked = false;
    return () => {
      if (alreadyUnmarked) {
        return; // Already unmarked
      }

      alreadyUnmarked = true;

      isBusyCount.set(isBusyCount.get() - 1);
    };
  });

  isBusy.busyWhile = useCallbackRef(async <ReturnT,>(callback: () => Promise<ReturnT>): Promise<ReturnT> => {
    const unmarkBusy = isBusy.markBusy();
    try {
      return await callback();
    } finally {
      unmarkBusy();
    }
  });

  return isBusy;
};
