import type { EncryptionMode } from '../types/EncryptionMode.ts';
import type { HashingMode } from '../types/HashingMode.ts';
import type { PasswordEncryptionMode } from '../types/PasswordEncryptionMode.ts';
import type { SigningMode } from '../types/SigningMode.ts';

export const preferredEncryptionMode: EncryptionMode = 'RSA-OAEP/4096/SHA-256+AES/256/GCM';
export const preferredPasswordEncryptionMode: PasswordEncryptionMode = 'PBKDF2/SHA-256*650000+AES/256/GCM';
export const preferredSigningMode: SigningMode = 'RSASSA-PKCS1-v1_5/4096/SHA-256';
export const preferredHashingMode: HashingMode = 'SHA-256';
