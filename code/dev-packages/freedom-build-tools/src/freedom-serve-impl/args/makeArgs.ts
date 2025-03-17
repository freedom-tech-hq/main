import yargs from 'yargs';

export const makeArgs = (args: string[]) =>
  yargs(args)
    .option('tsconfig', { type: 'string', describe: 'The tsconfig file' })
    .option('entry-points', { type: 'array', describe: 'The entry points to use.  Defaults to the includes list from the tsconfig file.' })
    .demandOption('tsconfig');
