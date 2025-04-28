import { makeStringSubtypeArray } from 'yaschema';

export const loggingModes = makeStringSubtypeArray('structured', 'flat', 'none');
export type LoggingMode = (typeof loggingModes)[0];
