import { makeStringSubtypeArray } from 'yaschema';

export const loggingModes = makeStringSubtypeArray('structured', 'flat', 'pretty-print', 'none');
export type LoggingMode = (typeof loggingModes)[0];
