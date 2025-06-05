import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

export type AuthScreenMode = 'sign-in' | 'add-account' | 'new-account' | 'import-credential';

const AuthScreenModeContext = createContext<Binding<AuthScreenMode | undefined>>(
  makeBinding<AuthScreenMode | undefined>(() => undefined, { id: 'authScreenMode', detectChanges: true })
);

export interface AuthScreenModeProviderProps {
  authScreenMode: Binding<AuthScreenMode | undefined>;
}

export const AuthScreenModeProvider = ({ children, authScreenMode }: AuthScreenModeProviderProps & { children?: ReactNode }) => (
  <AuthScreenModeContext value={authScreenMode}>{children}</AuthScreenModeContext>
);

export const useAuthScreenMode = () => useContext(AuthScreenModeContext);
