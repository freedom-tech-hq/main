import esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

import { FORWARDED_ENV } from '../consts/forwarded-env.ts';
import { makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin } from '../esbuild-plugins/freedomBuildAndFixImportAndExportFileExtensionsPlugin.ts';
import { findTsFiles } from '../utils/findTsFiles.ts';
import { readPackageJson } from '../utils/readPackageJson.ts';
import { readTsConfig } from '../utils/readTsConfig.ts';
import type { BuildArgs } from './args/Args.ts';

export const build = async (args: BuildArgs) => {
  try {
    const packageJson = await readPackageJson();
    const tsConfig = await readTsConfig({ tsconfigPath: args.tsconfig });

    const packageName = packageJson.name;

    const outDir = tsConfig.compilerOptions.outDir;
    const getDefaultEntryPoints = async () => await findTsFiles({ includes: tsConfig.include ?? [], excludes: tsConfig.exclude ?? [] });

    await esbuild.build({
      entryPoints: args.entryPoints?.map(String) ?? (await getDefaultEntryPoints()),
      outdir: outDir,
      define: FORWARDED_ENV(),
      dropLabels: process.env.FREEDOM_BUILD_MODE !== 'DEV' ? ['DEV'] : ['PROD'],
      sourcemap: true,
      bundle: args.bundle ?? false,
      tsconfig: args.tsconfig,
      splitting: args.splitting ?? false,
      treeShaking: false,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
      loader: {
        '.js': 'jsx'
      },
      plugins: [
        esbuildPluginTsc({ force: true, tsconfigPath: args.tsconfig }),
        makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin({ packageName, bundle: args.bundle ?? false })
      ]
    });
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
