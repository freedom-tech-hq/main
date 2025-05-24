import { type HTMLAttributes, useEffect } from 'react';

export interface ResizingObservingDivProps<TagT> extends Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> {
  id: string;
  /** Sent as the first parameter to `onResize` callbacks */
  tag: TagT;
  onResize: (tag: TagT, width: number, height: number) => void;
}

export const ResizingObservingDiv = <TagT,>({ id, tag, onResize, ...props }: ResizingObservingDivProps<TagT>) => {
  useEffect(() => {
    const elem = document.getElementById(id);
    if (elem === null) {
      return;
    }

    const onSizeChange = (entries: ResizeObserverEntry[]) => {
      const firstTarget = entries[0]?.target;
      if (firstTarget !== undefined) {
        onResize(tag, firstTarget.clientWidth, firstTarget.clientHeight);
      }
    };

    const resizeObserver = new ResizeObserver(onSizeChange);

    resizeObserver.observe(elem);

    return () => resizeObserver.disconnect();
  });

  return <div id={id} {...props} />;
};
