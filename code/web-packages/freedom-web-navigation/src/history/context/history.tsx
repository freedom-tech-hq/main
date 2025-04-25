import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

import type { IHistory } from '../types/IHistory.ts';

const HistoryContext = createContext<IHistory | undefined>(undefined);

export const useHistory = () => {
  const output = useContext(HistoryContext);
  if (output === undefined) {
    throw new Error('HistoryProvider must be used with useHistory');
  }

  return output;
};

export interface HistoryProviderProps {
  history: IHistory;
}

export const HistoryProvider = ({ children, history }: HistoryProviderProps & { children: ReactNode }) => {
  return <HistoryContext.Provider value={history}>{children}</HistoryContext.Provider>;
};
