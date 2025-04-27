import { log, type PR } from 'freedom-async';
import { makeAsyncResultFunc, makeSuccess } from 'freedom-async';
import type { Base64String, Uuid } from 'freedom-basic-data';
import { makeUuid } from 'freedom-contexts';
import { makeTrace } from 'freedom-contexts';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';

import { getCredentialObjectStore } from '../utils/getCredentialObjectStore.ts';

const router = express.Router();

// Apply security middleware specifically for credential routes
router.use(helmet());
router.use(cors());

// Store an encrypted credential
router.post('/store', express.json(), async (req, res) => {
  const trace = makeTrace('store-credential');
  
  try {
    const { lookupKeyHash, encryptedCredential, description, salt, iv } = req.body;
    
    if (!lookupKeyHash || !encryptedCredential || !salt || !iv) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get credential store
    const credentialStoreResult = await getCredentialObjectStore(trace);
    if (!credentialStoreResult.ok) {
      log().error?.('Failed to get credential store:', credentialStoreResult.value);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    const credentialStore = credentialStoreResult.value;
    
    // Use lookupKeyHash (derived from username+password) as the key
    // This ensures credentials can only be retrieved if both username and password are known
    const createResult = await credentialStore.mutableObject(lookupKeyHash as Uuid).create(trace, {
      encryptedCredential,
      description: description || 'Freedom Email Account',
      salt,
      iv
    });
    
    // Handle existing key (update instead of error)
    if (!createResult.ok && createResult.value.errorCode === 'conflict') {
      // Get the existing credential to update it
      const existing = await credentialStore.mutableObject(lookupKeyHash as Uuid).getMutable(trace);
      if (!existing.ok) {
        log().error?.('Failed to get existing credential:', existing.value);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      // Update with new values
      existing.value.storedValue = {
        encryptedCredential,
        description: description || 'Freedom Email Account',
        salt,
        iv  
      };
      
      // Save the update
      const updateResult = await credentialStore.mutableObject(lookupKeyHash as Uuid).update(trace, existing.value);
      if (!updateResult.ok) {
        log().error?.('Failed to update credential:', updateResult.value);
        return res.status(500).json({ error: 'Internal server error' });
      }
    } else if (!createResult.ok) {
      log().error?.('Failed to create credential:', createResult.value);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    log().info?.(`Stored credential with lookup key hash: ${lookupKeyHash.substring(0, 8)}...`);
    return res.status(200).json({ success: true });
  } catch (error) {
    log().error?.('Error storing credential:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve an encrypted credential
router.post('/retrieve', express.json(), async (req, res) => {
  const trace = makeTrace('retrieve-credential');
  
  try {
    const { lookupKeyHash } = req.body;
    
    if (!lookupKeyHash) {
      return res.status(400).json({ error: 'Missing lookup key hash' });
    }
    
    // Get credential store
    const credentialStoreResult = await getCredentialObjectStore(trace);
    if (!credentialStoreResult.ok) {
      log().error?.('Failed to get credential store:', credentialStoreResult.value);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    const credentialStore = credentialStoreResult.value;
    
    // Get the credential using the lookup key hash
    const credentialResult = await credentialStore.object(lookupKeyHash as Uuid).get(trace);
    if (!credentialResult.ok) {
      if (credentialResult.value.errorCode === 'not-found') {
        return res.status(404).json({ error: 'Credential not found' });
      }
      
      log().error?.('Failed to retrieve credential:', credentialResult.value);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    // Return the credential data
    return res.status(200).json(credentialResult.value);
  } catch (error) {
    log().error?.('Error retrieving credential:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;