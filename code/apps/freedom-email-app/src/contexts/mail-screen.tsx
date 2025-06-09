import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

export type MailScreenMode = 'compose' | 'default';

const MailScreenContext = createContext<{
  mode: Binding<MailScreenMode | undefined>;
  /** Only used for md and smaller devices */
  showPrimarySidebar: Binding<boolean>;
}>({
  mode: makeBinding<MailScreenMode | undefined>(() => undefined, { id: 'mailScreenMode', detectChanges: true }),
  showPrimarySidebar: makeBinding<boolean>(() => false, { id: 'showPrimarySidebar', detectChanges: true })
});

export interface MailScreenProviderProps {
  mode: Binding<MailScreenMode | undefined>;
  showPrimarySidebar: Binding<boolean>;
}

export const MailScreenProvider = ({ children, mode, showPrimarySidebar }: MailScreenProviderProps & { children?: ReactNode }) => {
  const value = useMemo(() => ({ mode, showPrimarySidebar }), [mode, showPrimarySidebar]);

  return <MailScreenContext value={value}>{children}</MailScreenContext>;
};

export const useMailScreen = () => useContext(MailScreenContext);
