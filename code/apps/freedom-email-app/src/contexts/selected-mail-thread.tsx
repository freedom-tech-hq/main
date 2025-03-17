import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

import type { MailThreadId } from '../modules/mail-types/MailThreadId.ts';

const SelectedMailThreadContext = createContext<Binding<MailThreadId | undefined>>(
  makeBinding<MailThreadId | undefined>(() => undefined, { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadProviderProps {
  selectedMailThreadId: Binding<MailThreadId | undefined>;
}

export const SelectedMailThreadProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadProviderProps & { children: ReactNode }) => (
  <SelectedMailThreadContext value={selectedMailThreadId}>{children}</SelectedMailThreadContext>
);

export const useSelectedMailThreadId = () => useContext(SelectedMailThreadContext);
