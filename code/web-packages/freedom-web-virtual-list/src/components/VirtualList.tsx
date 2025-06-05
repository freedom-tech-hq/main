import { Collapse, Stack } from '@mui/material';
import { objectEntries, objectKeys, objectValues } from 'freedom-cast';
import { makeUuid } from 'freedom-contexts';
import type { DataSource, IsDataSourceLoading } from 'freedom-data-source';
import { ANIMATION_DURATION_MSEC, TARGET_FPS_MSEC } from 'freedom-web-animation';
import { ResizeObservingDiv } from 'freedom-web-resize-observer';
import { noop } from 'lodash-es';
import type { ReactNode } from 'react';
import React, { useEffect, useMemo, useRef } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { makeStringSubtypeArray } from 'yaschema';

import { ListHasFocusProvider } from '../context/list-has-focus.tsx';
import { GlobalVirtualListStyles } from '../internal/components/GlobalVirtualListStyles.tsx';
import { DEFAULT_MIN_OVERSCAN_AMOUNT_PX, DEFAULT_OVERSCAN_NUM_ITEMS } from '../internal/consts/overscan.ts';
import { doRangesIntersect } from '../internal/utils/doRangesIntersect.ts';
import type { VirtualListControls } from '../types/VirtualListControls.ts';
import type { VirtualListDelegate } from '../types/VirtualListDelegate.ts';

const itemStates = makeStringSubtypeArray('add', 'remove', 'move');
type ItemState = (typeof itemStates)[0];

export interface VirtualListProps<T, KeyT extends string, TemplateIdT extends string> {
  dataSource: DataSource<T, KeyT>;
  delegate: VirtualListDelegate<T, KeyT, TemplateIdT>;

  // TODO: support horizontal
  /** @defaultValue `'vertical'` */
  direction?: 'vertical';

  scrollParent: HTMLElement | string | Window;

  /**
   * The number of px above or below the visible area to render content for
   *
   * @defaultValue `max(DEFAULT_MIN_OVERSCAN_AMOUNT_PX, max of all item prototype defaultEstimatedSizePx * DEFAULT_OVERSCAN_NUM_ITEMS)`
   */
  overscanAmountPx?: number;

  controls?: VirtualListControls<KeyT>;

  /** @defaultValue `true`  */
  isFocusable?: boolean;
}

export const VirtualList = <T, KeyT extends string, TemplateIdT extends string>({
  dataSource,
  delegate,
  scrollParent,
  overscanAmountPx,
  controls,
  isFocusable = true
}: VirtualListProps<T, KeyT, TemplateIdT>) => {
  const uuid = useMemo(() => makeUuid(), []);

  const isEmpty = useBinding(() => dataSource.getNumItems() === 0, { id: 'isEmpty', detectChanges: true, deps: [dataSource] });
  const showLoadingIndicator = useBinding(() => dataSource.isLoading(), {
    id: 'showLoadingIndicator',
    detectChanges: true,
    deps: [dataSource]
  });
  const delayedShowLoadingIndicator = useDerivedBinding(showLoadingIndicator, (show) => show, {
    id: 'delayedShowLoadingIndicator',
    limitMSec: delegate.loadingIndicatorTransitionDurationMSec ?? ANIMATION_DURATION_MSEC
  });

  const prototypeSizes = useBinding<Record<TemplateIdT, number>>(
    () => {
      const out: Partial<Record<TemplateIdT, number>> = {};

      for (const templateId of objectKeys(delegate.itemPrototypes)) {
        out[templateId] = delegate.itemPrototypes[templateId].defaultEstimatedSizePx;
      }

      return out as Record<TemplateIdT, number>;
    },
    { id: 'prototypeSizes' }
  );

  const computedOverscanAmountPx = useDerivedBinding(
    overscanAmountPx === undefined ? prototypeSizes : undefined,
    () => {
      if (overscanAmountPx !== undefined) {
        return overscanAmountPx;
      }

      const maxPrototypeSize = Math.max(...objectValues(prototypeSizes.get()));
      return Math.max(DEFAULT_MIN_OVERSCAN_AMOUNT_PX, maxPrototypeSize * DEFAULT_OVERSCAN_NUM_ITEMS);
    },
    { id: 'computedOverscanAmountPx' }
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingClear = useMemo<{ current: boolean }>(() => ({ current: true }), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearTimeMSec = useMemo<{ current: number | undefined }>(() => ({ current: undefined }), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingStatesByKey = useMemo<Map<KeyT, ItemState>>(() => new Map(), [dataSource]);
  const timeMSecByKeyByItemState = useMemo<Record<ItemState, Map<KeyT, number>>>(
    () => ({ add: new Map(), move: new Map(), remove: new Map() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource]
  );

  const addStateForKey = useCallbackRef((key: KeyT, state: ItemState) => {
    pendingStatesByKey.set(key, state);

    for (const possibleState of itemStates) {
      timeMSecByKeyByItemState[possibleState].delete(key);
    }

    removingItems.delete(key);
  });

  /** The current size for each item.  Sizes are marked with a boolean indicating whether the size is an estimate or measured size.
   * Measured sizes are more authoritative */
  const itemSizes = useBinding(
    () => {
      const out: Array<[isMeasured: boolean, size: number]> = [];

      // Initializing with estimated sizes
      const numItems = dataSource.getNumItems();
      for (let itemIndex = 0; itemIndex < numItems; itemIndex += 1) {
        const key = dataSource.getKeyForItemAtIndex(itemIndex);
        const templateId = delegate.getTemplateIdForItemAtIndex(itemIndex);
        out[itemIndex] = [false, prototypeSizes[templateId]];
        addStateForKey(key, 'add');
      }

      return out;
    },
    { id: 'itemSizes', deps: [dataSource] }
  );

  // When the size of a prototype changes, updating sizes for items that only have estimated sizes (and not measured sizes)
  useBindingEffect(
    prototypeSizes,
    (prototypeSizes) => {
      const currentItemsSizes = itemSizes.get();

      let didChange = false;

      for (const [itemIndex, [isMeasured, currentItemSize]] of currentItemsSizes.entries()) {
        if (isMeasured) {
          continue;
        }

        const templateId = delegate.getTemplateIdForItemAtIndex(itemIndex);
        const newSize = prototypeSizes[templateId];
        if (newSize === currentItemSize) {
          continue;
        }

        currentItemsSizes[itemIndex] = [false, newSize];
        didChange = true;
      }

      if (didChange) {
        itemSizes.set(currentItemsSizes);
      }
    },
    { triggerOnMount: true }
  );

  const totalSize = useDerivedBinding(
    itemSizes,
    (itemSizes) => {
      let sum = 0;

      for (const itemSize of itemSizes) {
        sum += itemSize[1];
      }

      return sum;
    },
    {
      id: 'totalSize',
      detectInputChanges: false,
      deps: [dataSource]
    }
  );

  const visibleRangePx = useBinding((): [startPx: number, endPx: number] => [0, 0], {
    id: 'visibleRangePx',
    detectChanges: true,
    deps: [dataSource]
  });
  const visibleRangeIndices = useDerivedBinding(
    { visibleRangePx, itemSizes },
    ({ visibleRangePx, itemSizes }): [startIndex: number, endIndex: number, startItemOffset: number] => {
      let firstVisibleIndex: number | undefined;
      let firstVisibleItemOffset: number | undefined;
      let lastVisibleIndex: number | undefined;

      let currentItemOffset = 0;
      for (const [itemIndex, [_isMeasured, currentItemSize]] of itemSizes.entries()) {
        const isItemVisible = doRangesIntersect([currentItemOffset, currentItemOffset + currentItemSize], visibleRangePx);
        if (isItemVisible) {
          if (firstVisibleIndex === undefined) {
            firstVisibleIndex = itemIndex;
            firstVisibleItemOffset = currentItemOffset;
          }

          lastVisibleIndex = itemIndex;
        } else if (lastVisibleIndex !== undefined) {
          break;
        }

        currentItemOffset += currentItemSize;
      }

      return [firstVisibleIndex ?? 0, lastVisibleIndex !== undefined ? lastVisibleIndex + 1 : 0, firstVisibleItemOffset ?? 0];
    },
    { id: 'visibleRangeIndices', detectInputChanges: false, deps: [dataSource], limitType: 'none' }
  );

  const onPrototypeResize = useCallbackRef((_width: number, height: number, templateId: TemplateIdT) => {
    const currentPrototypeSizes = prototypeSizes.get();
    if (currentPrototypeSizes[templateId] === height) {
      return;
    }

    currentPrototypeSizes[templateId] = height;

    prototypeSizes.set(currentPrototypeSizes);
  });

  const onItemResize = useCallbackRef((_width: number, height: number, itemIndex: number) => {
    const currentItemSizes = itemSizes.get();
    const currentItemSize = currentItemSizes[itemIndex];
    if (currentItemSize === undefined || height === 0) {
      // This can happen because DOM updates are delayed slightly from model updates
      return;
    }

    if (currentItemSize[0] === false || currentItemSize[1] !== height) {
      currentItemSizes[itemIndex] = [true, height];
      itemSizes.set(currentItemSizes);
    }
  });

  /** Used when renderItems should be triggered immediately, without debouncing.  We need lastRenderedItemsByItemIndex to be updated after
   * each onItems… function, otherwise, for example, deleting index 1 and then index 2 would lead to out of sync use of
   * lastRenderedItemsByItemIndex.  We could have manually renumbered the lastRenderedItemsByItemIndex immediately instead, but this would
   * have made the code a bit more complex and since this is only for data changes, isn't frequent enough to optimize for.
   */
  const forceRenderCount = useBinding(() => 0, { id: 'forceRenderCount' });
  /** Used when renderItems should be triggered eventually, with debouncing */
  const debouncedForceRenderCount = useBinding(() => 0, { id: 'debouncedForceRenderCount' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastRenderedItemsByItemIndex = useMemo<Map<number, [KeyT, ReactNode, topPx: number]>>(() => new Map(), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removingItems = useMemo<Map<KeyT, [ReactNode, topPx: number]>>(() => new Map(), [dataSource]);

  const renderedItems = useDerivedBinding(
    forceRenderCount,
    (): ReactNode[] => {
      const currentItemSizes = itemSizes.get();

      const theVisibleRangeIndices = visibleRangeIndices.get();

      const offsetsByItemIndex: Record<number, number> = {};
      let currentItemOffset = theVisibleRangeIndices[2];
      for (let itemIndex = theVisibleRangeIndices[0]; itemIndex < theVisibleRangeIndices[1]; itemIndex += 1) {
        offsetsByItemIndex[itemIndex] = currentItemOffset;

        const itemSize = currentItemSizes[itemIndex][1];
        currentItemOffset += itemSize;
      }

      const out: Array<[key: KeyT, renderedItem: ReactNode]> = [];

      // Set times for pending changes (because we want these to be coordinated with React render cycles)
      const now = Date.now();
      let hadAnyPendingChanges = false;

      if (pendingClear.current) {
        pendingClear.current = false;
        clearTimeMSec.current = now + ANIMATION_DURATION_MSEC;
        hadAnyPendingChanges = true;
      }

      const isInitializing = clearTimeMSec.current !== undefined;
      for (const [key, pendingState] of pendingStatesByKey.entries()) {
        if (!isInitializing) {
          hadAnyPendingChanges = true;

          timeMSecByKeyByItemState[pendingState].set(key, now + ANIMATION_DURATION_MSEC);
        }
      }
      pendingStatesByKey.clear();

      // Removing expired temporary state tracking
      if (clearTimeMSec.current !== undefined && now >= clearTimeMSec.current) {
        clearTimeMSec.current = undefined;
      }
      for (const itemState of itemStates) {
        const timeMSecByKey = timeMSecByKeyByItemState[itemState];

        const keysToDeleteFromTimeMSecByKey: KeyT[] = [];
        for (const [key, timeMSec] of timeMSecByKey.entries()) {
          if (now >= timeMSec) {
            keysToDeleteFromTimeMSecByKey.push(key);
            if (itemState === 'remove') {
              removingItems.delete(key);
            }
          }
        }

        for (const key of keysToDeleteFromTimeMSecByKey) {
          timeMSecByKey.delete(key);
        }
      }

      lastRenderedItemsByItemIndex.clear();

      const needsAnimatedTopsForExistingItems =
        !isInitializing &&
        (timeMSecByKeyByItemState.add.size > 0 || timeMSecByKeyByItemState.move.size > 0 || timeMSecByKeyByItemState.remove.size > 0);

      for (let itemIndex = theVisibleRangeIndices[0]; itemIndex < theVisibleRangeIndices[1]; itemIndex += 1) {
        const key = dataSource.getKeyForItemAtIndex(itemIndex);
        const item = dataSource.getItemAtIndex(itemIndex);
        const templateId = delegate.getTemplateIdForItemAtIndex(itemIndex);

        const topPx = offsetsByItemIndex[itemIndex];
        const isNewItem = !isInitializing && timeMSecByKeyByItemState.add.get(key) !== undefined;
        const isExistingItem = !isInitializing && !isNewItem;
        const isMovingItem = !isInitializing && timeMSecByKeyByItemState.move.get(key) !== undefined;

        const hasMeasuredSize = currentItemSizes[itemIndex][0];
        const shouldBeVisible = itemIndex === 0 || hasMeasuredSize || !delegate.itemPrototypes[templateId].isSizeDynamic;
        const renderedItem = delegate.renderItem(key, item, itemIndex);
        const wrappedRenderedItem = (
          <ResizeObservingDiv
            key={key}
            id={`${uuid}-${key}`}
            className={`VirtualList-item ${isNewItem ? 'fade-in' : ''} ${isExistingItem && needsAnimatedTopsForExistingItems ? 'animated-top' : ''} ${isMovingItem ? 'moving' : ''}`}
            style={{ top: `${topPx}px`, visibility: shouldBeVisible ? 'visible' : 'hidden' }}
            tag={itemIndex}
            onResize={onItemResize}
          >
            {renderedItem}
          </ResizeObservingDiv>
        );

        out.push([key, wrappedRenderedItem]);

        lastRenderedItemsByItemIndex.set(itemIndex, [key, renderedItem, topPx]);
      }

      // Adding the items that are being removed
      if (!isInitializing) {
        for (const [key, [renderedItem, topPx]] of removingItems.entries()) {
          const wrappedRenderedItem = (
            <ResizeObservingDiv
              key={key}
              id={`${uuid}-${key}`}
              className="VirtualList-item fade-out"
              style={{ top: `${topPx}px` }}
              tag={undefined}
              onResize={noop}
            >
              {renderedItem}
            </ResizeObservingDiv>
          );

          out.push([key, wrappedRenderedItem]);
        }
      }

      // Keeping the items sorted consistently
      out.sort((a, b) => a[0].localeCompare(b[0]));

      if (hadAnyPendingChanges) {
        setTimeout(() => debouncedForceRenderCount.set(debouncedForceRenderCount.get() + 1), ANIMATION_DURATION_MSEC);
      }

      return out.map(([_key, node]) => node);
    },
    { id: 'renderedItems', detectOutputChanges: false, deps: [dataSource], limitType: 'none' }
  );

  useBindingEffect(debouncedForceRenderCount, () => forceRenderCount.set(forceRenderCount.get() + 1));
  useBindingEffect(visibleRangeIndices, () => debouncedForceRenderCount.set(debouncedForceRenderCount.get() + 1));

  // If the item sizes have changed, update the positions of the rendered items
  useBindingEffect(
    itemSizes,
    (itemSizes) => {
      const theVisibleRangeIndices = visibleRangeIndices.get();

      const offsetsByItemIndex: Record<number, number> = {};
      let currentItemOffset = 0;
      for (const [itemIndex, [_isMeasured, currentItemSize]] of itemSizes.entries()) {
        offsetsByItemIndex[itemIndex] = currentItemOffset;
        currentItemOffset += currentItemSize;
      }

      for (let itemIndex = theVisibleRangeIndices[0]; itemIndex < theVisibleRangeIndices[1]; itemIndex += 1) {
        const key = dataSource.getKeyForItemAtIndex(itemIndex);
        const templateId = delegate.getTemplateIdForItemAtIndex(itemIndex);
        const elem = document.getElementById(`${uuid}-${key}`);
        if (elem === null) {
          continue;
        }

        elem.style.top = `${offsetsByItemIndex[itemIndex]}px`;

        const hasMeasuredSize = itemSizes[itemIndex][0];
        const shouldBeVisible = hasMeasuredSize || !delegate.itemPrototypes[templateId].isSizeDynamic;
        elem.style.visibility = shouldBeVisible ? 'visible' : 'hidden';
      }
    },
    { triggerOnMount: true, deps: [dataSource] }
  );

  const makeOnVisibleRangeChange = useCallbackRef(() => {
    const scrollParentElem = typeof scrollParent === 'string' ? document.getElementById(scrollParent) : scrollParent;
    if (scrollParentElem === null) {
      console.error('No scroll parent found for VirtualList', uuid);
      return;
    }

    const listElem = document.getElementById(uuid);
    if (listElem === null) {
      console.error('No element found for VirtualList', uuid);
      return;
    }

    return () => {
      const elemRect = listElem.getBoundingClientRect();
      const currentTotalSize = totalSize.get();

      let top: number;
      let bottom: number;
      if (scrollParentElem instanceof Window) {
        top = Math.max(elemRect.top, 0);
        bottom = Math.min(elemRect.top + currentTotalSize, window.innerHeight);
      } else {
        const scrollParentRect = scrollParentElem.getBoundingClientRect();

        top = Math.max(elemRect.top, scrollParentRect.top);
        bottom = Math.min(elemRect.top + currentTotalSize, scrollParentRect.bottom);
      }

      const overscanAmountPx = computedOverscanAmountPx.get();
      visibleRangePx.set([
        Math.max(0, top - elemRect.top - overscanAmountPx),
        Math.min(currentTotalSize, bottom - elemRect.top + 1 + overscanAmountPx)
      ]);
    };
  });

  useBindingEffect(totalSize, () => makeOnVisibleRangeChange()?.(), { triggerOnMount: true, deps: [dataSource] });

  const onItemsAdded = useCallbackRef(({ indices }: { indices: number[] }) => {
    const currentPrototypeSizes = prototypeSizes.get();

    const currentItemSizes = itemSizes.get();
    for (const index of indices.sort((a, b) => b - a)) {
      const templateId = delegate.getTemplateIdForItemAtIndex(index);
      const newItemSize = currentPrototypeSizes[templateId];
      currentItemSizes.splice(index, 0, [false, newItemSize]);

      const key = dataSource.getKeyForItemAtIndex(index);
      addStateForKey(key, 'add');
    }

    itemSizes.set(currentItemSizes);

    makeOnVisibleRangeChange()?.();
    forceRenderCount.set(forceRenderCount.get() + 1);

    isEmpty.set(dataSource.getNumItems() === 0);
  });

  const onItemsCleared = useCallbackRef(() => {
    if (itemSizes.get().length === 0) {
      return; // Nothing to do
    }

    pendingClear.current = true;

    itemSizes.set([]);

    makeOnVisibleRangeChange()?.();
    forceRenderCount.set(forceRenderCount.get() + 1);

    isEmpty.set(true);
  });

  const onItemsMoved = useCallbackRef(({ indices }: { indices: Array<[from: number, to: number]> }) => {
    const currentItemSizes = itemSizes.get();
    for (const [fromIndex, toIndex] of indices) {
      if (fromIndex === toIndex) {
        continue;
      }

      const removed = currentItemSizes.splice(fromIndex, 1);
      currentItemSizes.splice(toIndex, 0, ...removed);

      const rendered = lastRenderedItemsByItemIndex.get(fromIndex);
      if (rendered !== undefined) {
        const [key, _renderedItem] = rendered;
        addStateForKey(key, 'move');
      }
    }

    itemSizes.set(currentItemSizes);

    makeOnVisibleRangeChange()?.();
    forceRenderCount.set(forceRenderCount.get() + 1);
  });

  const onItemsRemoved = useCallbackRef(({ indices }: { indices: number[] }) => {
    const currentItemSizes = itemSizes.get();
    for (const index of indices.sort((a, b) => b - a)) {
      const rendered = lastRenderedItemsByItemIndex.get(index);
      if (rendered !== undefined) {
        const [key, renderedItem, topPx] = rendered;
        addStateForKey(key, 'remove');
        removingItems.set(key, [renderedItem, topPx]);
      }

      currentItemSizes.splice(index, 1);
    }

    itemSizes.set(currentItemSizes);

    makeOnVisibleRangeChange()?.();
    forceRenderCount.set(forceRenderCount.get() + 1);

    isEmpty.set(dataSource.getNumItems() === 0);
  });

  const onItemsUpdated = useCallbackRef(({ indices }: { indices: number[] }) => {
    const currentPrototypeSizes = prototypeSizes.get();

    const currentItemSizes = itemSizes.get();
    for (const index of indices.sort((a, b) => b - a)) {
      const newKey = dataSource.getKeyForItemAtIndex(index);
      const rendered = lastRenderedItemsByItemIndex.get(index);
      if (rendered !== undefined) {
        const [oldKey, renderedItem, topPx] = rendered;
        if (oldKey !== newKey) {
          addStateForKey(oldKey, 'remove');
          removingItems.set(oldKey, [renderedItem, topPx]);
          addStateForKey(newKey, 'add');
        }
      }

      const templateId = delegate.getTemplateIdForItemAtIndex(index);
      const newItemSize = currentPrototypeSizes[templateId];
      currentItemSizes.splice(index, 1, [false, newItemSize]);
    }

    itemSizes.set(currentItemSizes);

    makeOnVisibleRangeChange()?.();
    forceRenderCount.set(forceRenderCount.get() + 1);
  });

  const onLoadingStateChanged = useCallbackRef(({ isLoading }: { isLoading: IsDataSourceLoading }) => {
    showLoadingIndicator.set(isLoading);
  });

  useEffect(() => {
    const scrollParentElem = typeof scrollParent === 'string' ? document.getElementById(scrollParent) : scrollParent;
    if (scrollParentElem === null) {
      console.error('No scroll parent found for VirtualList', uuid);
      return;
    }

    const listElem = document.getElementById(uuid);
    if (listElem === null) {
      console.error('No element found for VirtualList', uuid);
      return;
    }

    const onVisibleRangeChange = makeOnVisibleRangeChange();
    if (onVisibleRangeChange === undefined) {
      return;
    }
    onVisibleRangeChange();

    const listenerRemovers: Array<() => void> = [];
    listenerRemovers.push(dataSource.addListener('itemsAdded', onItemsAdded));
    listenerRemovers.push(dataSource.addListener('itemsCleared', onItemsCleared));
    listenerRemovers.push(dataSource.addListener('itemsMoved', onItemsMoved));
    listenerRemovers.push(dataSource.addListener('itemsRemoved', onItemsRemoved));
    listenerRemovers.push(dataSource.addListener('itemsUpdated', onItemsUpdated));
    listenerRemovers.push(dataSource.addListener('loadingStateChanged', onLoadingStateChanged));

    (window.visualViewport ?? window).addEventListener('resize', onVisibleRangeChange);
    scrollParentElem.addEventListener('scroll', onVisibleRangeChange);

    return () => {
      scrollParentElem.removeEventListener('scroll', onVisibleRangeChange);
      (window.visualViewport ?? window).removeEventListener('resize', onVisibleRangeChange);

      for (const listenerRemover of listenerRemovers) {
        listenerRemover();
      }
    };
  }, [
    dataSource,
    makeOnVisibleRangeChange,
    onItemsAdded,
    onItemsCleared,
    onItemsMoved,
    onItemsRemoved,
    onItemsUpdated,
    onLoadingStateChanged,
    scrollParent,
    uuid
  ]);

  useBindingEffect(
    totalSize,
    (totalSize) => {
      const elem = document.getElementById(`${uuid}-rendered-items`);
      if (elem === null) {
        return;
      }

      elem.style.height = `${totalSize}px`;
    },
    { triggerOnMount: true, deps: [dataSource], limitMSec: TARGET_FPS_MSEC }
  );

  const hasFocus = useBinding(() => isFocusable && document.activeElement?.id === uuid, { id: 'hasFocus', detectChanges: true });
  const delayedHasFocus = useDerivedBinding(hasFocus, (hasFocus) => hasFocus, {
    id: 'delayedHasFocus',
    limitMSec: ANIMATION_DURATION_MSEC
  });

  const focus = useCallbackRef(() => isFocusable && document.getElementById(uuid)?.focus());

  const cancelLastScroll = useRef<(() => void) | undefined>(undefined);
  const scrollToItemWithKey = useCallbackRef((key: KeyT) => {
    cancelLastScroll.current?.();

    const index = dataSource.getIndexOfItemWithKey(key);
    if (index < 0) {
      return;
    }

    const scrollParentElem = typeof scrollParent === 'string' ? document.getElementById(scrollParent) : scrollParent;
    if (scrollParentElem === null) {
      return;
    }

    const scrollPositionMarkerElem = document.getElementById(`${uuid}-scroll-position-marker`);
    if (scrollPositionMarkerElem === null) {
      return;
    }

    const currentItemSizes = itemSizes.get();

    let itemOffset = 0;
    let itemHeight = 0;
    for (const [itemIndex, [_isMeasured, currentItemSize]] of currentItemSizes.entries()) {
      if (itemIndex === index) {
        itemHeight = currentItemSize;
        break;
      }
      itemOffset += currentItemSize;
    }

    scrollPositionMarkerElem.style.top = `${itemOffset}px`;
    scrollPositionMarkerElem.style.height = `${itemHeight}px`;

    const animationFrame = window.requestAnimationFrame(() => {
      scrollPositionMarkerElem.scrollIntoView({ behavior: 'instant', block: 'nearest' });

      // 600ms is the maximum amount of time any mainstream browser should take to scroll to an element
      const timeout = setTimeout(() => (scrollPositionMarkerElem.style.height = '0'), 600);
      cancelLastScroll.current = () => {
        scrollPositionMarkerElem.style.height = '0';
        clearTimeout(timeout);
        cancelLastScroll.current = undefined;
      };
    });
    cancelLastScroll.current = () => {
      scrollPositionMarkerElem.style.height = '0';
      window.cancelAnimationFrame(animationFrame);
      cancelLastScroll.current = undefined;
    };
  });

  if (controls !== undefined) {
    controls.hasFocus = delayedHasFocus.get;
    controls.focus = focus;
    controls.scrollToItemWithKey = scrollToItemWithKey;
  }

  const lastContainerSize = useRef<number | undefined>(undefined);
  const onContainerResize = useCallbackRef((width: number, _height: number) => {
    if (lastContainerSize.current === width) {
      return;
    }

    if (lastContainerSize.current !== undefined) {
      makeOnVisibleRangeChange()?.();
      debouncedForceRenderCount.set(debouncedForceRenderCount.get() + 1);
    }
    lastContainerSize.current = width;
  });

  return (
    <Stack>
      <GlobalVirtualListStyles />
      <ListHasFocusProvider listHasFocus={hasFocus}>
        <ResizeObservingDiv
          id={uuid}
          className="VirtualList"
          tabIndex={isFocusable ? 0 : undefined}
          onFocus={isFocusable ? hasFocus.reset : undefined}
          onBlur={isFocusable ? hasFocus.reset : undefined}
          onClick={isFocusable ? focus : undefined}
          onKeyDown={isFocusable ? delegate.onKeyDown : undefined}
          tag={undefined}
          onResize={onContainerResize}
        >
          {/* Rendering Prototypes to Observe Size Changes */}
          {objectEntries(delegate.itemPrototypes).map(([templateId, { Component }]) => (
            <div key={`prototype-${templateId}`} className="VirtualList-itemPrototype">
              <ResizeObservingDiv id={`${uuid}-template-${templateId}`} tag={templateId} onResize={onPrototypeResize}>
                <Component />
              </ResizeObservingDiv>
            </div>
          ))}
          {delegate.renderLoadingIndicator !== undefined
            ? BC(delayedShowLoadingIndicator, (show) => (
                <Collapse
                  key="top-loading-indicator"
                  in={show[0] && show[1] === 'start'}
                  unmountOnExit={true}
                  timeout={delegate.loadingIndicatorTransitionDurationMSec ?? ANIMATION_DURATION_MSEC}
                >
                  {delegate.renderLoadingIndicator?.() ?? null}
                </Collapse>
              ))
            : null}
          <div id={`${uuid}-rendered-items`} className="VirtualList-renderedItems" style={{ height: `${totalSize.get()}px` }}>
            <div id={`${uuid}-scroll-position-marker`} className="VirtualList-scrollPositionMarker" />
            {BC(renderedItems, (renderedItems) => renderedItems)}
          </div>
          {delegate.renderEmptyIndicator !== undefined
            ? BC({ isEmpty, showLoadingIndicator }, ({ isEmpty, showLoadingIndicator }) => (
                <Collapse key="empty-indicator" in={!showLoadingIndicator[0] && isEmpty} timeout={0} unmountOnExit={true}>
                  {delegate.renderEmptyIndicator?.() ?? null}
                </Collapse>
              ))
            : null}
          {delegate.renderLoadingIndicator !== undefined
            ? BC(delayedShowLoadingIndicator, (show) => (
                <Collapse
                  key="bottom-loading-indicator"
                  in={show[0] && show[1] === 'end'}
                  unmountOnExit={true}
                  timeout={delegate.loadingIndicatorTransitionDurationMSec ?? ANIMATION_DURATION_MSEC}
                >
                  {delegate.renderLoadingIndicator?.() ?? null}
                </Collapse>
              ))
            : null}
        </ResizeObservingDiv>
      </ListHasFocusProvider>
    </Stack>
  );
};
