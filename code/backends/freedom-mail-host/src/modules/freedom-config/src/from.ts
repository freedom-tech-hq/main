import envVar from 'env-var';
import type { Extensions } from 'env-var';

/**
 * Extends the env-var variable with custom validators
 */
const extensions = {
  /**
   * Custom validator that allows transforming the string value to any type
   * @param value The env variable value
   * @param validator Function that validates and transforms the string value
   * @returns The transformed value
   */
  asCustom<T>(value: string, validator: (value: string) => T): T {
    return validator(value);
  }
} satisfies Extensions;

/**
 * Enhanced version of env-var's from function with custom validators
 * @param env Object containing environment variables (process.env on backend, import.meta.env on frontend)
 * @returns Enhanced env-var instance with custom validators
 */
export function from(env: Record<string, string | undefined>) {
  return envVar.from(env, extensions);
}
