import { objectKeys } from 'freedom-cast';
import type { Nested } from 'freedom-nest';

import { appRoot } from './appRoot.tsx';
import { type AnySegmentValue, type RouteSegmentInfo } from './RouteSegmentInfo.tsx';

type NestedAppPathSegmentInfos = Nested<RouteSegmentInfo<AnySegmentValue>, { [key: string]: SimpleOrNestedAppPathSegmentInfos }>;
type SimpleOrNestedAppPathSegmentInfos = RouteSegmentInfo<AnySegmentValue> | NestedAppPathSegmentInfos;

const isNestedAppPathSegmentInfos = (check: SimpleOrNestedAppPathSegmentInfos): check is NestedAppPathSegmentInfos => 'value' in check;

export const getBestPath = (
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
