import { log } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';

// URL for credential API endpoints (follows the yaschema-api pattern)
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.freedommail.me' 
  : 'http://localhost:3001';

/**
 * Creates a lookup key derived from both username and password
 * This ensures credentials can only be retrieved if both values are known
 */
export const createLookupKeyHash = async (username: string, password: string): Promise<string> => {
  // Create a composite value
  const composite = `${username}:${password}`;
  
  // Convert the composite to a byte array
  const encoder = new TextEncoder();
  const data = encoder.encode(composite);
  
  // Hash the composite value using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

/**
 * Securely derives an encryption key from a password
 */
export const deriveKeyFromPassword = async (
  password: string, 
  salt: Uint8Array
): Promise<CryptoKey> => {
  // Import the password as key material
  const encoder = new TextEncoder();
  const passwordKeyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive the key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000, // High iteration count for security
      hash: 'SHA-256'
    },
    passwordKeyMaterial,
    { name: 'AES-GCM', length: 256 },
    true, // Extractable
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypts a credential with a derived key
 */
export const encryptCredential = async (
  credential: string,
  key: CryptoKey
): Promise<{ encryptedData: string, iv: Uint8Array }> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(credential);
  
  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
  
  // Convert to Base64 for storage
  const encryptedData = btoa(
    String.fromCharCode(...new Uint8Array(encryptedBuffer))
  );
  
  return { encryptedData, iv };
};

/**
 * Decrypts a credential using a derived key
 */
export const decryptCredential = async (
  encryptedData: string,
  key: CryptoKey,
  iv: Uint8Array
): Promise<string> => {
  // Convert Base64 to array buffer
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Decrypt
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encryptedBytes
  );
  
  // Convert to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
};

/**
 * Stores an encrypted credential on the server
 */
export const storeCredentialOnServer = async (
  username: string,
  password: string,
  encryptedCredential: Base64String,
  description: string,
  salt: Uint8Array,
  iv: Uint8Array
): Promise<boolean> => {
  try {
    // Generate a lookup key hash from both username and password
    const lookupKeyHash = await createLookupKeyHash(username, password);
    
    const response = await fetch(`${API_BASE_URL}/api/credentials/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        lookupKeyHash,
        encryptedCredential,
        description,
        salt: Array.from(salt), // Convert to array for JSON serialization
        iv: Array.from(iv)      // Convert to array for JSON serialization
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      log().error?.('Failed to store credential on server:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    log().error?.('Error storing credential on server:', error);
    return false;
  }
};

/**
 * Retrieves an encrypted credential from the server
 */
export const retrieveCredentialFromServer = async (
  username: string,
  password: string
): Promise<{ 
  encryptedCredential: Base64String, 
  description: string,
  salt: Uint8Array, 
  iv: Uint8Array 
} | null> => {
  try {
    // Generate a lookup key hash from both username and password
    const lookupKeyHash = await createLookupKeyHash(username, password);
    
    const response = await fetch(`${API_BASE_URL}/api/credentials/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lookupKeyHash })
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log().info?.('No credential found for this username/password combination');
      } else {
        const error = await response.json();
        log().error?.('Failed to retrieve credential from server:', error);
      }
      return null;
    }
    
    const data = await response.json();
    
    return {
      encryptedCredential: data.encryptedCredential,
      description: data.description,
      salt: new Uint8Array(data.salt),
      iv: new Uint8Array(data.iv)
    };
  } catch (error) {
    log().error?.('Error retrieving credential from server:', error);
    return null;
  }
};