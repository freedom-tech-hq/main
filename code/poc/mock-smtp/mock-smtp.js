const { SMTPServer } = require('smtp-server');

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
      console.log(`[${new Date().toISOString()}] Message received:`);
      console.log('------ MESSAGE START ------');
      console.log(messageData);
      console.log('------ MESSAGE END ------');
      
      console.log(`[${new Date().toISOString()}] Message details:`, {
        from: session.envelope.mailFrom,
        to: session.envelope.rcptTo,
        size: messageData.length
      });
      
      callback();
    });
  }
});

// Start the server
const PORT = process.env.PORT || 25;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Mock SMTP server listening on port ${PORT}`);
});

// Handle server errors
server.on('error', err => {
  console.error(`[${new Date().toISOString()}] Server error:`, err);
});
