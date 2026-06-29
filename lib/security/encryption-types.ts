export const encryptionAlgorithm = "aes-256-gcm" as const;

export type EncryptionAlgorithm = typeof encryptionAlgorithm;

export type EncryptedPayload = {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: EncryptionAlgorithm;
  keyVersion: string;
  encryptedAt: string;
};
