import type { JsonValue } from 'yaschema';

/** `LogJson` values can be specially looked for during log processing to, for example, log structured data interpretable by tools like
 * Google cloud logging or Splunk */
export class LogJson {
  constructor(
    public readonly name: string,
    public readonly value: JsonValue
  ) {}
}
