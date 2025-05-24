import esbuild from 'esbuild';
import inlineImage from 'esbuild-plugin-inline-image';
import esbuildPluginTsc from 'esbuild-plugin-tsc';

import { FORWARDED_ENV } from '../consts/forwarded-env.ts';
import { makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin } from '../esbuild-plugins/freedomBuildAndFixImportAndExportFileExtensionsPlugin.ts';
import { readPackageJson } from '../utils/readPackageJson.ts';
import type { ServeArgs } from './args/Args.ts';

export const serve = async (args: ServeArgs) => {
  try {
    const packageJson = await readPackageJson();

    const packageName = packageJson.name;

    const dropLabels: string[] = process.env.FREEDOM_BUILD_MODE !== 'DEV' ? ['DEV'] : [];
    const platform = args.platform ?? 'web';
    switch (platform) {
      case 'any':
        break;
      case 'node':
        dropLabels.push('WEB');
        break;
      case 'web':
        dropLabels.push('NODE');
        break;
    }

    const esbuildContext = await esbuild.context({
      entryPoints: args.entryPoints?.map(String) ?? ['./src/index.tsx'],
      outdir: args.serveDir,
      define: FORWARDED_ENV(),
      dropLabels,
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
      entryNames: (process.env.FREEDOM_BUILD_UUID ?? '').length > 0 ? `[name]-${process.env.FREEDOM_BUILD_UUID}` : undefined,
      assetNames: '/static/[ext]/[name]-[hash]',
      plugins: [
        inlineImage({ limit: 0 }),
        esbuildPluginTsc({ force: true, tsconfigPath: args.tsconfig }),
        makeFreedomBuildAndFixImportAndExportFileExtensionsPlugin({ packageName, bundle: true })
      ]
    });

    await esbuildContext.watch();

    const serveResult = await esbuildContext.serve({
      host: process.env.HOST ?? 'localhost',
      port: Number(process.env.PORT ?? 3000),
      certfile: process.env.CERTFILE,
      keyfile: process.env.KEYFILE,
      servedir: args.serveDir,
      fallback: `${args.serveDir}/index.html`
    });

    console.log(`Serving app at ${serveResult.hosts.map((host) => `${host}:${serveResult.port}`).join(', ')}`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};
