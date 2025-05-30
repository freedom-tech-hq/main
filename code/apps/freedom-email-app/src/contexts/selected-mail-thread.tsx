import type { ThreadLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailThreadContext = createContext<Binding<ThreadLikeId | undefined>>(
  makeBinding<ThreadLikeId | undefined>(() => undefined, { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadProviderProps {
  selectedMailThreadId: Binding<ThreadLikeId | undefined>;
}

export const SelectedMailThreadProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadProviderProps & { children?: ReactNode }) => (
  <SelectedMailThreadContext value={selectedMailThreadId}>{children}</SelectedMailThreadContext>
);

export const useSelectedMailThreadId = () => useContext(SelectedMailThreadContext);
