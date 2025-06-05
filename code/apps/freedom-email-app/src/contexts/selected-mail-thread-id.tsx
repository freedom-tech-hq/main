import type { ThreadLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailThreadIdContext = createContext<Binding<ThreadLikeId | 'initial' | undefined>>(
  makeBinding<ThreadLikeId | 'initial' | undefined>(() => 'initial', { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadIdProviderProps {
  selectedMailThreadId: Binding<ThreadLikeId | 'initial' | undefined>;
}

export const SelectedMailThreadIdProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadIdProviderProps & { children?: ReactNode }) => (
  <SelectedMailThreadIdContext value={selectedMailThreadId}>{children}</SelectedMailThreadIdContext>
);

/** If the value is `'initial'`, it's the same as `undefined` except that the user didn't specifically deselect */
export const useSelectedMailThreadId = () => useContext(SelectedMailThreadIdContext);
