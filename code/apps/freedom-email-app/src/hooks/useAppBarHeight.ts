import { useEffect } from 'react';
import { useBinding } from 'react-bindings';

export const useAppBarHeight = () => {
  const height = useBinding(() => 0, { id: 'appBarHeight', detectChanges: true });

  useEffect(() => {
    const onSizeChange = (entries: ResizeObserverEntry[]) => {
      const firstTarget = entries[0]?.target;
      if (firstTarget !== undefined) {
        height.set(firstTarget.clientHeight);
      }
    };

    const resizeObserver = new ResizeObserver(onSizeChange);

    const elem = document.querySelector('header.MuiAppBar-root');
    if (elem === null) {
      return;
    }

    resizeObserver.observe(elem);

    return () => resizeObserver.disconnect();
  }, [height]);

  return height;
};
