import type { ThreadLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailThreadContext = createContext<Binding<ThreadLikeId | 'initial' | undefined>>(
  makeBinding<ThreadLikeId | 'initial' | undefined>(() => 'initial', { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadProviderProps {
  selectedMailThreadId: Binding<ThreadLikeId | 'initial' | undefined>;
}

export const SelectedMailThreadProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadProviderProps & { children?: ReactNode }) => (
  <SelectedMailThreadContext value={selectedMailThreadId}>{children}</SelectedMailThreadContext>
);

/** If the value is `'initial'`, it's the same as `undefined` except that the user didn't specifically deselect */
export const useSelectedMailThreadId = () => useContext(SelectedMailThreadContext);
