#!/usr/bin/env node

/**
 * TODO: Remove this file. This is a part of the mocked crypto-module.
 *
 * decode.js
 *
 * Simple utility to decrypt emails encrypted by encrypt_incoming.js
 * Usage: node decode.js <private-key-file-path> <encrypted-email-file-path>
 */

const fs = require('fs');
const openpgp = require('openpgp');

// Check arguments
if (process.argv.length < 4) {
  console.error('Usage: node decode.js <private-key-file-path> <encrypted-email-file-path>');
  process.exit(1);
}

const privateKeyPath = process.argv[2];
const encryptedEmailPath = process.argv[3];

async function decryptEmail() {
  try {
    // Read the private key
    const privateKeyArmored = fs.readFileSync(privateKeyPath, 'utf8');

    // Read the encrypted email
    const encryptedMessage = fs.readFileSync(encryptedEmailPath, 'utf8');

    // Parse the private key
    const privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

    // Decrypt the private key with passphrase
    const passphrase = 'testpassword';
    const decryptedPrivateKey = await openpgp.decryptKey({
      privateKey,
      passphrase
    });

    // Decrypt the message
    const message = await openpgp.readMessage({
      armoredMessage: encryptedMessage
    });

    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: decryptedPrivateKey
    });

    // Output the decrypted email
    console.log(decrypted);

  } catch (error) {
    console.error(`Error decrypting email: ${error.message}`);
    process.exit(1);
  }
}

// Run the decryption
decryptEmail();
