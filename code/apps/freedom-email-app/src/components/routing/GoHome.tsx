import { useHistory } from 'freedom-web-navigation';
import React, { useEffect } from 'react';

export const GoHome = () => {
  const history = useHistory();

  useEffect(() => {
    history.replace('/');
  });

  return <></>;
};
