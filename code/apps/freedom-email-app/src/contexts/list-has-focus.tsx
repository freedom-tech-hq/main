import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const ListHasFocusContext = createContext<Binding<boolean>>(makeBinding<boolean>(() => false, { id: 'listHasFocus', detectChanges: true }));

export interface ListHasFocusProviderProps {
  listHasFocus: Binding<boolean>;
}

export const ListHasFocusProvider = ({ children, listHasFocus }: ListHasFocusProviderProps & { children: ReactNode }) => (
  <ListHasFocusContext value={listHasFocus}>{children}</ListHasFocusContext>
);

export const useListHasFocus = () => useContext(ListHasFocusContext);
