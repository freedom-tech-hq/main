import React, { useEffect, useRef } from 'react';

export interface OnFirstMountProps {
  do: () => void;
  delayMSec?: number;
}

export const OnFirstMount = ({ do: doFunc, delayMSec }: OnFirstMountProps) => {
  const first = useRef(true);
  const lastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!first.current) {
      return;
    }
    first.current = false;

    if (delayMSec !== undefined) {
      lastTimeout.current = setTimeout(doFunc, delayMSec);
    } else {
      doFunc();
    }

    return () => {
      clearTimeout(lastTimeout.current);
      lastTimeout.current = undefined;
    };
  });

  return <></>;
};
