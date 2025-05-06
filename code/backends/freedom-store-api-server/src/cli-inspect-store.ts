import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import { type Base64String } from 'freedom-basic-data';
import { buildMode, makeTrace } from 'freedom-contexts';
// import { getMailAgentUserKeys } from 'freedom-db';
import { decryptEmailCredentialWithPassword, type EmailCredential } from 'freedom-email-user';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace) => {
    let creds: EmailCredential;

    // Input
    const rl = readline.createInterface({ input, output });
    try {
      const credInput = (await rl.question('Paste private credentials as JSON (leave blank to use server keys): ')).trim();
      if (credInput !== '') {
        const password = await rl.question('Enter password for credential: ');

        const result = await decryptEmailCredentialWithPassword(trace, {
          encryptedEmailCredential: credInput as Base64String,
          password
        });
        if (!result.ok) {
          console.error('Failed to decrypt credential:', result.value);
          process.exit(1);
        }

        creds = result.value;
      } else {
        // TODO:
        // const result = await getMailAgentUserKeys(trace);
        // if (!result.ok) {
        //   console.error('Failed to get server keys:', result.value);
        //   process.exit(1);
        // }
        // creds = result.value;
        // console.log('Loaded server keys:', creds);
        throw new Error('Not implemented');
      }
    } finally {
      rl.close();
    }

    // Placeholder for next step logic
    console.log('cli-inspect-store main() executed', creds);
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
