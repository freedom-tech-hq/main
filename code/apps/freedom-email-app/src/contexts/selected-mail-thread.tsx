import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

import type { ThreadLikeId } from '../modules/mail-types/ThreadLikeId.ts';

const SelectedMailThreadContext = createContext<Binding<ThreadLikeId | undefined>>(
  makeBinding<ThreadLikeId | undefined>(() => undefined, { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadProviderProps {
  selectedMailThreadId: Binding<ThreadLikeId | undefined>;
}

export const SelectedMailThreadProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadProviderProps & { children: ReactNode }) => (
  <SelectedMailThreadContext value={selectedMailThreadId}>{children}</SelectedMailThreadContext>
);

export const useSelectedMailThreadId = () => useContext(SelectedMailThreadContext);
