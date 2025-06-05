import type { ThreadLikeId } from 'freedom-email-user';
import { nonAnchoredThreadLikeIdRegex } from 'freedom-email-user';
import { nest } from 'freedom-nest';
import type { ReactNode } from 'react';
import React from 'react';

import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';
import { MailScreen } from '../../flows/mail/screens/MailScreen.tsx';
import { DeactivateUser } from './DeactivateUser.tsx';
import { GoHome } from './GoHome.tsx';

export type AnySegmentValue = string | [string, RegExp];

export interface RouteSegmentInfo<SegmentT extends string | [string, RegExp]> {
  segment: SegmentT;
  auth: 'none' | 'optional' | 'required';
  render: (args: { pathParts: string[]; segments: Array<RouteSegmentInfo<AnySegmentValue>> }) => ReactNode;
  renderIfAuthIncorrect?: (args: { pathParts: string[]; segments: Array<RouteSegmentInfo<AnySegmentValue>> }) => ReactNode;
}

export const ROUTE_SEGMENT = <SegmentT extends string | [string, RegExp]>(
  segment: SegmentT,
  args: Omit<RouteSegmentInfo<SegmentT>, 'segment'>
): RouteSegmentInfo<SegmentT> => ({
  ...args,
  segment
});

const segmentInfo = nest(
  ROUTE_SEGMENT('', { auth: 'none', render: () => <AuthScreen />, renderIfAuthIncorrect: () => <DeactivateUser /> }),
  {
    signIn: ROUTE_SEGMENT(['sign-in', /[^/]+/], {
      auth: 'none',
      render: ({ pathParts }) => <AuthScreen mode="sign-in" email={pathParts[pathParts.length - 1]} />,
      renderIfAuthIncorrect: () => <DeactivateUser />
    }),
    addAccount: ROUTE_SEGMENT('add-account', {
      auth: 'none',
      render: () => <AuthScreen mode="add-account" />,
      renderIfAuthIncorrect: () => <DeactivateUser />
    }),
    newAccount: ROUTE_SEGMENT('new-account', {
      auth: 'none',
      render: () => <AuthScreen mode="new-account" />,
      renderIfAuthIncorrect: () => <DeactivateUser />
    }),
    importCredential: ROUTE_SEGMENT(['import-credential', /[^/]+/], {
      auth: 'none',
      render: ({ pathParts }) => <AuthScreen mode="import-credential" email={pathParts[pathParts.length - 1]} />,
      renderIfAuthIncorrect: () => <DeactivateUser />
    }),

    mail: nest(
      ROUTE_SEGMENT('mail', {
        auth: 'required',
        render: () => <MailScreen />,
        renderIfAuthIncorrect: () => <GoHome />
      }),
      {
        compose: ROUTE_SEGMENT('compose', {
          auth: 'required',
          render: () => <MailScreen mode="compose" />,
          renderIfAuthIncorrect: () => <GoHome />
        }),
        thread: ROUTE_SEGMENT(['thread', nonAnchoredThreadLikeIdRegex], {
          auth: 'required',
          render: ({ pathParts }) => <MailScreen mode="view-thread" threadId={pathParts[pathParts.length - 1] as ThreadLikeId} />,
          renderIfAuthIncorrect: () => <GoHome />
        })
      }
    )
  }
);

const makePath = (rootPrefix: string) =>
  nest(
    [segmentInfo],
    (level) => `${rootPrefix}${level.value.segment}`,
    (parent, level) => ({
      signIn: (email: string) => `${parent}/${level.signIn.segment[0]}/${encodeURIComponent(email)}`,
      addAccount: `${parent}/${level.addAccount.segment}`,
      newAccount: `${parent}/${level.newAccount.segment}`,
      importCredential: (email: string) => `${parent}/${level.importCredential.segment[0]}/${encodeURIComponent(email)}`,

      mail: nest(
        [level.mail],
        (level) => `${parent}/${level.value.segment}`,
        (parent, level) => ({
          compose: `${parent}/${level.compose.segment}`,
          thread: (threadId: ThreadLikeId) => `${parent}/${level.thread.segment[0]}/${threadId}`
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
