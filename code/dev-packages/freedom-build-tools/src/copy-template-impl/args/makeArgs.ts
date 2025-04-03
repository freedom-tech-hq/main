import yargs from 'yargs';

export const makeArgs = (args: string[]) =>
  yargs(args)
    .option('include', { type: 'array', describe: 'The files to include.  Supports globs.' })
    .option('exclude', { type: 'array', describe: 'The files to exclude that would otherwise be matched by include.  Supports globs.' })
    .option('drop-prefixes', {
      type: 'array',
      describe: 'The prefixes to be removed, from the input file paths, before the output files are stored.'
    })
    .option('outdir', { type: 'string', describe: 'The folder to copy into.' })
    .demandOption('include')
    .demandOption('outdir');
