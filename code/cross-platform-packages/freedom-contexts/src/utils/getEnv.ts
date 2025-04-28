import type { TypeOrPromisedType } from 'yaschema';

const globalEnvOverrides: Partial<Record<string, string>> = {};
const globalEnvVersions: Partial<Record<string, number>> = {};
const globalOnEnvChange: Partial<Record<string, Array<() => TypeOrPromisedType<void>>>> = {};

export let getEnv = (_name: string, defaultValue: string | undefined): string | undefined => {
  return defaultValue;
};

DEV: {
  getEnv = (name, defaultValue) => {
    if (globalEnvOverrides[name] !== undefined) {
      return globalEnvOverrides[name];
    }

    try {
      return process.env[name] ?? defaultValue;
    } catch (_e) {
      return defaultValue;
    }
  };
}

/**
 * In DEV build mode, this sets an override for the specified environment variable
 *
 * In PROD build mode, this does nothing
 */
export const devSetEnv = (name: string, value: string | undefined) => {
  DEV: {
    if (globalEnvOverrides[name] === value) {
      return; // Nothing to do
    }

    globalEnvOverrides[name] = value;
    globalEnvVersions[name] = (globalEnvVersions[name] ?? 0) + 1;

    const triggerFuncs = [...(globalOnEnvChange[name] ?? [])];
    for (const func of triggerFuncs) {
      func();
    }
  }
};

/** Gets all of the  */
export let devGetAllEnvOverrides = () => ({});

// Replacing devGetAllEnvOverrides in DEV build mode
DEV: {
  devGetAllEnvOverrides = () => ({ ...globalEnvOverrides });
}

/**
 * In DEV build mode, makes a function that is updated anytime the environment is changed using `devSetEnv`.
 *
 * In PROD build mode, the resulting functions always uses the initial environment value.
 */
export let devMakeEnvDerivative = <ArgsT extends any[], ReturnT>(
  name: string,
  defaultValue: string | undefined,
  func: (value: string | undefined) => (...args: ArgsT) => ReturnT
): ((...args: ArgsT) => ReturnT) => func(getEnv(name, defaultValue));

// Replacing devMakeEnvDerivative in DEV build mode
DEV: {
  devMakeEnvDerivative = <ArgsT extends any[], ReturnT>(
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
}

/**
 * In DEV build mode, registers a global callback that is run any time the environment is changed using `devSetEnv`
 *
 * In PROD build mode, the callback is run once with the initial environment value.
 */
export let devOnEnvChange = (
  name: string,
  defaultValue: string | undefined,
  func: (value: string | undefined) => TypeOrPromisedType<void>
): TypeOrPromisedType<void> => func(getEnv(name, defaultValue));

// Replacing devOnEnvChange in DEV build mode
DEV: {
  devOnEnvChange = (name, defaultValue, func) => {
    const update = () => func(getEnv(name, defaultValue));

    globalOnEnvChange[name] = globalOnEnvChange[name] ?? [];
    globalOnEnvChange[name].push(update);

    update();
  };
}
