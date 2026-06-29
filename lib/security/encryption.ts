import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { encryptionAlgorithm, type EncryptedPayload } from "@/lib/security/encryption-types";

const IV_BYTES = 12;
const MASTER_KEY_BYTES = 32;
let warnedAboutDevFallback = false;

export function encryptJson(data: unknown) {
  return encryptText(JSON.stringify(data));
}

export function decryptJson<T = unknown>(payload: EncryptedPayload) {
  const decrypted = decryptText(payload);
  return JSON.parse(decrypted) as T;
}

export function encryptText(text: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(encryptionAlgorithm, key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    algorithm: encryptionAlgorithm,
    keyVersion: process.env.ENCRYPTION_KEY_VERSION?.trim() || "v1",
    encryptedAt: new Date().toISOString()
  };
}

export function decryptText(payload: EncryptedPayload) {
  assertEncryptedPayload(payload);

  const decipher = createDecipheriv(
    encryptionAlgorithm,
    getEncryptionKey(),
    Buffer.from(payload.iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]).toString("utf8");
}

function getEncryptionKey() {
  const configured = process.env.ENCRYPTION_MASTER_KEY?.trim();

  if (configured) {
    return normalizeKey(configured);
  }

  const required = process.env.REQUIRE_ENCRYPTION_IN_PRODUCTION !== "false";
  if (process.env.NODE_ENV === "production" && required) {
    throw new Error("ENCRYPTION_MASTER_KEY is required in production.");
  }

  if (!warnedAboutDevFallback) {
    warnedAboutDevFallback = true;
    process.emitWarning(
      "Using development-only fallback encryption key. Set ENCRYPTION_MASTER_KEY before production.",
      { code: "PAQ_DEV_ENCRYPTION_KEY" }
    );
  }

  return createHash("sha256").update("paq-product-launch-os-development-encryption-key").digest();
}

function normalizeKey(value: string) {
  const base64 = Buffer.from(value, "base64");
  if (base64.length === MASTER_KEY_BYTES) {
    return base64;
  }

  const utf8 = Buffer.from(value, "utf8");
  if (utf8.length === MASTER_KEY_BYTES) {
    return utf8;
  }

  return createHash("sha256").update(value).digest();
}

function assertEncryptedPayload(payload: EncryptedPayload) {
  if (payload.algorithm !== encryptionAlgorithm) {
    throw new Error(`Unsupported encryption algorithm: ${payload.algorithm}`);
  }

  if (!payload.ciphertext || !payload.iv || !payload.authTag) {
    throw new Error("Encrypted payload is missing required fields.");
  }
}
