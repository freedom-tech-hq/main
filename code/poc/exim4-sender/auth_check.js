#!/usr/bin/env node

/**
 * auth_check.js
 *
 * Mock authentication script for SMTP relay
 * Called by Exim4 router to determine if a sender is authorized
 *
 * Arguments:
 *   $1: Sender email address
 *   $2: Authenticated ID (if available)
 *
 * Returns:
 *   0 (success) if authentication passes
 *   1 (failure) if authentication fails
 */

const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = __dirname;

/**
 * Logs a message to both console and file
 *
 * @param {string} message - The message to log
 * @param {string} level - Log level (info, error, warn)
 */
function logMessage(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // Log to console
  // console.log(formattedMessage);

  // Log to file
  const logFile = path.join(logsDir, `app.log`);
  try {
    fs.appendFileSync(logFile, formattedMessage + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Simple mock authentication function
 * Allows email addresses starting with "pavel.koryagin@"
 * Denies all other email addresses
 *
 * @param {string} senderEmail - Email address of the sender
 * @returns {boolean} - True if authenticated, false otherwise
 */
function mockAuth(senderEmail) {
  logMessage(`Checking authentication for: ${senderEmail}`);

  // Check if email starts with "pavel.koryagin@"
  const isAuthorized = senderEmail.startsWith('pavel.koryagin@');

  logMessage(`Authentication result for ${senderEmail}: ${isAuthorized ? 'ALLOWED' : 'DENIED'}`);

  return isAuthorized;
}

function main() {
  logMessage(`Enter`);

  if (process.argv.length < 3) {
    logMessage('Usage: auth_check.js <sender_email> [auth_id]', 'error');
    process.exit(1);
  }

  const something = process.argv[2];
  const authEmail = process.argv[3];
  const authPassword = process.argv[4];

  logMessage(`Auth check initiated for sender: ${something}, authId: ${authEmail || 'N/A'}`);
  logMessage(`  args ${process.argv.join(', ')}`);

  const isAuthenticated = mockAuth(authEmail);

  // Log the final result
  logMessage(`Auth check for ${authEmail}: ${isAuthenticated ? 'SUCCESS' : 'FAILURE'}`);

  // Exit with appropriate code: 0 for success, 1 for failure
  process.stdout.write(isAuthenticated ? 'ALLOW' : 'DENY');
  process.exit(isAuthenticated ? 0 : 1);
}

// Execute the main function
main();
