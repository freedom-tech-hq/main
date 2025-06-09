import { useEffect } from 'react';

export interface UseElementResizeObserverArgs<TagT = any> {
  element: HTMLElement | string | Window | VisualViewport;
  /** Sent as the last parameter to `onResize` callbacks */
  tag: TagT;
  onResize: (width: number, height: number, tag: TagT) => void;
}

export const useElementResizeObserver = <TagT = any>({ element, tag, onResize }: UseElementResizeObserverArgs<TagT>) => {
  useEffect(() => {
    if (element instanceof Window) {
      const windowEventListener = () => onResize(element.innerWidth, element.innerHeight, tag);

      element.addEventListener('resize', windowEventListener);

      return () => element.removeEventListener('resize', windowEventListener);
    } else if (element instanceof VisualViewport) {
      const windowEventListener = () => onResize(element.width, element.height, tag);

      element.addEventListener('resize', windowEventListener);

      return () => element.removeEventListener('resize', windowEventListener);
    } else {
      const elem = typeof element === 'string' ? document.getElementById(element) : element;
      if (elem === null) {
        return;
      }

      const onSizeChange = (entries: ResizeObserverEntry[]) => {
        const firstTarget = entries[0]?.target;
        if (firstTarget !== undefined) {
          onResize(firstTarget.clientWidth, firstTarget.clientHeight, tag);
        }
      };

      const resizeObserver = new ResizeObserver(onSizeChange);

      resizeObserver.observe(elem);

      return () => resizeObserver.disconnect();
    }
  });
};
