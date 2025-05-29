import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type { Plugin } from 'esbuild';

export const tailwindCssPlugin = (): Plugin => {
  return {
    name: 'tailwind-css',
    setup(build) {
      build.onLoad({ filter: /\.(?:css)$/ }, async (args) => {
        if (args.path.includes('/node_modules/')) {
          return {};
        }

        const tempPath = path.join(os.tmpdir(), `twcss-${Date.now()}.css`);

        await new Promise<void>((resolve, reject) => {
          execFile('npx', ['@tailwindcss/cli', '-i', args.path, '-o', tempPath], (err, stdout, stderr) => {
            console.log(stdout);
            console.error(stderr);

            if (err === null) {
              resolve();
            } else {
              // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
              reject(err);
            }
          });
        });

        const contents = await fs.readFile(tempPath, 'utf-8');

        return { contents, loader: 'default' };
      });
    }
  };
};
