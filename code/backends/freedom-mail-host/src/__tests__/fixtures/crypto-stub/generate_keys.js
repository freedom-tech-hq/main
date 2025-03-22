#!/usr/bin/env node

/**
 * TODO: Remove this file. This is a part of the mocked crypto-module.
 *
 * Generate OpenPGP key pairs for test users and save them in fixtures directory.
 * Uses openpgp.js library instead of relying on the GPG command-line tool.
 */

const fs = require('fs');
const path = require('path');
const openpgp = require('openpgp');
const { promisify } = require('util');
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

// Configuration
const USERS_FILE = path.join(__dirname, './users.json');
const FIXTURES_DIR = __dirname;
const PASSPHRASE = 'testpassword';

async function generateKeyPair(name, email) {
  console.log(`Generating key pair for ${email}...`);

  try {
    // Generate key pair
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa',
      rsaBits: 2048,
      userIDs: [{ name, email }],
      passphrase: PASSPHRASE,
      format: 'armored'
    });

    return { privateKey, publicKey };
  } catch (error) {
    console.error(`Error generating key for ${email}: ${error.message}`);
    throw error;
  }
}

async function main() {
  try {
    // Load users from JSON
    const usersData = await readFileAsync(USERS_FILE, 'utf8');
    const users = JSON.parse(usersData);

    // Generate key pairs for each user
    for (const [email, _] of Object.entries(users)) {
      const userName = email.split('@')[0];

      try {
        // Generate key pair
        const { privateKey, publicKey } = await generateKeyPair(userName, email);

        // Save keys to files
        await writeFileAsync(path.join(FIXTURES_DIR, `${userName}_public.asc`), publicKey);
        await writeFileAsync(path.join(FIXTURES_DIR, `${userName}_private.asc`), privateKey);

        // Update user in the dictionary
        users[email] = publicKey;

        console.log(`Successfully generated keys for ${email}`);
      } catch (error) {
        console.error(`Failed to process user ${email}: ${error.message}`);
        continue;
      }
    }

    // Update users.json with actual public keys
    await writeFileAsync(USERS_FILE, JSON.stringify(users, null, 2));

    console.log("\nKey generation complete!");
    console.log("Public and private keys have been saved to the fixtures directory.");
    console.log("users.json has been updated with actual public keys.");
    console.log("\nNote: The passphrase for all private keys is 'testpassword'");

  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
