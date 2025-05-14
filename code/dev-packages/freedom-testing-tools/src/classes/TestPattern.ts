export abstract class TestPattern<T> {
  /** If `false`, the second value may be a message */
  abstract evaluate(value: T): [boolean, string | undefined];
}
