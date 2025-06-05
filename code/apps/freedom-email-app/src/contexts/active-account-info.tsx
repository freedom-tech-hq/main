import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

import type { ActiveAccountInfo } from '../types/ActiveAccountInfo.ts';

const ActiveAccountInfoContext = createContext<Binding<ActiveAccountInfo | undefined>>(
  makeBinding(() => undefined, { id: 'activeAccountInfo' })
);

export interface ActiveAccountInfoProviderProps {
  activeAccountInfo: Binding<ActiveAccountInfo | undefined>;
}

export const ActiveAccountInfoProvider = ({ children, activeAccountInfo }: ActiveAccountInfoProviderProps & { children?: ReactNode }) => (
  <ActiveAccountInfoContext value={activeAccountInfo}>{children}</ActiveAccountInfoContext>
);

export const useActiveAccountInfo = () => useContext(ActiveAccountInfoContext);
