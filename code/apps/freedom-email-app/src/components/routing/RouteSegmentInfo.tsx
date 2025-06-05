import type { ReactNode } from 'react';

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
