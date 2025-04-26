import fs from 'node:fs';
import path from 'node:path';
import { SMTPServer } from 'smtp-server';

// Default is different to 25 to start locally along with main SMTP components
const PORT = process.env.PORT || 26;

// Empty = disabled (only print to console)
const SAMPLES_DIR = process.env.SAMPLES_DIR;

// Create a new SMTP server instance
const server = new SMTPServer({
  // Allow all senders and recipients
  disabledCommands: ['STARTTLS'], // Disable STARTTLS for testing
  authOptional: true, // Make authentication optional

  // Log connection events
  onConnect(session, callback) {
    console.log(`[${new Date().toISOString()}] New connection from: ${session.remoteAddress}`);
    callback();
  },

  // Log authentication attempts
  onAuth(auth, session, callback) {
    console.log(`[${new Date().toISOString()}] Authentication attempt:`, {
      method: auth.method,
      username: auth.username,
      password: auth.password ? '[REDACTED]' : undefined
    });
    callback(null, { user: auth.username }); // Always authenticate successfully
  },

  // Log mail envelope data
  onMailFrom(address, session, callback) {
    console.log(`[${new Date().toISOString()}] MAIL FROM:`, address);
    callback();
  },

  // Log recipient data
  onRcptTo(address, session, callback) {
    console.log(`[${new Date().toISOString()}] RCPT TO:`, address);
    callback();
  },

  // Log message data
  onData(stream, session, callback) {
    console.log(`[${new Date().toISOString()}] Receiving message data`);

    let messageData = '';
    stream.on('data', chunk => {
      messageData += chunk.toString();
    });

    stream.on('end', () => {
      const timestamp = new Date();
      console.log(`[${timestamp.toISOString()}] Message received:`);
      console.log('------ MESSAGE START ------');
      console.log(messageData);
      console.log('------ MESSAGE END ------');

      console.log(`[${timestamp.toISOString()}] Message details:`, {
        from: session.envelope.mailFrom,
        to: session.envelope.rcptTo,
        size: messageData.length
      });

      // Save email sample if SAMPLES_DIR is set
      if (SAMPLES_DIR) {
        try {
          // Create filename with timestamp (replace colons with dashes for Windows compatibility)
          const baseFilename = timestamp.toISOString().replace(/:/g, '-').replace(/\./g, '-');
          const emlFilePath = path.join(SAMPLES_DIR, `${baseFilename}.eml`);
          const jsonFilePath = path.join(SAMPLES_DIR, `${baseFilename}.json`);

          // Write email content to .eml file
          fs.writeFileSync(emlFilePath, messageData);

          // Write envelope data to .json file
          const metadata = {
            envelope: session.envelope,
            timestamp: timestamp.toISOString()
          };
          fs.writeFileSync(jsonFilePath, JSON.stringify(metadata, null, 2));

          console.log(`[${timestamp.toISOString()}] Email sample saved to: ${emlFilePath}`);
          console.log(`[${timestamp.toISOString()}] Envelope data saved to: ${jsonFilePath}`);
        } catch (err) {
          console.error(`[${timestamp.toISOString()}] Error saving email sample:`, err);
        }
      }

      callback();
    });
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Mock SMTP server listening on port ${PORT}`);
});

// Handle server errors
server.on('error', err => {
  console.error(`[${new Date().toISOString()}] Server error:`, err);
});
