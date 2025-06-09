import { useBinding, useCallbackRef } from 'react-bindings';

import { useElementResizeObserver } from './useElementResizeObserver.ts';

export const useElementHeightBinding = (element: HTMLElement | string | Window | VisualViewport) => {
  const heightPx = useBinding(
    () => {
      if (element instanceof Window) {
        return element.innerHeight;
      } else if (element instanceof VisualViewport) {
        return element.height;
      } else {
        const elem = typeof element === 'string' ? document.getElementById(element) : element;
        if (elem === null) {
          return 0;
        }

        return elem.clientHeight;
      }
    },
    { id: 'heightPx', detectChanges: true }
  );

  const onResize = useCallbackRef((_width: number, height: number) => {
    heightPx.set(height);
  });

  useElementResizeObserver({ element, tag: 0, onResize });

  return heightPx;
};
