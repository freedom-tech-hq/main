import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import type { Binding } from 'react-bindings';
import { makeBinding } from 'react-bindings';

const SideMenuWidthContext = createContext<Binding<number>>(makeBinding<number>(() => 0, { id: 'sideMenuWidth', detectChanges: true }));

export interface SideMenuWidthProviderProps {
  sideMenuWidth: Binding<number>;
}

export const SideMenuWidthProvider = ({ children, sideMenuWidth }: SideMenuWidthProviderProps & { children?: ReactNode }) => (
  <SideMenuWidthContext value={sideMenuWidth}>{children}</SideMenuWidthContext>
);

export const useSideMenuWidth = () => useContext(SideMenuWidthContext);
