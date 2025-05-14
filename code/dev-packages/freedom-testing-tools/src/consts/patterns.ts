import { pick } from 'lodash-es';

import { ArrayTestPattern } from '../classes/ArrayTestPattern.ts';
import { ObjectTestPattern } from '../classes/ObjectTestPattern.ts';
import { PrimitiveTestPattern } from '../classes/PrimitiveTestPattern.ts';
import { StringTestPattern } from '../classes/StringTestPattern.ts';
import { expectEqualsObjectPattern } from '../utils/expectEqualsObjectPattern.ts';

export const ANY_ARRAY = new ArrayTestPattern();
export const ANY_OBJECT = new ObjectTestPattern();

export const ANY_OBJECT_WITH = (expectedPartial: Record<string, any>, msg?: string) =>
  new ObjectTestPattern((value) => {
    try {
      expectEqualsObjectPattern(pick(value, Object.keys(expectedPartial)), expectedPartial, msg);
      return [true, undefined];
    } catch (e) {
      return [false, e instanceof Error ? e.message : msg];
    }
  });

export const ANY_BOOLEAN = new PrimitiveTestPattern((value) => [typeof value === 'boolean', 'Expected a boolean']);
export const ANY_NUMBER = new PrimitiveTestPattern((value) => [typeof value === 'number' && !isNaN(value), 'Expected a number']);
export const ANY_STRING = new StringTestPattern();
