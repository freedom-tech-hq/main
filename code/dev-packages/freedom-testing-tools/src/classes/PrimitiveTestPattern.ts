import { genericValueToString } from '../internal/utils/genericValueToString.ts';
import { genericValueType } from '../internal/utils/genericValueType.ts';
import { TestPattern } from './TestPattern.ts';

export class PrimitiveTestPattern extends TestPattern<string> {
  constructor(private readonly checker?: (value: any) => [boolean, string | undefined]) {
    super();
  }

  public override evaluate(value: any): [boolean, string | undefined] {
    if (!isPrimitiveType(value)) {
      return [false, `Expected a primitive, found ${genericValueType(value)}: ${genericValueToString(value)}`];
    }

    return this.checker?.(value) ?? [true, undefined];
  }
}

// Helpers

const isPrimitiveType = (value: any): boolean => typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
