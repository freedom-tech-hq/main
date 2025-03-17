import yargs from 'yargs';

export const makeArgs = (args: string[]) =>
  yargs(args)
    .option('tsconfig', { type: 'string', describe: 'The tsconfig file' })
    .option('bundle', { type: 'boolean', default: false, describe: 'If true, the build is bundled' })
    .option('entry-points', { type: 'array', describe: 'The entry points to use.  Defaults to the includes list from the tsconfig file.' })
    .option('splitting', { type: 'boolean', default: false, describe: 'If true, code splitting is enabled' })
    .demandOption('tsconfig');
