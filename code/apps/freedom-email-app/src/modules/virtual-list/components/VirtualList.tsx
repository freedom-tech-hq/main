import { Collapse } from '@mui/material';
import { objectEntries, objectKeys } from 'freedom-cast';
import { makeUuid } from 'freedom-contexts';
import { noop } from 'lodash-es';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { BC, useBinding, useBindingEffect, useCallbackRef, useDerivedBinding } from 'react-bindings';
import { makeStringSubtypeArray } from 'yaschema';

import { ResizingObservingDiv } from '../../../components/ResizingObservingDiv.tsx';
import { ListHasFocusProvider } from '../../../contexts/list-has-focus.tsx';
import type { DataSource, IsDataSourceLoading } from '../../../types/DataSource.ts';
import { doRangesIntersect } from '../../../utils/doRangesIntersect.ts';
import { ANIMATION_DURATION_MSEC } from '../consts/animation.ts';
import { DEFAULT_OVERSCAN_AMOUNT_PX } from '../consts/overscan.ts';
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

  scrollParent: HTMLElement | string;

  /**
   * The number of px above or below the visible area to render content for
   *
   * @defaultValue `160`
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
  overscanAmountPx = DEFAULT_OVERSCAN_AMOUNT_PX,
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingClear = useMemo<{ current: boolean }>(() => ({ current: true }), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const clearTimeMSec = useMemo<{ current: number | undefined }>(() => ({ current: undefined }), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pendingStatesByKey = useMemo<Partial<Record<KeyT, ItemState>>>(() => ({}), [dataSource]);
  const timeMSecByKeyByItemState = useMemo<Record<ItemState, Partial<Record<KeyT, number>>>>(
    () => ({ add: {}, move: {}, remove: {} }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataSource]
  );

  const addStateForKey = useCallbackRef((key: KeyT, state: ItemState) => {
    pendingStatesByKey[key] = state;

    for (const possibleState of itemStates) {
      delete timeMSecByKeyByItemState[possibleState][key];
    }

    delete removingItems[key];
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

  const onPrototypeResize = useCallbackRef((templateId: TemplateIdT, _width: number, height: number) => {
    const currentPrototypeSizes = prototypeSizes.get();
    if (currentPrototypeSizes[templateId] === height) {
      return;
    }

    currentPrototypeSizes[templateId] = height;

    prototypeSizes.set(currentPrototypeSizes);
  });

  const onItemResize = useCallbackRef((itemIndex: number, _width: number, height: number) => {
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

  const forceRenderCount = useBinding(() => 0, { id: 'forceRenderCount' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastRenderedItemsByItemIndex = useMemo<Map<number, [KeyT, ReactNode, topPx: number]>>(() => new Map(), [dataSource]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const removingItems = useMemo<Partial<Record<KeyT, [ReactNode, topPx: number]>>>(() => ({}), [dataSource]);
  const renderedItems = useDerivedBinding(
    { visibleRangeIndices, forceRenderCount },
    ({ visibleRangeIndices }): ReactNode[] => {
      const currentItemSizes = itemSizes.get();

      const offsetsByItemIndex: Record<number, number> = {};
      let currentItemOffset = visibleRangeIndices[2];
      for (let itemIndex = visibleRangeIndices[0]; itemIndex < visibleRangeIndices[1]; itemIndex += 1) {
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
      for (const [key, pendingState] of Object.entries(pendingStatesByKey) as Array<[KeyT, ItemState | undefined]>) {
        if (pendingState === undefined) {
          continue;
        }

        if (!isInitializing) {
          hadAnyPendingChanges = true;

          timeMSecByKeyByItemState[pendingState][key] = now + ANIMATION_DURATION_MSEC;
        }

        delete pendingStatesByKey[key];
      }

      // Removing expired temporary state tracking
      if (clearTimeMSec.current !== undefined && now >= clearTimeMSec.current) {
        clearTimeMSec.current = undefined;
      }
      for (const itemState of itemStates) {
        const timeMSecByKey = timeMSecByKeyByItemState[itemState];
        const keys = objectKeys(timeMSecByKey);
        for (const key of keys) {
          if (timeMSecByKey[key] !== undefined && now >= timeMSecByKey[key]) {
            delete timeMSecByKey[key];
            if (itemState === 'remove') {
              delete removingItems[key];
            }
          }
        }
      }

      lastRenderedItemsByItemIndex.clear();
      for (let itemIndex = visibleRangeIndices[0]; itemIndex < visibleRangeIndices[1]; itemIndex += 1) {
        const key = dataSource.getKeyForItemAtIndex(itemIndex);
        const item = dataSource.getItemAtIndex(itemIndex);
        const templateId = delegate.getTemplateIdForItemAtIndex(itemIndex);

        const topPx = offsetsByItemIndex[itemIndex];
        const isNewItem = !isInitializing && timeMSecByKeyByItemState.add[key] !== undefined;
        const isExistingItem = !isInitializing && !isNewItem;
        const isMovingItem = !isInitializing && timeMSecByKeyByItemState.move[key] !== undefined;

        const hasMeasuredSize = currentItemSizes[itemIndex][0];
        const shouldBeVisible = itemIndex === 0 || hasMeasuredSize || !delegate.itemPrototypes[templateId].isSizeDynamic;
        const renderedItem = delegate.renderItem(key, item, itemIndex);
        const wrappedRenderedItem = (
          <ResizingObservingDiv
            key={key}
            id={`${uuid}-${key}`}
            className={`VirtualList-item ${isNewItem ? 'fade-in' : ''} ${isExistingItem ? 'animated-top' : ''} ${isMovingItem ? 'moving' : ''}`}
            style={{ top: `${topPx}px`, visibility: shouldBeVisible ? 'visible' : 'hidden' }}
            tag={itemIndex}
            onResize={onItemResize}
          >
            {renderedItem}
          </ResizingObservingDiv>
        );

        out.push([key, wrappedRenderedItem]);

        lastRenderedItemsByItemIndex.set(itemIndex, [key, renderedItem, topPx]);
      }

      // Adding the items that are being removed
      if (!isInitializing) {
        for (const [key, value] of objectEntries(removingItems)) {
          if (value === undefined) {
            continue;
          }

          const [renderedItem, topPx] = value;

          const wrappedRenderedItem = (
            <ResizingObservingDiv
              key={key}
              id={`${uuid}-${key}`}
              className={`VirtualList-item fade-out`}
              style={{ top: `${topPx}px` }}
              tag={undefined}
              onResize={noop}
            >
              {renderedItem}
            </ResizingObservingDiv>
          );

          out.push([key, wrappedRenderedItem]);
        }
      }

      // Keeping the items sorted consistently
      out.sort((a, b) => a[0].localeCompare(b[0]));

      if (hadAnyPendingChanges) {
        setTimeout(() => forceRenderCount.set(forceRenderCount.get() + 1), ANIMATION_DURATION_MSEC);
      }

      return out.map(([_key, node]) => node);
    },
    { id: 'renderedItems', detectOutputChanges: false, deps: [dataSource] }
  );

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
      return;
    }

    const listElem = document.getElementById(uuid);
    if (listElem === null) {
      return;
    }

    return () => {
      const elemRect = listElem.getBoundingClientRect();
      const scrollParentRect = scrollParentElem.getBoundingClientRect();

      const top = Math.max(elemRect.top, scrollParentRect.top);
      const currentTotalSize = totalSize.get();
      const bottom = Math.min(elemRect.top + currentTotalSize, scrollParentRect.bottom);

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
    for (const index of indices.sort().reverse()) {
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
    // for (const [key, renderedItem, topPx] of lastRenderedItemsByItemIndex.values()) {
    //   addStateForKey(key, 'remove');
    //   removingItems[key] = [renderedItem, topPx];
    // }

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
    for (const index of indices.sort().reverse()) {
      const rendered = lastRenderedItemsByItemIndex.get(index);
      if (rendered !== undefined) {
        const [key, renderedItem, topPx] = rendered;
        addStateForKey(key, 'remove');
        removingItems[key] = [renderedItem, topPx];
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
    for (const index of indices.sort().reverse()) {
      const newKey = dataSource.getKeyForItemAtIndex(index);
      const rendered = lastRenderedItemsByItemIndex.get(index);
      if (rendered !== undefined) {
        const [oldKey, renderedItem, topPx] = rendered;
        if (oldKey !== newKey) {
          addStateForKey(oldKey, 'remove');
          removingItems[oldKey] = [renderedItem, topPx];
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
      return;
    }

    const listElem = document.getElementById(uuid);
    if (listElem === null) {
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
    { triggerOnMount: true, deps: [dataSource] }
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
  const onContainerResize = useCallbackRef((_tag: undefined, width: number, _height: number) => {
    if (lastContainerSize.current === width) {
      return;
    }

    if (lastContainerSize.current !== undefined) {
      makeOnVisibleRangeChange()?.();
      forceRenderCount.set(forceRenderCount.get() + 1);
    }
    lastContainerSize.current = width;
  });

  return (
    <ListHasFocusProvider listHasFocus={hasFocus}>
      <ResizingObservingDiv
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
            <ResizingObservingDiv id={`${uuid}-template-${templateId}`} tag={templateId} onResize={onPrototypeResize}>
              <Component />
            </ResizingObservingDiv>
          </div>
        ))}
        {delegate.renderLoadingIndicator !== undefined
          ? BC(showLoadingIndicator, (showLoadingIndicator) => (
              <Collapse
                key="top-loading-indicator"
                in={showLoadingIndicator[0] && showLoadingIndicator[1] === 'start'}
                unmountOnExit={true}
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
          ? BC(showLoadingIndicator, (showLoadingIndicator) => (
              <Collapse
                key="bottom-loading-indicator"
                in={showLoadingIndicator[0] && showLoadingIndicator[1] === 'end'}
                unmountOnExit={true}
              >
                {delegate.renderLoadingIndicator?.() ?? null}
              </Collapse>
            ))
          : null}
      </ResizingObservingDiv>
    </ListHasFocusProvider>
  );
};
