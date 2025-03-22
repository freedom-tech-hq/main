#!/usr/bin/env node

/**
 * bridge_incoming.js
 *
 * MTA stdin/pipe mail processor that passees the emails to the mail-host HTTP server
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// TODO: Revise the architecture.
//  Maybe mail-host should be listening for SMTP? We can be sure it leverages MTA's queue and fail-over mechanisms
//  in this case. Additionally make all the server-server communication TLS-encrypted.
//  Before that decision, I'm leaving this bridge in its PoC-quality state.

// Configuration
// IMPORTANT: Exim does not propagate environment variables TODO: Implement an intermediate file
const SERVER_HOST = process.env.MAIL_SERVER_HOST || 'mail-host';
const SERVER_PORT = process.env.MAIL_SERVER_PORT || 3000;
const ENDPOINT = '/incoming';
const SERVER_URL = `http://${SERVER_HOST}:${SERVER_PORT}${ENDPOINT}`;

/**
 * Log a message
 * @param {string} message - Message to log
 * @param {string} level - Log level (INFO, ERROR, etc.)
 */
function logMessage(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}`;

  // Log to console
  if (level === 'ERROR') {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }

  // Append to log file
  try {
    const logFile = path.join(__dirname, 'logs', 'bridge_incoming.log');
    fs.appendFileSync(logFile, logEntry + '\n');
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

/**
 * Main function to process the email
 */
async function processEmail() {
  try {
    // Read email from stdin
    let emailData = '';
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) {
      emailData += chunk;
    }

    logMessage(`Received email of size ${emailData.length} bytes`);
    logMessage(`Forwarding to encryption server at ${SERVER_HOST}:${SERVER_PORT}`);

    // Send the email data to the Fastify server
    let response;
    try {
      response = await axios.post(SERVER_URL, emailData, {
        headers: {
          'Content-Type': 'text/plain'
        },
        timeout: 10000 // 10 seconds timeout
      });
    } catch (error) {
      if (error.response) {
        // The server responded with a status code outside the 2xx range
        logMessage(`Server returned status code ${error.response.status}: ${JSON.stringify(error.response.data)}`, 'ERROR');
      } else if (error.request) {
        // The request was made but no response was received
        logMessage(`No response received from server: ${error.message}`, 'ERROR');
      } else {
        // Something happened in setting up the request
        logMessage(`Request failed: ${error.message}`, 'ERROR');
      }
      process.exit(1);
    }

    const result = response.data;

    if (result.success) {
      logMessage(`Email for ${result.recipient} encrypted and saved to ${result.filePath}`);
      process.exit(0);
    } else {
      logMessage(`Server failed to process email: ${result.error}`, 'ERROR');
      process.exit(1);
    }
  } catch (error) {
    logMessage(`Error processing email: ${error.message}`, 'ERROR');
    process.exit(1);
  }
}

// Run the main function
processEmail();
