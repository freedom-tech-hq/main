import type { CollectionLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailCollectionIdContext = createContext<Binding<CollectionLikeId | 'initial' | undefined>>(
  makeBinding<CollectionLikeId | 'initial' | undefined>(() => 'initial', { id: 'selectedMailCollectionId', detectChanges: true })
);

export interface SelectedMailCollectionIdProviderProps {
  selectedMailCollectionId: Binding<CollectionLikeId | 'initial' | undefined>;
}

export const SelectedMailCollectionIdProvider = ({
  children,
  selectedMailCollectionId
}: SelectedMailCollectionIdProviderProps & { children?: ReactNode }) => (
  <SelectedMailCollectionIdContext value={selectedMailCollectionId}>{children}</SelectedMailCollectionIdContext>
);

/** If the value is `'initial'`, it's the same as `undefined` except that the user didn't specifically deselect */
export const useSelectedMailCollectionId = () => useContext(SelectedMailCollectionIdContext);
