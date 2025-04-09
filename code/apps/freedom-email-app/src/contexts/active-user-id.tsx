import type { EmailUserId } from 'freedom-email-sync';
import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const ActiveUserIdContext = createContext<Binding<EmailUserId | undefined>>(makeBinding(() => undefined, { id: 'activeUserId' }));

export interface ActiveUserIdProviderProps {
  activeUserId: Binding<EmailUserId | undefined>;
}

export const ActiveUserIdProvider = ({ children, activeUserId }: ActiveUserIdProviderProps & { children: ReactNode }) => (
  <ActiveUserIdContext value={activeUserId}>{children}</ActiveUserIdContext>
);

export const useActiveUserId = () => useContext(ActiveUserIdContext);
