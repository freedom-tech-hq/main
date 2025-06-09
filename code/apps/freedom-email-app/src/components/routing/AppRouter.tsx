import { ELSE, IF } from 'freedom-logical-web-components';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC } from 'react-bindings';

import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { appRoot } from './appRoot.tsx';
import { EnableDemoMode } from './EnableDemoMode.tsx';
import type { AnySimpleOrNestedAppPathSegmentInfos } from './getBestPath.ts';
import { getBestPath } from './getBestPath.ts';

export const AppRouter = () => {
  const history = useHistory();
  const activeAccountInfo = useActiveAccountInfo();

  return BC({ top: history.top, activeAccountInfo }, ({ top, activeAccountInfo }) => {
    const pathParts = top.path.split('/').map(decodeURIComponent);

    let bestPath = getBestPath(['', ...pathParts], appRoot.segmentInfo as AnySimpleOrNestedAppPathSegmentInfos);
    let demoMode = false;
    DEV: if (pathParts[0] === 'demo') {
      bestPath = getBestPath(['', ...pathParts.slice(1)], appRoot.segmentInfo);
      demoMode = true;
    }

    if (bestPath === undefined) {
      bestPath = { pathParts: [], segments: [appRoot.segmentInfo.value] };
    }

    const hasAuth = activeAccountInfo !== undefined;
    const lastSegment = bestPath.segments[bestPath.segments.length - 1];
    const lastSegmentAuth = lastSegment.auth;
    const expectedAuth = lastSegmentAuth === 'required';

    const content = (
      <>
        {IF(
          !demoMode && lastSegmentAuth !== 'optional' && expectedAuth !== hasAuth,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          () => lastSegment.renderIfAuthIncorrect?.({ ...bestPath, info: bestPath.segments[bestPath.segments.length - 1] } as any) ?? null
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */}
        {lastSegment.render({ ...bestPath, info: bestPath.segments[bestPath.segments.length - 1] } as any)}
      </>
    );

    DEV: return IF(
      demoMode,
      () => <EnableDemoMode>{content}</EnableDemoMode>,
      ELSE(() => content)
    );

    return content;
  });
};
