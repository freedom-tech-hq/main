import React from 'react';
import { type HTMLAttributes } from 'react';

import { useElementResizeObserver } from '../hooks/useElementResizeObserver.ts';

export interface ResizeObservingDivProps<TagT = any> extends Omit<HTMLAttributes<HTMLDivElement>, 'onResize'> {
  id: string;
  /** Sent as the last parameter to `onResize` callbacks */
  tag: TagT;
  onResize: (width: number, height: number, tag: TagT) => void;
}

export const ResizeObservingDiv = <TagT = any,>({ id, tag, onResize, ...props }: ResizeObservingDivProps<TagT>) => {
  useElementResizeObserver({ element: id, tag, onResize });

  return <div id={id} {...props} />;
};
