export const getEnv = (name: string, defaultValue: string | undefined): string | undefined => {
  try {
    return process.env[name] ?? defaultValue;
  } catch (_e) {
    return defaultValue;
  }
};
