import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

import type { SelectableMailCollectionId } from '../modules/mail-types/SelectableMailCollectionId.ts';

const SelectedMailCollectionIdContext = createContext<Binding<SelectableMailCollectionId | undefined>>(
  makeBinding<SelectableMailCollectionId | undefined>(() => undefined, { id: 'selectedMailCollectionId', detectChanges: true })
);

export interface SelectedMailCollectionIdProviderProps {
  selectedMailCollectionId: Binding<SelectableMailCollectionId | undefined>;
}

export const SelectedMailCollectionIdProvider = ({
  children,
  selectedMailCollectionId
}: SelectedMailCollectionIdProviderProps & { children: ReactNode }) => (
  <SelectedMailCollectionIdContext value={selectedMailCollectionId}>{children}</SelectedMailCollectionIdContext>
);

export const useSelectedMailCollectionId = () => useContext(SelectedMailCollectionIdContext);
