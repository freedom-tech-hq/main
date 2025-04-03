import console from 'node:console';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TypeOrPromisedType } from 'yaschema';

import { findFiles } from '../utils/findFiles.ts';
import type { CopyTemplateArgs } from './args/Args.ts';

export const copyTemplate = async (args: CopyTemplateArgs) => {
  try {
    const dropPrefixes = args.dropPrefixes?.map(String) ?? [];
    // Sorting in reverse order so longer common prefixes are dropped first
    dropPrefixes.sort((a, b) => b.localeCompare(a));

    const applyDropPrefixes = (path: string): string => {
      for (const dropPrefix of dropPrefixes) {
        if (path.startsWith(dropPrefix)) {
          return path.substring(dropPrefix.length);
        }
      }

      return path;
    };

    const foundFiles = await findFiles({ includes: args.include.map(String), excludes: args.exclude?.map(String) ?? [] });
    await Promise.all(
      foundFiles.map(async (foundPath) => {
        if (foundPath.endsWith('.template.mjs')) {
          const script = (await import(path.resolve(foundPath))) as { default: () => TypeOrPromisedType<string | Uint8Array> };
          const generated = await script.default();
          const destPath = path.resolve(args.outdir, applyDropPrefixes(foundPath.substring(0, foundPath.length - '.template.mjs'.length)));

          const destDir = path.dirname(destPath);
          await fs.mkdir(destDir, { recursive: true });

          if (typeof generated === 'string') {
            console.log(`Copying result of string template into ${destPath}`);
            await fs.writeFile(destPath, generated, 'utf-8');
          } else {
            console.log(`Copying result of binary template into ${destPath}`);
            await fs.writeFile(destPath, generated);
          }
        } else {
          const destPath = path.resolve(args.outdir, foundPath);

          const destDir = path.dirname(destPath);
          await fs.mkdir(destDir, { recursive: true });

          console.log(`Copying regular file into ${destPath}`);
          await fs.copyFile(foundPath, destPath);
        }
      })
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
