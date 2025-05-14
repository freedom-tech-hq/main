import { genericValueToString } from '../internal/utils/genericValueToString.ts';
import { genericValueType } from '../internal/utils/genericValueType.ts';
import { TestPattern } from './TestPattern.ts';

export class ObjectTestPattern extends TestPattern<Record<string, any>> {
  constructor(private readonly checker?: (value: Record<string, any>) => [boolean, string | undefined]) {
    super();
  }

  public override evaluate(value: Record<string, any>): [boolean, string | undefined] {
    if (value === null || typeof value !== 'object') {
      return [false, `Expected an object, found ${genericValueType(value)}: ${genericValueToString(value)}`];
    }

    return this.checker?.(value) ?? [true, undefined];
  }
}
