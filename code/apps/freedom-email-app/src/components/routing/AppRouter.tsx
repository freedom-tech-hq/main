import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC, useBindingEffect } from 'react-bindings';

import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';
import { MailScreen } from '../../flows/mail/screens/MailScreen.tsx';
import { DemoRouter } from './DemoRouter.tsx';

export const AppRouter = () => {
  const history = useHistory();
  const activeAccountInfo = useActiveAccountInfo();

  useBindingEffect(
    activeAccountInfo,
    (activeAccountInfo) => {
      if (activeAccountInfo === undefined) {
        const pathParts = history.top.get().path.split('/');

        DEV: if (pathParts[0] === 'demo') {
          return;
        }

        if (pathParts[0] !== '') {
          history.replace('/');
        }
      }
    },
    { triggerOnMount: true }
  );

  return BC(history.top, (top) => {
    const pathParts = top.path.split('/');

    DEV: if (pathParts[0] === 'demo') {
      return <DemoRouter relativePath={pathParts.slice(1)} />;
    }

    switch (pathParts[0]) {
      case '':
        return <AuthScreen />;
      case 'mail':
        return <MailScreen />;
      default: {
        history.replace('/');
        return <AuthScreen />;
      }
    }
  });
};
