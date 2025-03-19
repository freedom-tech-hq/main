import fs from 'node:fs/promises';
import { dirname } from 'node:path';
import type { TestContext } from 'node:test';
import { beforeEach, describe, it } from 'node:test';

import { makeTrace } from 'freedom-contexts';
import { LOCALIZE, registerNamespaceLoaderForLanguage } from 'freedom-localization';
import type { ResourceKey } from 'i18next';

import { init } from '../config/init.ts';
import { getT } from '../utils/getT.ts';

const ns = 'test';
const $fixedMessage = LOCALIZE('My Message')({ ns });
const $parameterizedMessage = LOCALIZE`Hello: ${'name'}`({ ns });

describe('localization', () => {
  beforeEach(() => {
    init({ defaultLanguage: 'en', supportedLanguages: ['en', 'fr'] });
  });

  it('should work with default language', async (tc: TestContext) => {
    const trace = makeTrace('test');

    const t = await getT(trace, 'en');
    tc.assert.strictEqual($fixedMessage(t), 'My Message');
    tc.assert.strictEqual($parameterizedMessage(t, { name: 'World' }), 'Hello: World');
  });

  it('should work with non-default language', async (tc: TestContext) => {
    const trace = makeTrace('test');

    registerNamespaceLoaderForLanguage('fr', 'test', async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 1000));

      const data = await fs.readFile(`${dirname(import.meta.dirname)}/../fixtures/fr.json`, 'utf-8');
      return JSON.parse(data) as Record<string, ResourceKey | undefined>;
    });

    const t = await getT(trace, 'fr');
    tc.assert.strictEqual($fixedMessage(t), 'Mon Message');
    tc.assert.strictEqual($parameterizedMessage(t, { name: 'World' }), 'Bonjour: World');
  });
});
