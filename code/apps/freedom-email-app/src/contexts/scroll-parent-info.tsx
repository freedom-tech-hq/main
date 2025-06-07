import type { ReactNode } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import { makeConstBinding, type ReadonlyBinding } from 'react-bindings';

export interface ScrollParentInfo {
  insetTopPx: ReadonlyBinding<number>;
  insetBottomPx: ReadonlyBinding<number>;
  heightPx: ReadonlyBinding<number>;
  visibleHeightPx: ReadonlyBinding<number>;
}

const defaultInsetBottomPx = makeConstBinding(0, { id: 'defaultScrollParentInsetBottomPx' });
const defaultInsetTopPx = makeConstBinding(0, { id: 'defaultScrollParentInsetTopPx' });

const ScrollParentInfoContext = createContext<ScrollParentInfo>({
  heightPx: makeConstBinding(0, { id: 'defaultScrollParentHeightPx' }),
  insetBottomPx: defaultInsetBottomPx,
  insetTopPx: defaultInsetTopPx,
  visibleHeightPx: makeConstBinding(0, { id: 'defaultScrollParentVisibleHeightPx' })
});

export type ScrollParentInfoProviderProps = ScrollParentInfo;

export const ScrollParentInfoProvider = ({
  children,
  insetTopPx = defaultInsetTopPx,
  insetBottomPx = defaultInsetBottomPx,
  heightPx,
  visibleHeightPx
}: Omit<ScrollParentInfoProviderProps, 'insetBottomPx' | 'insetTopPx'> &
  Partial<Pick<ScrollParentInfoProviderProps, 'insetBottomPx' | 'insetTopPx'>> & { children?: ReactNode }) => {
  const value = useMemo(
    (): ScrollParentInfo => ({
      heightPx,
      insetBottomPx,
      insetTopPx,
      visibleHeightPx
    }),
    [heightPx, insetBottomPx, insetTopPx, visibleHeightPx]
  );

  return <ScrollParentInfoContext.Provider value={value}>{children}</ScrollParentInfoContext.Provider>;
};

export const useScrollParentInsetBottomPx = () => useContext(ScrollParentInfoContext).insetBottomPx;
export const useScrollParentInsetTopPx = () => useContext(ScrollParentInfoContext).insetTopPx;
export const useScrollParentHeightPx = () => useContext(ScrollParentInfoContext).heightPx;
export const useScrollParentVisibleHeightPx = () => useContext(ScrollParentInfoContext).visibleHeightPx;
