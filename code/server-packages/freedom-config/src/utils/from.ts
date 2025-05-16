import envVar from 'env-var';

export interface ExtendedFrom<Container extends Record<string, string | undefined>> {
  /**
   * Gets the specified environment variable and, if it is set, applies the custom transformer.
   * @param varName - The name of the environment variable to get
   * @param transformer - Function that validates and transforms the string value
   * @returns The transformed value or `undefined` if the environment variable isn't set
   */
  getAsCustom<T>(varName: keyof Container, transformer: (value: string) => T): T | undefined;

  /**
   * Gets the specified environment variable and, if it is not set, throws an error.
   * @param varName - The name of the environment variable to get
   * @param transformer - Function that validates and transforms the string value
   * @returns The transformed value
   */
  getRequiredAsCustom<T>(varName: keyof Container, transformer: (value: string) => T): T;
}

/**
 * Enhanced version of env-var's from function with custom validators
 * @param env - Object containing environment variables (process.env on backend, import.meta.env on frontend)
 * @returns Enhanced env-var instance with custom validators
 */
export function from<Container extends Record<string, string | undefined>>(env: Container) {
  const defaultFrom = envVar.from(env);

  const out = defaultFrom as typeof defaultFrom & Partial<ExtendedFrom<Container>>;

  out.getAsCustom = <T>(varName: keyof Container, transformer: (value: string) => T): T | undefined => {
    const value = defaultFrom.get(varName).asString();
    if (value === undefined) {
      return undefined;
    }

    return transformer(value);
  };

  out.getRequiredAsCustom = <T>(varName: keyof Container, transformer: (value: string) => T): T => {
    const value = defaultFrom.get(varName).required().asString();

    return transformer(value);
  };

  return out as typeof defaultFrom & ExtendedFrom<Container>;
}
