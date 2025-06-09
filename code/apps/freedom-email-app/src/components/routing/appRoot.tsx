import type { MailThreadLikeId, MessageFolder } from 'freedom-email-api';
import { messageFolders, nonAnchoredMailThreadLikeIdRegex } from 'freedom-email-api';
import { nest } from 'freedom-nest';
import React from 'react';

import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';
import { MailScreen } from '../../flows/mail/screens/MailScreen.tsx';
import { DeactivateUser } from './DeactivateUser.tsx';
import { GoHome } from './GoHome.tsx';
import { DYNAMIC_ROUTE, ROUTE } from './RouteSegmentInfo.ts';

const segmentInfo = nest(ROUTE('', { auth: 'none', render: () => <AuthScreen />, renderIfAuthIncorrect: () => <DeactivateUser /> }), {
  signIn: DYNAMIC_ROUTE('sign-in', /[^/]+/, {
    auth: 'none',
    render: ({ pathParts }) => <AuthScreen mode="sign-in" email={pathParts[pathParts.length - 1]} />,
    renderIfAuthIncorrect: () => <DeactivateUser />
  }),
  addAccount: ROUTE('add-account', {
    auth: 'none',
    render: () => <AuthScreen mode="add-account" />,
    renderIfAuthIncorrect: () => <DeactivateUser />
  }),
  newAccount: ROUTE('new-account', {
    auth: 'none',
    render: () => <AuthScreen mode="new-account" />,
    renderIfAuthIncorrect: () => <DeactivateUser />
  }),
  importCredential: DYNAMIC_ROUTE('import-credential', /[^/]+/, {
    auth: 'none',
    render: ({ pathParts }) => <AuthScreen mode="import-credential" email={pathParts[pathParts.length - 1]} />,
    renderIfAuthIncorrect: () => <DeactivateUser />
  }),

  mail: nest(
    DYNAMIC_ROUTE('mail', [...messageFolders, 'all'], {
      auth: 'required',
      render: () => <MailScreen />,
      renderIfAuthIncorrect: () => <GoHome />
    }),
    {
      compose: ROUTE('compose', {
        auth: 'required',
        render: () => <MailScreen mode="compose" />,
        renderIfAuthIncorrect: () => <GoHome />
      }),
      thread: DYNAMIC_ROUTE('thread', nonAnchoredMailThreadLikeIdRegex, {
        auth: 'required',
        render: ({ pathParts }) => <MailScreen mode="default" threadId={pathParts[pathParts.length - 1] as MailThreadLikeId} />,
        renderIfAuthIncorrect: () => <GoHome />
      })
    }
  )
});

const joinPaths = (...paths: string[]) => paths.filter((segment) => segment.length > 0).join('/');

const makePath = (rootPrefix: string) =>
  nest(
    [segmentInfo],
    (level) => joinPaths(rootPrefix, level.value.staticPart),
    (parent, level) => ({
      signIn: (email: string) => joinPaths(parent, level.signIn.staticPart, encodeURIComponent(email)),
      addAccount: joinPaths(parent, level.addAccount.staticPart),
      newAccount: joinPaths(parent, level.newAccount.staticPart),
      importCredential: (email: string) => joinPaths(parent, level.importCredential.staticPart, encodeURIComponent(email)),

      mail: (folder: MessageFolder | 'all') =>
        nest(
          [level.mail],
          (level) => joinPaths(parent, level.value.staticPart, encodeURIComponent(folder)),
          (parent, level) => ({
            compose: joinPaths(parent, level.compose.staticPart),
            thread: (threadLikeId: MailThreadLikeId) => joinPaths(parent, level.thread.staticPart, threadLikeId)
          })
        )
    })
  );

const path = makePath('');

let demoModeAppRootPath = path;
DEV: demoModeAppRootPath = makePath('demo');

let setDemoMode = (_demoMode: boolean) => {};
DEV: setDemoMode = (demoMode: boolean) => {
  appRoot.path = demoMode ? demoModeAppRootPath : path;
};

export const appRoot = { segmentInfo, path, setDemoMode };
