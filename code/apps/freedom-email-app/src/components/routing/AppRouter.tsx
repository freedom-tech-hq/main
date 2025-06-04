import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC } from 'react-bindings';

import { DemoRouter } from './DemoRouter.tsx';

export const AppRouter = () => {
  const history = useHistory();

  return BC(history.top, (top) => {
    const pathParts = top.path.split('/');

    DEV: if (pathParts[0] === 'demo') {
      return <DemoRouter relativePath={pathParts.slice(1)} />;
    }

    // TODO: TEMP
    return <></>;
  });
};
