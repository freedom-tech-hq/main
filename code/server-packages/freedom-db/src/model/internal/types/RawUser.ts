export interface RawUser {
  userId: string;
  email: string;
  publicKeys: unknown; // JSON with schema
  defaultSalt: string;
  encryptedCredentials: string | null; // Convert to undefined on read
}
