import type { PFunction } from 'freedom-localization';
import { makeDefaultPFunction } from 'freedom-localization';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';

const PContext = createContext<PFunction | undefined>(undefined);

export const useP = () => {
  const { t } = useTranslation();

  const p = useContext(PContext);
  return p ?? makeDefaultPFunction(t);
};

export interface PFunctionProviderProps {
  p: PFunction;
}

export const PFunctionProvider = ({ children, p }: PFunctionProviderProps & { children: ReactNode }) => (
  <PContext.Provider value={p}>{children}</PContext.Provider>
);
