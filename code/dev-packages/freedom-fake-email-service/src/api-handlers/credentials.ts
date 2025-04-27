import { log, makeSuccess, uncheckedResult } from 'freedom-async';
import { makeUuid } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import { api } from 'freedom-fake-email-service-api';
import { makeHttpApiHandler } from 'freedom-server-api-handling';
import { StatusCodes } from 'http-status-codes';

import type { ServerStoredCredential } from '../../freedom-store-api-server/src/types/ServerStoredCredential.ts';
import { getCredentialObjectStore } from '../../freedom-store-api-server/src/utils/getCredentialObjectStore.ts';

// Handler for storing credentials
export const storeHandler = makeHttpApiHandler([import.meta.filename], { api: api.credentials.STORE }, async (trace, req) => {
  const { lookupKeyHash, encryptedCredential, description, salt, iv } = req.body;
  
  // Get credential store
  const credentialStoreResult = await getCredentialObjectStore(trace);
  if (!credentialStoreResult.ok) {
    log().error?.('Failed to get credential store:', credentialStoreResult.value);
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
  }
  
  const credentialStore = credentialStoreResult.value;
  
  // Use lookupKeyHash as the key (derived from username+password)
  const createResult = await credentialStore.mutableObject(lookupKeyHash).create(trace, {
    encryptedCredential,
    description: description || 'Freedom Email Account',
    salt,
    iv
  });
  
  // Handle existing key (update instead of error)
  if (!createResult.ok && createResult.value.errorCode === 'conflict') {
    // Get the existing credential to update it
    const existing = await credentialStore.mutableObject(lookupKeyHash).getMutable(trace);
    if (!existing.ok) {
      log().error?.('Failed to get existing credential:', existing.value);
      return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
    }
    
    // Update with new values
    existing.value.storedValue = {
      encryptedCredential,
      description: description || 'Freedom Email Account',
      salt,
      iv  
    };
    
    // Save the update
    const updateResult = await credentialStore.mutableObject(lookupKeyHash).update(trace, existing.value);
    if (!updateResult.ok) {
      log().error?.('Failed to update credential:', updateResult.value);
      return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
    }
  } else if (!createResult.ok) {
    log().error?.('Failed to create credential:', createResult.value);
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
  }
  
  log().info?.(`Stored credential with lookup key hash: ${lookupKeyHash.substring(0, 8)}...`);
  return makeSuccess({ body: { success: true } });
});

// Handler for retrieving credentials
export const retrieveHandler = makeHttpApiHandler([import.meta.filename], { api: api.credentials.RETRIEVE }, async (trace, req) => {
  const { lookupKeyHash } = req.body;
  
  // Get credential store
  const credentialStoreResult = await getCredentialObjectStore(trace);
  if (!credentialStoreResult.ok) {
    log().error?.('Failed to get credential store:', credentialStoreResult.value);
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
  }
  
  const credentialStore = credentialStoreResult.value;
  
  // Get the credential using the lookup key hash
  const credentialResult = await credentialStore.object(lookupKeyHash).get(trace);
  if (!credentialResult.ok) {
    if (credentialResult.value.errorCode === 'not-found') {
      return { status: StatusCodes.NOT_FOUND, body: { error: 'Credential not found' } };
    }
    
    log().error?.('Failed to retrieve credential:', credentialResult.value);
    return { status: StatusCodes.INTERNAL_SERVER_ERROR, body: { error: 'Internal server error' } };
  }
  
  // Return the credential data
  return makeSuccess({ body: credentialResult.value });
});

export default [storeHandler, retrieveHandler];