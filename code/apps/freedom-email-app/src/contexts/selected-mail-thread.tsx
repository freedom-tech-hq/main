import type { ThreadLikeId } from 'freedom-email-user';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SelectedMailThreadContext = createContext<Binding<ThreadLikeId | 'initial' | 'new-mail' | undefined>>(
  makeBinding<ThreadLikeId | 'initial' | 'new-mail' | undefined>(() => 'initial', { id: 'selectedMailThreadId', detectChanges: true })
);

export interface SelectedMailThreadProviderProps {
  selectedMailThreadId: Binding<ThreadLikeId | 'initial' | 'new-mail' | undefined>;
}

export const SelectedMailThreadProvider = ({
  children,
  selectedMailThreadId
}: SelectedMailThreadProviderProps & { children?: ReactNode }) => (
  <SelectedMailThreadContext value={selectedMailThreadId}>{children}</SelectedMailThreadContext>
);

/** If the value is `'initial'`, it's the same as `undefined` except that the user didn't specifically deselect.  If the value is
 * `'new-mail'`, the user is trying to compose a new mail message. */
export const useSelectedMailThreadId = () => useContext(SelectedMailThreadContext);
