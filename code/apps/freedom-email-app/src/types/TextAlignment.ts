import { makeStringSubtypeArray } from 'yaschema';

export const textAlignments = makeStringSubtypeArray('left', 'center', 'right');
export type TextAlignment = (typeof textAlignments)[0];
