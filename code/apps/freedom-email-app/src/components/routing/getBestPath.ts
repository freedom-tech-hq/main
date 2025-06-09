import { objectKeys } from 'freedom-cast';
import type { Nested } from 'freedom-nest';

import type { AnyRouteSegmentInfo } from './RouteSegmentInfo.ts';

// TODO: move to separate package
export type AnyNestedAppPathSegmentInfos = Nested<AnyRouteSegmentInfo, { [key: string]: AnySimpleOrNestedAppPathSegmentInfos }>;
export type AnySimpleOrNestedAppPathSegmentInfos = AnyRouteSegmentInfo | AnyNestedAppPathSegmentInfos;

const isNestedAppPathSegmentInfos = (check: AnySimpleOrNestedAppPathSegmentInfos): check is AnyNestedAppPathSegmentInfos =>
  'value' in check;

export const getBestPath = (
  pathParts: string[],
  segmentInfo: AnySimpleOrNestedAppPathSegmentInfos,
  pathPartsOffset = 0
): { pathParts: string[]; segments: AnyRouteSegmentInfo[] } | undefined => {
  if (pathPartsOffset >= pathParts.length) {
    return { pathParts: [], segments: [] };
  }

  const resolvedSegmentInfo = isNestedAppPathSegmentInfos(segmentInfo) ? segmentInfo.value : segmentInfo;

  const output: { pathParts: string[]; segments: AnyRouteSegmentInfo[] } = {
    pathParts: [],
    segments: [resolvedSegmentInfo]
  };

  switch (resolvedSegmentInfo.type) {
    case 'static':
      if (pathParts[pathPartsOffset] !== resolvedSegmentInfo.staticPart) {
        return undefined;
      }

      output.pathParts.push(pathParts[pathPartsOffset]);

      pathPartsOffset += 1;

      break;

    case 'dynamic': {
      if (pathParts[pathPartsOffset] !== resolvedSegmentInfo.staticPart) {
        return undefined;
      }

      const dynamicPathValue = pathParts[pathPartsOffset + 1];
      const dynamicSegmentInfoPart = resolvedSegmentInfo.dynamicPart;
      if (dynamicSegmentInfoPart instanceof RegExp) {
        // If the segment has a regex, check that the dynamic part matches it
        if (!dynamicSegmentInfoPart.test(dynamicPathValue)) {
          return undefined;
        }
      } else if (Array.isArray(dynamicSegmentInfoPart)) {
        // If the segment has an array, check that the dynamic part is included in it
        if (!dynamicSegmentInfoPart.includes(dynamicPathValue)) {
          return undefined;
        }
      } else if (dynamicSegmentInfoPart.validate(dynamicPathValue).error !== undefined) {
        // If the segment has a schema, validate the dynamic part
        return undefined;
      }

      output.pathParts.push(pathParts[pathPartsOffset], dynamicPathValue);

      pathPartsOffset += 2;

      break;
    }
  }

  if (pathPartsOffset < pathParts.length) {
    if (!isNestedAppPathSegmentInfos(segmentInfo)) {
      return output;
    }

    let longestSubPath: { pathParts: string[]; segments: AnyRouteSegmentInfo[] } = { pathParts: [], segments: [] };
    for (const key of objectKeys(segmentInfo)) {
      if (key === 'value') {
        continue;
      }

      const subPath = getBestPath(pathParts, segmentInfo[key], pathPartsOffset);
      if (subPath !== undefined && subPath.pathParts.length > longestSubPath.pathParts.length) {
        longestSubPath = subPath;
      }
    }

    output.pathParts.push(...longestSubPath.pathParts);
    output.segments.push(...longestSubPath.segments);
  }

  return output;
};
