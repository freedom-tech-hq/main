import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

import type { MailCollectionId } from '../modules/mail-types/MailCollectionId.ts';

const SelectedMailCollectionContext = createContext<Binding<MailCollectionId | undefined>>(
  makeBinding<MailCollectionId | undefined>(() => undefined, { id: 'selectedMailCollectionId', detectChanges: true })
);

export interface SelectedMailCollectionProviderProps {
  selectedMailCollectionId: Binding<MailCollectionId | undefined>;
}

export const SelectedMailCollectionProvider = ({
  children,
  selectedMailCollectionId
}: SelectedMailCollectionProviderProps & { children: ReactNode }) => (
  <SelectedMailCollectionContext value={selectedMailCollectionId}>{children}</SelectedMailCollectionContext>
);

export const useSelectedMailCollectionId = () => useContext(SelectedMailCollectionContext);
