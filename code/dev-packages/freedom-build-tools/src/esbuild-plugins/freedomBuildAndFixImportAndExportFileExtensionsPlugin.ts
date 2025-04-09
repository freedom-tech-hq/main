import fs from 'node:fs/promises';

import type { Plugin } from 'esbuild';
import { escapeRegExp } from 'lodash-es';

const importDirectSingleQuoteRegex = /import\s+'(\.\.?\/[^']+)\.[jt]sx?'/gm;
const importDirectDoubleQuoteRegex = /import\s+"(\.\.?\/[^"]+)\.[jt]sx?"/gm;
const dynamicImportSingleQuoteRegex = /import\s*\(\s*'(\.\.?\/[^']+)\.[jt]sx?'\s*\)/gm;
const dynamicImportDoubleQuoteRegex = /import\s*\(\s*"(\.\.?\/[^"]+)\.[jt]sx?"\s*\)/gm;
const importFromSingleQuoteRegex = /from\s+'(\.\.?\/[^']+)\.[jt]sx?'/gm;
const importFromDoubleQuoteRegex = /from\s+"(\.\.?\/[^"]+)\.[jt]sx?"/gm;
const anyImportRegex = new RegExp(
  [
    importDirectSingleQuoteRegex,
    importDirectDoubleQuoteRegex,
    dynamicImportSingleQuoteRegex,
    dynamicImportDoubleQuoteRegex,
    importFromSingleQuoteRegex,
    importFromDoubleQuoteRegex
  ]
    .map((regex) => `(?:${regex.source})`)
    .join('|'),
  'gm'
);

export const makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin = ({
  packageName,
  bundle
}: {
  packageName: string;
  bundle: boolean;
}): Plugin => {
  const leadingCwdWithOptSrcAndFileExtensionRegex = new RegExp(`^${escapeRegExp(process.cwd())}(?:/src)?|\\.(?:[jt]sx?|[cm]js)$`, 'g');

  return {
    name: 'freedom-build-and-fix-import-and-export-file-extensions',
    setup(build) {
      build.onLoad({ filter: /\.(?:[jt]sx?|[cm]js)$/ }, async (args) => {
        if (args.path.includes('/node_modules/')) {
          return {};
        }

        const replacement = `${packageName}${args.path.replace(leadingCwdWithOptSrcAndFileExtensionRegex, '')}`;

        const source = await fs.readFile(args.path, 'utf-8');
        let contents = source.replace(/import\.meta\.filename/g, JSON.stringify(replacement));

        // When bundling we don't want to update the import extensions since they'll be processed by esbuild
        if (!bundle) {
          contents = contents.replace(anyImportRegex, (match) =>
            match
              .replace(importDirectSingleQuoteRegex, "import '$1.mjs'")
              .replace(importDirectDoubleQuoteRegex, 'import "$1.mjs"')
              .replace(dynamicImportSingleQuoteRegex, "import('$1.mjs')")
              .replace(dynamicImportDoubleQuoteRegex, 'import("$1.mjs")')
              .replace(importFromSingleQuoteRegex, "from '$1.mjs'")
              .replace(importFromDoubleQuoteRegex, 'from "$1.mjs"')
          );
        }

        return { contents, loader: 'default' };
      });
    }
  };
};
