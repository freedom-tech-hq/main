import fs from 'node:fs/promises';

import type { Plugin } from 'esbuild';
import { escapeRegExp } from 'lodash-es';

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
          contents = contents
            .replace(/from\s+'(\.\.?\/[^']+)\.[jt]s'/gm, "from '$1.mjs'")
            .replace(/from\s+"(\.\.?\/[^"]+)\.[jt]s"/gm, 'from "$1.mjs"');
        }

        return { contents, loader: 'default' };
      });
    }
  };
};
