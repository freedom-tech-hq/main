import yargs from 'yargs';

export const makeArgs = (args: string[]) =>
  yargs(args)
    .option('tsconfig', { type: 'string', describe: 'The tsconfig file' })
    .option('entry-points', {
      type: 'array',
      describe: 'The entry points to use',
      defaultDescription: 'the includes list from the tsconfig file'
    })
    .option('tailwind-css-entry-points', { type: 'array', describe: 'The entry points to use for Tailwind CSS' })
    .option('serve-dir', { type: 'string', describe: 'The directory to serve from', default: 'build', defaultDescription: 'build' })
    .demandOption('tsconfig');
