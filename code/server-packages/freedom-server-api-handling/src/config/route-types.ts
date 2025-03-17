/* node:coverage disable */

let globalAcceptedRouteTypes: Readonly<Set<string>> | undefined;

export const isAcceptedRouteType = (routeType: string) => globalAcceptedRouteTypes === undefined || globalAcceptedRouteTypes.has(routeType);

export const getAcceptedRouteTypes = () => globalAcceptedRouteTypes;

export const setAcceptedRouteTypes = (routeTypes: string[] | undefined) => {
  globalAcceptedRouteTypes = routeTypes === undefined ? undefined : Object.freeze(new Set(routeTypes));
};
