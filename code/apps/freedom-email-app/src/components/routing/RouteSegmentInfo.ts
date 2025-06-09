import type { ReactNode } from 'react';
import type { Schema } from 'yaschema';

// TODO: Move to separate package
export type SegmentDynamicValue<ValueT extends string> = RegExp | ValueT[] | Schema<ValueT>;
export type Segment<DynamicValueT extends string> = string | [string, SegmentDynamicValue<DynamicValueT>];

export type RouteSegmentInfoAuth = 'required' | 'optional' | 'none';

export interface RouteSegmentInfoExtras<SegmentInfoT extends AnyRouteSegmentInfo> {
  auth: RouteSegmentInfoAuth;
  render: (args: { info: SegmentInfoT; pathParts: string[]; segments: AnyRouteSegmentInfo[] }) => ReactNode;
  renderIfAuthIncorrect?: (args: { info: SegmentInfoT; pathParts: string[]; segments: AnyRouteSegmentInfo[] }) => ReactNode;
}

export interface StaticRouteSegmentInfo extends RouteSegmentInfoExtras<StaticRouteSegmentInfo> {
  type: 'static';
  staticPart: string;
}
export interface DynamicRouteSegmentInfo<DynamicValueT extends string>
  extends RouteSegmentInfoExtras<DynamicRouteSegmentInfo<DynamicValueT>> {
  type: 'dynamic';
  staticPart: string;
  dynamicPart: SegmentDynamicValue<DynamicValueT>;
}
export type AnyRouteSegmentInfo = StaticRouteSegmentInfo | DynamicRouteSegmentInfo<any>;

export const ROUTE = (staticPart: string, args: RouteSegmentInfoExtras<StaticRouteSegmentInfo>): StaticRouteSegmentInfo => ({
  ...args,
  staticPart,
  type: 'static'
});
export const DYNAMIC_ROUTE = <DynamicValueT extends string>(
  staticPart: string,
  dynamicPart: SegmentDynamicValue<DynamicValueT>,
  args: RouteSegmentInfoExtras<DynamicRouteSegmentInfo<DynamicValueT>>
): DynamicRouteSegmentInfo<DynamicValueT> => ({
  ...args,
  staticPart,
  dynamicPart,
  type: 'dynamic'
});
