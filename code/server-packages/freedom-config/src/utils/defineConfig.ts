/**
 * Unified package configuration
 * @param testDefaults - Default configuration values
 * @returns Functions
 */
export function defineConfig<Config extends Record<string, unknown>>(testDefaults: Config) {
  // Active values
  let activeConfig: Config | undefined = undefined;

  /**
   * Regular initialization
   * @param config - Complete configuration object. Expected to be readonly and frozen
   */
  function initConfig(config: Config): void {
    activeConfig = config;
  }

  /**
   * Reduced initialization
   * @param config - Partial configuration object that overrides defaults
   */
  function initConfigForTests(config: Partial<Config>): void {
    // Clone preserving testDefaults getters
    activeConfig = Object.create({}, Object.getOwnPropertyDescriptors(testDefaults)) as Config;

    // Apply overrides
    for (const [key, value] of Object.entries(config)) {
      activeConfig[key as keyof Config] = value as Config[keyof Config];
    }
  }

  /**
   * Get a configuration value by key
   * @param key - Configuration key
   * @returns The value for the specified key
   * @throws Error if configuration has not been initialized
   */
  function getConfig<K extends keyof Config>(key: K): Config[K] {
    if (activeConfig === undefined) {
      throw new Error('Configuration not initialized. Call initConfig() or initConfigForTests() first.');
    }
    return activeConfig[key];
  }

  return {
    initConfig,
    initConfigForTests,
    getConfig
  };
}
