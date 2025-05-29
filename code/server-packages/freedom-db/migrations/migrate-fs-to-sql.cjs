// Usage: node migrate.js
// Reads `${env.STORAGE_ROOT_PATH}/mock-db.json` and generates `${env.STORAGE_ROOT_PATH}/mock-db.sql`
// Outputs SQL that you should copy and run manually

const fs = require('fs');
const path = require('path');

const STORAGE_ROOT_PATH = process.env.STORAGE_ROOT_PATH;
if (!STORAGE_ROOT_PATH) {
  throw new Error('STORAGE_ROOT_PATH environment variable is not set');
}

const inputPath = path.join(STORAGE_ROOT_PATH, 'mock-db.json');
const outputPath = path.join(STORAGE_ROOT_PATH, 'mock-db.sql');

/**
 * Escapes a value for SQL insertion (basic, for JSON/text fields).
 * @param {string} value
 */
function sqlString(value) {
  return "'" + value.replace(/'/g, "''") + "'";
}

/**
 * Generates an INSERT statement for the users table.
 * @param {object} user
 */
function makeInsert(user) {
  const email = sqlString(user.email);
  const userId = sqlString(user.userId);
  const publicKeys = sqlString(JSON.stringify(user.publicKeys));
  const defaultSalt = sqlString(user.defaultSalt);
  const encryptedCredentials = user.encryptedCredentials ? sqlString(user.encryptedCredentials) : 'NULL';
  return `INSERT INTO users (email, "userId", "publicKeys", "defaultSalt", "encryptedCredentials") VALUES (${email}, ${userId}, ${publicKeys}, ${defaultSalt}, ${encryptedCredentials});`;
}

function main() {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const inserts = [];
  for (const key of Object.keys(data)) {
    const user = data[key];
    inserts.push(makeInsert(user));
  }
  fs.writeFileSync(outputPath, inserts.join('\n') + '\n');
  console.log(`Wrote ${inserts.length} inserts to ${outputPath}`);
}

main();
