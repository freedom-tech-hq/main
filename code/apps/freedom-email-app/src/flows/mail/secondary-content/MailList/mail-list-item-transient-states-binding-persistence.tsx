import { InMemoryBindingPersistence } from 'freedom-react-binding-persistence';
import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';

const MailListItemTransientStatesBindingPersistenceContext = createContext<InMemoryBindingPersistence>(new InMemoryBindingPersistence());

export const MailListItemTransientStatesBindingPersistenceProvider = ({ children }: { children?: ReactNode }) => (
  <MailListItemTransientStatesBindingPersistenceContext.Provider value={new InMemoryBindingPersistence()}>
    {children}
  </MailListItemTransientStatesBindingPersistenceContext.Provider>
);

export const useMailListItemTransientStatesBindingPersistence = () => useContext(MailListItemTransientStatesBindingPersistenceContext);
