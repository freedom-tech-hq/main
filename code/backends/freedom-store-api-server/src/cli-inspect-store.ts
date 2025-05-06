import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { buildMode, makeTrace } from 'freedom-contexts';
import { getMailAgentUserKeys } from 'freedom-db';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace) => {
    // Input
    const rl = readline.createInterface({ input, output });
    try {
      const credInput = await rl.question('Paste private credentials as JSON (leave blank to use server keys): ');
      let creds;
      if (credInput.trim()) {
        try {
          creds = JSON.parse(credInput);
          console.log('Parsed credentials:', creds);
        } catch (err) {
          console.error('Failed to parse JSON:', err);
          process.exit(1);
        }
      } else {
        const result = await getMailAgentUserKeys(trace);
        if (!result.ok) {
          console.error('Failed to get server keys:', result.value);
          process.exit(1);
        }
        creds = result.value;
        console.log('Loaded server keys:', creds);
      }
    } finally {
      rl.close();
    }

    // Placeholder for next step logic
    console.log('cli-inspect-store main() executed');

    return makeSuccess(undefined);
  },
  {
    onFailure: (error) => {
      console.error('Failed with error:', error.cause ?? error);
      process.exit(1);
    }
  }
);

// Entrypoint
main(makeTrace());
