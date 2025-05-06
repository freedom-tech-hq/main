import { stdin as input, stdout as output } from 'node:process';
import readline from 'node:readline/promises';

import { makeAsyncResultFunc, makeFailure, makeSuccess, type PR, uncheckedResult } from 'freedom-async';
import { type Base64String } from 'freedom-basic-data';
import { NotFoundError } from 'freedom-common-errors';
import { buildMode, makeTrace } from 'freedom-contexts';
import type { CryptoKeySetId, PrivateCombinationCryptoKeySet } from 'freedom-crypto-data';
import type { UserKeys } from 'freedom-crypto-service';
// import { getMailAgentUserKeys } from 'freedom-db';
import { decryptEmailCredentialWithPassword } from 'freedom-email-user';
import { storageRootIdInfo } from 'freedom-sync-types';
import { prettyStoreLs } from 'freedom-syncable-store/tests';
import { getServerSyncableStore } from 'freedom-syncable-store-server';
import type { MutableSyncableStore } from 'freedom-syncable-store-types';

import { initApp } from './initApp.ts';

let expectedBuildMode = 'PROD' as 'DEV' | 'PROD';
DEV: expectedBuildMode = 'DEV';
if (expectedBuildMode !== buildMode) {
  throw new Error(`Build mode mismatch: ${buildMode} !== ${expectedBuildMode}`);
}

const main = makeAsyncResultFunc(
  [import.meta.filename],
  async (trace) => {
    let store: MutableSyncableStore;

    // Setup
    await uncheckedResult(initApp(trace));

    // Input
    const rl = readline.createInterface({ input, output });
    try {
      const credInput = (await rl.question('Paste private credentials as JSON (leave blank to use server keys): ')).trim();
      if (credInput !== '') {
        const password = await rl.question('Enter password for credential: ');

        const credsResult = await decryptEmailCredentialWithPassword(trace, {
          encryptedEmailCredential: credInput as Base64String,
          password
        });
        if (!credsResult.ok) {
          console.error('Failed to decrypt credential:', credsResult.value);
          process.exit(1);
        }

        const creds = credsResult.value;
        const storeResult = await getServerSyncableStore(trace, {
          storageRootId: storageRootIdInfo.make(creds.userId),
          userKeys: {
            getPrivateCryptoKeySetIds: makeAsyncResultFunc(
              [import.meta.filename, 'getPrivateCryptoKeySetIds'],
              async (_trace): PR<CryptoKeySetId[]> => makeSuccess([creds.privateKeys.id])
            ),

            getPrivateCryptoKeySet: makeAsyncResultFunc(
              [import.meta.filename, 'getPrivateCryptoKeySet'],
              async (trace, id?: CryptoKeySetId): PR<PrivateCombinationCryptoKeySet, 'not-found'> => {
                if (id === undefined || id === creds.privateKeys.id) {
                  return makeSuccess(creds.privateKeys);
                }

                return makeFailure(new NotFoundError(trace, { message: `No signing key found with ID: ${id}`, errorCode: 'not-found' }));
              }
            )
          } satisfies UserKeys,
          saltsById: creds.saltsById,
          creatorPublicKeys: creds.privateKeys.publicOnly()
        });
        if (!storeResult.ok) {
          console.error('Failed to get store:', storeResult.value);
          process.exit(1);
        }

        store = storeResult.value;
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

    // Expose
    await prettyStoreLs(store);

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
