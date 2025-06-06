import { useHistory } from 'freedom-web-navigation';
import React, { useEffect } from 'react';

import { appRoot } from './appRoot.tsx';

export const GoHome = () => {
  const history = useHistory();

  useEffect(() => {
    history.replace(appRoot.path.value);
  });

  return <></>;
};
