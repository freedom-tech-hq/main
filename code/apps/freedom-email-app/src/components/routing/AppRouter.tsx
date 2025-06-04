import { objectKeys } from 'freedom-cast';
import type { Nested } from 'freedom-nest';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC, useBindingEffect } from 'react-bindings';

import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { AuthScreen } from '../../flows/auth/components/screens/AuthScreen.tsx';
import { MailScreen } from '../../flows/mail/screens/MailScreen.tsx';
import type { AppPathSegmentInfo } from './appRoot.ts';
import { appRoot } from './appRoot.ts';
import { DemoRouter } from './DemoRouter.tsx';

export const AppRouter = () => {
  const history = useHistory();
  const activeAccountInfo = useActiveAccountInfo();

  useBindingEffect(
    { top: history.top, activeAccountInfo },
    ({ top, activeAccountInfo }) => {
      const pathParts = history.top.get().path.split('/');

      DEV: if (pathParts[0] === 'demo') {
        processPath(pathParts, 1, { ignoreAuth: true });
        return;
      }

      processPath(pathParts);

      // if (activeAccountInfo === undefined) {
      //   if (pathParts[0] !== '') {
      //     history.replace('/');
      //   }
      // }
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

// Helpers

type AnySegmentValue = string | [string, RegExp];
type NestedAppPathSegmentInfos = Nested<AppPathSegmentInfo<AnySegmentValue>, { [key: string]: SimpleOrNestedAppPathSegmentInfos }>;
type SimpleOrNestedAppPathSegmentInfos = AppPathSegmentInfo<AnySegmentValue> | NestedAppPathSegmentInfos;

const isNestedAppPathSegmentInfos = (check: SimpleOrNestedAppPathSegmentInfos): check is NestedAppPathSegmentInfos => 'value' in check;

const processPath = (
  pathParts: string[],
  pathPartsOffset = 0,
  { segmentInfo = appRoot.segmentInfo, ignoreAuth = false }: { segmentInfo?: SimpleOrNestedAppPathSegmentInfos; ignoreAuth?: boolean } = {}
): true | false | [true, 'extraneous', number] => {
  if (isNestedAppPathSegmentInfos(segmentInfo)) {
    if (Array.isArray(segmentInfo.value.segment)) {
      if (pathParts[pathPartsOffset] !== segmentInfo.value.segment[0] || !segmentInfo.value.segment[1].test(pathParts[pathPartsOffset])) {
        return false;
      }

      pathPartsOffset += 2;
    } else {
      if (pathParts[pathPartsOffset] !== segmentInfo.value.segment) {
        return false;
      }

      pathPartsOffset += 1;
    }
  } else {
    if (Array.isArray(segmentInfo.segment)) {
      if (pathParts[pathPartsOffset] !== segmentInfo.segment[0] || !segmentInfo.segment[1].test(pathParts[pathPartsOffset])) {
        return false;
      }

      pathPartsOffset += 2;
    } else {
      if (pathParts[pathPartsOffset] !== segmentInfo.segment) {
        return false;
      }

      pathPartsOffset += 1;
    }
  }

  if (pathPartsOffset < pathParts.length) {
    if (!isNestedAppPathSegmentInfos(segmentInfo)) {
      return [true, 'extraneous', pathPartsOffset];
    }

    for (const key of objectKeys(segmentInfo)) {
      if (key === 'value') {
        continue;
      }

      const processed = processPath(pathParts, pathPartsOffset, { segmentInfo: segmentInfo[key], ignoreAuth });
      if (processed !== false) {
        return processed;
      }
    }
  }

  return true;
};
