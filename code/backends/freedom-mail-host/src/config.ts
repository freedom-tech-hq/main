/**
 * HTTP server
 */

/** Port to run the server on */
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

/** Host to bind the server to */
export const HOST = '0.0.0.0';

/**
 * Storage
 */

/** Google Cloud Storage credentials file contents (not name) */
export const GOOGLE_APPLICATION_CREDENTIALS_RAW = process.env.GOOGLE_APPLICATION_CREDENTIALS_RAW
  ? JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_RAW)
  : undefined; // In the cloud, we use machine-wise implicit credentials

/** Google Cloud Storage bucket for storing emails and user data */
export const APP_BUCKET = process.env.APP_BUCKET || 'user-files-dev-abd0971d';

/** Path to the users database file */
export const USERS_FILE = 'users.json';
