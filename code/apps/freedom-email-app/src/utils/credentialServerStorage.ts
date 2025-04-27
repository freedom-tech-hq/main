import { log } from 'freedom-async';
import type { Base64String } from 'freedom-basic-data';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.freedommail.me/api/credentials' 
  : 'http://localhost:3001/api/credentials';

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
  encryptedCredential: Base64String,
  description: string,
  salt: Uint8Array,
  iv: Uint8Array
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
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
  username: string
): Promise<{ 
  encryptedCredential: Base64String, 
  description: string,
  salt: Uint8Array, 
  iv: Uint8Array 
} | null> => {
  try {
    const response = await fetch(`${API_URL}/retrieve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        log().info?.('No credential found for this username');
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