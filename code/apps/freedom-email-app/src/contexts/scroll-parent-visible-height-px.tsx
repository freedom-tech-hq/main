import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { makeConstBinding, type ReadonlyBinding } from 'react-bindings';

const ScrollParentVisibleHeightPxContext = createContext<ReadonlyBinding<number> | undefined>(
  makeConstBinding(0, { id: 'defaultScrollParentVisibleHeightPx' })
);

export interface ScrollParentVisibleHeightPxProviderProps {
  value: ReadonlyBinding<number>;
}

export const ScrollParentVisibleHeightPxProvider = ({
  children,
  value
}: ScrollParentVisibleHeightPxProviderProps & { children?: ReactNode }) => (
  <ScrollParentVisibleHeightPxContext.Provider value={value}>{children}</ScrollParentVisibleHeightPxContext.Provider>
);

export const useScrollParentVisibleHeightPx = () => useContext(ScrollParentVisibleHeightPxContext);
