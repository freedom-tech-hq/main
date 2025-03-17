import yargs from 'yargs';

import type { BuildArgs } from './args/Args.ts';
import { makeArgs } from './args/makeArgs.ts';

export const runApp = (
  args: string[],
  commandCallbacks: {
    main: (args: BuildArgs) => Promise<void>;
  }
) =>
  yargs(args)
    .parserConfiguration({ 'unknown-options-as-args': true })
    .help(false)
    .command({
      command: '$0',
      builder: {},
      handler: async (args) => {
        const parsedArgs = await makeArgs(args._ as string[]).parse();
        commandCallbacks.main(parsedArgs);
      }
    })
    .parse();
