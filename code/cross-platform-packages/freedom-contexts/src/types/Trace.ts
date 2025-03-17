export interface Trace {
  readonly isTrace: true;
  readonly traceId: string;
  readonly parent?: Trace;
  readonly attached?: object;
}

export const isTrace = (value: any): value is Trace =>
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  value !== null && typeof value === 'object' && 'isTrace' in value && value.isTrace === true;
