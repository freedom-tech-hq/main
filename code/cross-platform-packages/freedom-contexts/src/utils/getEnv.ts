import type { TypeOrPromisedType } from 'yaschema';

const globalEnvOverrides: Partial<Record<string, string>> = {};
const globalEnvVersions: Partial<Record<string, number>> = {};
const globalOnEnvChange: Partial<Record<string, Array<() => TypeOrPromisedType<void>>>> = {};

export const setEnv = (name: string, value: string | undefined) => {
  if (globalEnvOverrides[name] === value) {
    return; // Nothing to do
  }

  globalEnvOverrides[name] = value;
  globalEnvVersions[name] = (globalEnvVersions[name] ?? 0) + 1;

  const triggerFuncs = [...(globalOnEnvChange[name] ?? [])];
  for (const func of triggerFuncs) {
    func();
  }
};

export const getEnv = (name: string, defaultValue: string | undefined): string | undefined => {
  if (globalEnvOverrides[name] !== undefined) {
    return globalEnvOverrides[name];
  }

  try {
    return process.env[name] ?? defaultValue;
  } catch (_e) {
    return defaultValue;
  }
};

/** Makes a function that is updated anytime the environment is changed using `setEnv` */
export const makeEnvDerivative = <ArgsT extends any[], ReturnT>(
  name: string,
  defaultValue: string | undefined,
  func: (value: string | undefined) => (...args: ArgsT) => ReturnT
): ((...args: ArgsT) => ReturnT) => {
  let lastVersion = globalEnvVersions[name] ?? 0;
  let cached = func(getEnv(name, defaultValue));

  return (...args: ArgsT): ReturnT => {
    const nextVersion = globalEnvVersions[name] ?? 0;
    if (nextVersion === lastVersion) {
      return cached(...args);
    }

    lastVersion = nextVersion;
    cached = func(getEnv(name, defaultValue));
    return cached(...args);
  };
};

/** Registers a global callback that is run any time the environment is changed using `setEnv` */
export const onEnvChange = (
  name: string,
  defaultValue: string | undefined,
  func: (value: string | undefined) => TypeOrPromisedType<void>
): TypeOrPromisedType<void> => {
  const update = () => func(getEnv(name, defaultValue));

  globalOnEnvChange[name] = globalOnEnvChange[name] ?? [];
  globalOnEnvChange[name].push(update);

  update();
};
