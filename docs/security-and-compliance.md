# PAQ v0.4.5 Security / Compliance Notes

This document is an engineering control plan, not legal advice. PAQ Product Launch OS should be reviewed by legal/compliance counsel before handling regulated or high-risk customer data in production.

## Data Categories

| Category | Examples | Sensitivity | Default Handling |
| --- | --- | --- | --- |
| Public demo data | Sample products, mock reports, public landing copy | Low | May stay in repo/localStorage. |
| User profile data | Email, display name, account timestamps | Medium | Supabase Auth + RLS; no client-side auth tokens in localStorage. |
| Product metadata | Name, category, lifecycle status, sales channels | Medium | Stored in `products`; RLS owner policies. |
| Product confidential data | Cost details, supplier notes, private strategy, unreleased product info | High | Store in `encrypted_confidential_data`. Keep searchable metadata minimal. |
| AI generated reports | Positioning, pricing, launch strategy, risk notes | High | Prefer `encrypted_report` for customer-owned reports. |
| Report translations | Cross-border report content and localized listing copy | High | Prefer `encrypted_translation`. |
| Exported documents | Markdown, JSON, HTML, CSV, ZIP package metadata | High | Require session check, ownership check, audit log, short retention. |
| Audit logs | Export events, data requests, security events | Medium | Minimize metadata; hash IP/user-agent where possible. |

## Sensitivity Levels

- `low`: Public demo content or non-sensitive UI copy.
- `medium`: Account/profile metadata, operational events, non-confidential product metadata.
- `high`: Pricing strategy, cost, unreleased product plans, generated reports, translations, exports.

## Security Controls

- RLS: Every user-owned Supabase table uses `user_id = (select auth.uid())`.
- Session validation: Protected API routes derive `userId` from Supabase server-side session only.
- Application-level encryption: Confidential JSON/report payloads use AES-256-GCM before database write.
- Audit logs: Export and security-related actions write user-scoped event records.
- Data minimization: Keep product list/search fields as metadata; encrypt full confidential payloads.
- Export permission check: Export routes must confirm the product/collection belongs to the session user.
- Delete account / data export: v0.4.5 adds request records; fulfillment remains an operational workflow.
- Retention policy: Generated export jobs default to 24-hour retention metadata.

## Compliance Posture

PAQ does not claim GDPR, PDPA, or CCPA compliance. Current work is a foundation for:

- Purpose limitation: Product launch planning and report generation only.
- Data minimization: Store only metadata needed for listing/workspace views in plaintext.
- User access/export: `data_requests` records can track export requests.
- User deletion request: `data_requests` records can track deletion requests.
- Encryption: TLS is expected in production; high-risk app payloads can be encrypted before storage.
- Auditability: `workspace_events`, `user_security_events`, and `export_jobs` create an event trail.
- Incident response: Placeholder process needed before commercial launch.

## Non-Claims

- This is not legal advice.
- This does not guarantee regulatory compliance.
- This does not replace platform policy review for Shopify, Amazon, Etsy, Shopee, Pinkoi, or ads channels.
- Food, beauty, supplement, and medical products still require human review and must not claim therapeutic effects.

## Production Checklist

1. Set `ENCRYPTION_MASTER_KEY` and rotate it through a secret manager.
2. Keep `REQUIRE_ENCRYPTION_IN_PRODUCTION=true`.
3. Verify RLS with at least two test accounts.
4. Verify protected export routes return 401 when anonymous and 403 when cross-user.
5. Avoid logging request bodies, provider API keys, service role keys, or encrypted payload plaintext.
6. Document retention/deletion operations before collecting real customer data.
