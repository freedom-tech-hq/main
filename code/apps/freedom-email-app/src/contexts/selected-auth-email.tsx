import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedAuthEmailContext = createContext<Binding<string | undefined>>(
  makeBinding<string | undefined>(() => undefined, { id: 'selectedAuthEmailId', detectChanges: true })
);

export interface SelectedAuthEmailProviderProps {
  selectedAuthEmailId: Binding<string | undefined>;
}

export const SelectedAuthEmailProvider = ({ children, selectedAuthEmailId }: SelectedAuthEmailProviderProps & { children?: ReactNode }) => (
  <SelectedAuthEmailContext value={selectedAuthEmailId}>{children}</SelectedAuthEmailContext>
);

export const useSelectedAuthEmail = () => useContext(SelectedAuthEmailContext);
