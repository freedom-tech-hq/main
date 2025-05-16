const { createClient } = require('redis');
const { GoogleAuth } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// GCP Redis connection constants
const CONSTANTS = {
  // Redis connection details
  REDIS_HOST: 'redis-host.googleapis.com', // Replace with actual GCP Redis host
  REDIS_PORT: 6379, // Default Redis port, adjust if needed
  REDIS_DB_INDEX: 0, // Default DB index
  
  // Service account configuration
  SERVICE_ACCOUNT_KEY_PATH: path.resolve(__dirname, '../../gcp-serviceAccountKey.json'),
  
  // Test data
  TEST_KEY: 'test-key',
  TEST_VALUE: 'Hello from GCP Redis!'
};

// Main function to demonstrate Redis operations
async function main() {
  try {
    console.log('Loading service account key...');
    const serviceAccountKey = JSON.parse(fs.readFileSync(CONSTANTS.SERVICE_ACCOUNT_KEY_PATH, 'utf8'));
    
    console.log('Setting up Google authentication...');
    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    
    console.log('Connecting to GCP Redis...');
    const client = createClient({
      url: `redis://${CONSTANTS.REDIS_HOST}:${CONSTANTS.REDIS_PORT}/${CONSTANTS.REDIS_DB_INDEX}`,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });
    
    client.on('error', (err) => console.log('Redis Client Error', err));
    
    await client.connect();
    console.log('Connected to Redis successfully');
    
    // Set a key-value pair
    const key = CONSTANTS.TEST_KEY;
    const value = CONSTANTS.TEST_VALUE;
    console.log(`Setting key: ${key} with value: ${value}`);
    await client.set(key, value);
    
    // Get the value
    const retrievedValue = await client.get(key);
    console.log(`Retrieved value for key ${key}: ${retrievedValue}`);
    
    // Delete the key
    console.log(`Deleting key: ${key}`);
    await client.del(key);
    
    // Verify deletion
    const afterDelete = await client.get(key);
    console.log(`Value after deletion for key ${key}: ${afterDelete === null ? 'null (successfully deleted)' : afterDelete}`);
    
    // Close connection
    await client.quit();
    console.log('Redis connection closed');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the demo
main().catch(console.error);
