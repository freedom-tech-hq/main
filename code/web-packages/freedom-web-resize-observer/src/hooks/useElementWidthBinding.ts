import { useBinding, useCallbackRef } from 'react-bindings';

import { useElementResizeObserver } from './useElementResizeObserver.ts';

export const useElementWidthBinding = (element: HTMLElement | string | Window | VisualViewport) => {
  const widthPx = useBinding(
    () => {
      if (element instanceof Window) {
        return element.innerWidth;
      } else if (element instanceof VisualViewport) {
        return element.width;
      } else {
        const elem = typeof element === 'string' ? document.getElementById(element) : element;
        if (elem === null) {
          return 0;
        }

        return elem.clientWidth;
      }
    },
    { id: 'widthPx', detectChanges: true }
  );

  const onResize = useCallbackRef((width: number, _height: number) => {
    widthPx.set(width);
  });

  useElementResizeObserver({ element, tag: 0, onResize });

  return widthPx;
};
