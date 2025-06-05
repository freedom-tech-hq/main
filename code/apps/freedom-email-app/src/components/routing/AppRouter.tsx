import { objectKeys } from 'freedom-cast';
import { ELSE, IF } from 'freedom-logical-web-components';
import type { Nested } from 'freedom-nest';
import { useHistory } from 'freedom-web-navigation';
import React from 'react';
import { BC } from 'react-bindings';

import { useActiveAccountInfo } from '../../contexts/active-account-info.tsx';
import { appRoot } from './appRoot.tsx';
import { EnableDemoMode } from './EnableDemoMode.tsx';
import type { RouteSegmentInfo } from './RouteSegmentInfo.tsx';

export const AppRouter = () => {
  const history = useHistory();
  const activeAccountInfo = useActiveAccountInfo();

  return BC({ top: history.top, activeAccountInfo }, ({ top, activeAccountInfo }) => {
    const pathParts = top.path.split('/').map(decodeURIComponent);

    let bestPath = getBestPath(['', ...pathParts]);
    let demoMode = false;
    DEV: if (pathParts[0] === 'demo') {
      bestPath = getBestPath(['', ...pathParts.slice(1)]);
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
          () => lastSegment.renderIfAuthIncorrect?.(bestPath) ?? null
        )}
        {lastSegment.render(bestPath)}
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

// Helpers

type AnySegmentValue = string | [string, RegExp];
type NestedAppPathSegmentInfos = Nested<RouteSegmentInfo<AnySegmentValue>, { [key: string]: SimpleOrNestedAppPathSegmentInfos }>;
type SimpleOrNestedAppPathSegmentInfos = RouteSegmentInfo<AnySegmentValue> | NestedAppPathSegmentInfos;

const isNestedAppPathSegmentInfos = (check: SimpleOrNestedAppPathSegmentInfos): check is NestedAppPathSegmentInfos => 'value' in check;

const getBestPath = (
  pathParts: string[],
  pathPartsOffset = 0,
  segmentInfo: SimpleOrNestedAppPathSegmentInfos = appRoot.segmentInfo
): { pathParts: string[]; segments: Array<RouteSegmentInfo<AnySegmentValue>> } | undefined => {
  if (pathPartsOffset >= pathParts.length) {
    return { pathParts: [], segments: [] };
  }

  const resolvedSegmentInfo = isNestedAppPathSegmentInfos(segmentInfo) ? segmentInfo.value : segmentInfo;

  const output: { pathParts: string[]; segments: Array<RouteSegmentInfo<AnySegmentValue>> } = {
    pathParts: [],
    segments: [resolvedSegmentInfo]
  };

  if (Array.isArray(resolvedSegmentInfo.segment)) {
    if (
      pathParts[pathPartsOffset] !== resolvedSegmentInfo.segment[0] ||
      !resolvedSegmentInfo.segment[1].test(pathParts[pathPartsOffset + 1])
    ) {
      return undefined;
    }

    output.pathParts.push(pathParts[pathPartsOffset], pathParts[pathPartsOffset + 1]);

    pathPartsOffset += 2;
  } else {
    if (pathParts[pathPartsOffset] !== resolvedSegmentInfo.segment) {
      return undefined;
    }

    output.pathParts.push(pathParts[pathPartsOffset]);

    pathPartsOffset += 1;
  }

  if (pathPartsOffset < pathParts.length) {
    if (!isNestedAppPathSegmentInfos(segmentInfo)) {
      return output;
    }

    let longestSubPath: { pathParts: string[]; segments: Array<RouteSegmentInfo<AnySegmentValue>> } = { pathParts: [], segments: [] };
    for (const key of objectKeys(segmentInfo)) {
      if (key === 'value') {
        continue;
      }

      const subPath = getBestPath(pathParts, pathPartsOffset, segmentInfo[key]);
      if (subPath !== undefined && subPath.pathParts.length > longestSubPath.pathParts.length) {
        longestSubPath = subPath;
      }
    }

    output.pathParts.push(...longestSubPath.pathParts);
    output.segments.push(...longestSubPath.segments);
  }

  return output;
};
