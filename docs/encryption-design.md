# PAQ v0.4.5 Encryption Design

PAQ uses application-level encryption for high-sensitivity product and report payloads. Supabase already provides encryption at rest at the infrastructure layer, but application-level encryption reduces exposure when database rows, backups, or support tooling are inspected.

## Scope

Encrypt:

- Product confidential data.
- Product draft form data when it contains private strategy or supplier details.
- Launch reports.
- Report translations.
- Collection-level professional reports.

Do not encrypt:

- Search/list metadata such as product name, category, lifecycle status, created date.
- Public demo data.
- Operational status fields needed for filtering jobs and requests.

## Algorithm

- `AES-256-GCM`
- 96-bit random IV per encryption operation.
- Auth tag stored with payload.
- Ciphertext stored as base64.
- Payload includes `algorithm`, `keyVersion`, and `encryptedAt`.

Payload shape:

```json
{
  "ciphertext": "...",
  "iv": "...",
  "authTag": "...",
  "algorithm": "aes-256-gcm",
  "keyVersion": "v1",
  "encryptedAt": "2026-06-29T00:00:00.000Z"
}
```

## Key Handling

Server-side environment variables:

```env
ENCRYPTION_MASTER_KEY=
ENCRYPTION_KEY_VERSION=v1
REQUIRE_ENCRYPTION_IN_PRODUCTION=true
```

The encryption helper is `server-only`; client components must never import it. `ENCRYPTION_MASTER_KEY` must never be exposed as `NEXT_PUBLIC_*`, logged, committed, or returned by an API route.

Development fallback:

- If `ENCRYPTION_MASTER_KEY` is missing in development, the helper uses a deterministic development fallback key and emits a warning.
- Production fails closed when `REQUIRE_ENCRYPTION_IN_PRODUCTION=true`.

## Key Rotation

`keyVersion` is included in each payload. A future rotation job can:

1. Read rows for old `keyVersion`.
2. Decrypt using the old key from secret manager.
3. Re-encrypt with the current key.
4. Update payload with new `keyVersion`.
5. Audit the migration.

v0.4.5 only adds the payload shape and helper; it does not implement multi-key rotation storage.

## Searchable Metadata

Encrypted fields are not searchable. Keep only minimal metadata in plaintext:

- Product title.
- Category.
- Lifecycle status.
- Report provider/model.
- Export job status/format.

Do not store supplier secrets, full launch strategy, or customer-specific private notes in plaintext metadata.
