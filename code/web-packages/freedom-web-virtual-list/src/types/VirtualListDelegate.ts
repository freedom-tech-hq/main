import type { ComponentType, ReactNode } from 'react';

import type { VirtualListKeyboardDelegate } from './VirtualListKeyboardDelegate.ts';

export type VirtualListPrototypeComponentType = ComponentType;

export interface VirtualListItemPrototype {
  defaultEstimatedSizePx: number;
  /** If `true`, the size of the element is typically unknown ahead of time / different per item */
  isSizeDynamic: boolean;
  Component: VirtualListPrototypeComponentType;
}

export interface VirtualListDelegate<T, KeyT extends string, TemplateIdT extends string> extends VirtualListKeyboardDelegate {
  readonly getEstimatedSizeAtIndex?: (index: number) => number;
  readonly getTemplateIdForItemAtIndex: (index: number) => TemplateIdT;
  readonly renderItem: (key: KeyT, item: T, index: number) => ReactNode;
  readonly renderEmptyIndicator?: () => ReactNode;
  readonly renderLoadingIndicator?: () => ReactNode;
  readonly loadingIndicatorTransitionDurationMSec?: number;

  readonly itemPrototypes: Record<TemplateIdT, VirtualListItemPrototype>;
}
