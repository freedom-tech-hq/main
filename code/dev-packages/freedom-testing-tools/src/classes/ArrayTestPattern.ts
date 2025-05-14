import { genericValueToString } from '../internal/utils/genericValueToString.ts';
import { genericValueType } from '../internal/utils/genericValueType.ts';
import { TestPattern } from './TestPattern.ts';

export class ArrayTestPattern extends TestPattern<any[]> {
  constructor(private readonly checker?: (value: any[]) => [boolean, string | undefined]) {
    super();
  }

  public override evaluate(value: any[]): [boolean, string | undefined] {
    if (!Array.isArray(value)) {
      return [false, `Expected an array, found ${genericValueType(value)}: ${genericValueToString(value)}`];
    }

    return this.checker?.(value) ?? [true, undefined];
  }
}
