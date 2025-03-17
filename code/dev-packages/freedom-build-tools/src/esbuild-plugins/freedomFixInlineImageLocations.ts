import { basename } from 'node:path';

import type { Plugin } from 'esbuild';
import fs from 'fs-extra';
import { glob } from 'glob';

export const makeFreedomFixInlineImageLocations = (): Plugin => {
  return {
    name: 'freedom-fix-inline-image-locations',
    setup: (build) => {
      build.onEnd(async () => {
        const toBeMoved = await glob(['./build/static/js/static/*']);
        await Promise.all(
          toBeMoved.map(async (toBeMoved) => fs.move(toBeMoved, `./build/static/${basename(toBeMoved)}`, { overwrite: true }))
        );
      });
    }
  };
};
