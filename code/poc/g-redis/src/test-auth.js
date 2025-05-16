const { createClient } = require('redis');

const HOST = '127.0.0.1';
const PORT = 6379;
const PASSWORD = 'supersecret'; // Same as in docker-compose.yaml
const TEST_KEY = 'auth-test-key';
const TEST_VALUE = 'auth-test-value';

async function testValkeyAuth() {
  console.log('--- Test Scenario: Valkey Authentication ---');

  // Scenario 1: Attempt to connect without password (expected to fail)
  console.log('\n--- Scenario 1: Connect without password ---');
  const clientNoAuth = createClient({
    socket: {
      host: HOST,
      port: PORT,
      connectTimeout: 20000 // Shorter timeout for expected failure
    }
  });

  clientNoAuth.on('error', (err) => console.error('Client without Auth - Redis Client Error:', err.message));

  try {
    console.log('Attempting to connect without password...');
    await clientNoAuth.connect();
    // console.log('Connected without password (unexpected!). Pinging...');
    const pong = await clientNoAuth.ping();
    console.log('Ping response (no auth):', pong);
    await clientNoAuth.quit();
  } catch (err) {
    console.log('Failed to connect/ping without password (expected):', err.message);
    if (err.message && (err.message.includes('NOAUTH') || err.message.includes('Authentication required'))) {
      console.log('Failure was due to authentication requirement, as expected.');
    } else {
      console.log('Failure reason might be different:', err.message);
    }
    // Ensure client is explicitly closed if connect fails partially or times out
    if (clientNoAuth.isOpen) {
        await clientNoAuth.quit();
    }
  }
  console.log('--- End of Scenario 1 ---');

  // Scenario 2: Connect with password and perform operations
  console.log('\n--- Scenario 2: Connect with password and perform operations ---');
  const clientWithAuth = createClient({
    url: `redis://${HOST}:${PORT}`,
    password: PASSWORD,
    socket: {
        connectTimeout: 5000
    }
  });

  clientWithAuth.on('error', (err) => console.error('Client with Auth - Redis Client Error:', err));

  try {
    console.log('Attempting to connect with password...');
    await clientWithAuth.connect();
    console.log('Connected with password successfully!');

    // Ping to confirm
    const pongAuth = await clientWithAuth.ping();
    console.log('Ping response (with auth):', pongAuth);

    // Add key
    console.log(`Setting key: '${TEST_KEY}' to '${TEST_VALUE}'`);
    await clientWithAuth.set(TEST_KEY, TEST_VALUE);
    console.log('Key set successfully.');

    // Read key
    const retrievedValue = await clientWithAuth.get(TEST_KEY);
    console.log(`Retrieved value for '${TEST_KEY}':`, retrievedValue);
    if (retrievedValue !== TEST_VALUE) {
        console.error(`ERROR: Retrieved value '${retrievedValue}' does not match expected value '${TEST_VALUE}'`);
    }

    // Delete key
    console.log(`Deleting key: '${TEST_KEY}'`);
    const delResult = await clientWithAuth.del(TEST_KEY);
    console.log('Deletion result (1 means success):', delResult);
    if (delResult !== 1) {
        console.error(`ERROR: Key '${TEST_KEY}' not deleted successfully.`);
    }

    // Verify deletion
    const valueAfterDelete = await clientWithAuth.get(TEST_KEY);
    console.log(`Value for '${TEST_KEY}' after deletion:`, valueAfterDelete);
    if (valueAfterDelete !== null) {
        console.error(`ERROR: Key '${TEST_KEY}' still exists after deletion.`);
    } else {
        console.log(`Key '${TEST_KEY}' successfully deleted and verified.`);
    }

  } catch (err) {
    console.error('Error during authenticated operations:', err);
  } finally {
    if (clientWithAuth.isOpen) {
      console.log('Closing connection (with auth)...');
      await clientWithAuth.quit();
      console.log('Connection (with auth) closed.');
    }
  }
  console.log('--- End of Scenario 2 ---');
  console.log('\n--- Test Scenario Complete ---');
}

testValkeyAuth().catch(console.error);
