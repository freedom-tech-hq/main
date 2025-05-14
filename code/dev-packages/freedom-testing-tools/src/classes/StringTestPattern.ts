import { genericValueToString } from '../internal/utils/genericValueToString.ts';
import { genericValueType } from '../internal/utils/genericValueType.ts';
import { TestPattern } from './TestPattern.ts';

export class StringTestPattern extends TestPattern<string> {
  constructor(private readonly pattern?: RegExp) {
    super();
  }

  public override evaluate(value: string): [boolean, string | undefined] {
    if (typeof value !== 'string') {
      return [false, `Expected a string, found ${genericValueType(value)}: ${genericValueToString(value)}`];
    }

    if (this.pattern === undefined || this.pattern.test(value)) {
      return [true, undefined];
    }

    return [false, `Expected a string matching ${this.pattern}`];
  }
}
