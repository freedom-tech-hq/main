export const getEnv = (name: string, defaultValue: string | undefined): string | undefined => {
  try {
    return process.env[name];
  } catch (_e) {
    return defaultValue;
  }
};
