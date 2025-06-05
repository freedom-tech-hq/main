import { useEffect } from 'react';

export interface UseElementResizeObserverArgs<TagT = any> {
  element: HTMLElement | string | Window;
  /** Sent as the last parameter to `onResize` callbacks */
  tag: TagT;
  onResize: (width: number, height: number, tag: TagT) => void;
}

export const useElementResizeObserver = <TagT = any>({ element, tag, onResize }: UseElementResizeObserverArgs<TagT>) => {
  useEffect(() => {
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

    if (elem instanceof Window) {
      const windowEventListener = () => onResize(window.innerWidth, window.innerHeight, tag);

      window.addEventListener('resize', windowEventListener);

      return () => window.removeEventListener('resize', windowEventListener);
    } else {
      resizeObserver.observe(elem);

      return () => resizeObserver.disconnect();
    }
  });
};
