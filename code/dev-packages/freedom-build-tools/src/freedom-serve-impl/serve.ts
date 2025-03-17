import esbuild from 'esbuild';
import inlineImage from 'esbuild-plugin-inline-image';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

import { FORWARDED_ENV } from '../consts/forwarded-env.ts';
import { makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin } from '../esbuild-plugins/freedomBuildAndFixImportAndExportFileExtensionsPlugin.ts';
import { makeFreedomFixInlineImageLocations } from '../esbuild-plugins/freedomFixInlineImageLocations.ts';
import { readPackageJson } from '../utils/readPackageJson.ts';
import type { ServeArgs } from './args/Args.ts';

export const serve = async (args: ServeArgs) => {
  try {
    const packageJson = await readPackageJson();

    const packageName = packageJson.name;

    const esbuildContext = await esbuild.context({
      entryPoints: args.entryPoints?.map(String) ?? ['./src/index.tsx'],
      outdir: './build/static/js',
      define: FORWARDED_ENV(),
      dropLabels: process.env.FREEDOM_BUILD_MODE !== 'DEV' ? ['DEV'] : ['PROD'],
      sourcemap: true,
      bundle: true,
      tsconfig: args.tsconfig,
      splitting: false,
      treeShaking: true,
      format: 'esm',
      outExtension: { '.js': '.mjs' },
      loader: {
        '.js': 'jsx'
      },
      assetNames: '/static/[ext]/[name]-[hash]',
      plugins: [
        inlineImage({ limit: 0 }),
        esbuildPluginTsc({ force: true, tsconfigPath: args.tsconfig }),
        makeFreedomFixInlineImageLocations(),
        makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin({ packageName, bundle: true })
      ]
    });

    await esbuildContext.watch();

    const serveResult = await esbuildContext.serve({
      host: process.env.HOST ?? 'localhost',
      port: Number(process.env.PORT ?? 3000),
      certfile: process.env.CERTFILE,
      keyfile: process.env.KEYFILE,
      servedir: 'build',
      fallback: 'build/index.html'
    });

    // For esbuild 0.25+
    // console.log(`Serving app at ${serveResult.hosts.map((host) => `${host}:${serveResult.port}`).join(', ')}`);
    console.log(`Serving app at ${serveResult.host}:${serveResult.port}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
