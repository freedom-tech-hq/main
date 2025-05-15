# GCP Redis Connection PoC

A minimal proof-of-concept script for connecting to Google Cloud Redis using service account credentials.

## Features

- Connects to GCP Redis using service account credentials
- Performs basic Redis operations:
  - Save a key-value pair
  - Read a value by key
  - Delete a key

## Setup

1. Install dependencies:
```
yarn install
```

2. Make sure the service account key file exists at:
```
../../gcp-serviceAccountKey.json
```

3. Update the Redis connection constants in `src/redis-client.js` if needed:
```javascript
const CONSTANTS = {
  REDIS_HOST: 'redis-host.googleapis.com', // Replace with actual GCP Redis host
  REDIS_PORT: 6379,
  // ...
};
```

## Running the Script

```
yarn start
```
