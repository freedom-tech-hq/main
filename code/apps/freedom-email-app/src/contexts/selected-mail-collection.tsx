import type { CollectionLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailCollectionIdContext = createContext<Binding<CollectionLikeId | undefined>>(
  makeBinding<CollectionLikeId | undefined>(() => undefined, { id: 'selectedMailCollectionId', detectChanges: true })
);

export interface SelectedMailCollectionIdProviderProps {
  selectedMailCollectionId: Binding<CollectionLikeId | undefined>;
}

export const SelectedMailCollectionIdProvider = ({
  children,
  selectedMailCollectionId
}: SelectedMailCollectionIdProviderProps & { children: ReactNode }) => (
  <SelectedMailCollectionIdContext value={selectedMailCollectionId}>{children}</SelectedMailCollectionIdContext>
);

export const useSelectedMailCollectionId = () => useContext(SelectedMailCollectionIdContext);
