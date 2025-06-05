import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

export type MailScreenMode = 'compose' | 'view-thread';

const MailScreenModeContext = createContext<Binding<MailScreenMode | undefined>>(
  makeBinding<MailScreenMode | undefined>(() => undefined, { id: 'mailScreenMode', detectChanges: true })
);

export interface MailScreenModeProviderProps {
  mailScreenMode: Binding<MailScreenMode | undefined>;
}

export const MailScreenModeProvider = ({ children, mailScreenMode }: MailScreenModeProviderProps & { children?: ReactNode }) => (
  <MailScreenModeContext value={mailScreenMode}>{children}</MailScreenModeContext>
);

export const useMailScreenMode = () => useContext(MailScreenModeContext);
