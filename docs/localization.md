# Site-wide Localization

PAQ Product Launch OS v0.3.6 uses `next-intl` with the Next.js App Router. Phase one ships complete locale routes and static UI messages for `zh-TW`, `en`, `ja`, `ko`, and `ar`. The locale catalog also records `es`, `fr`, `de`, `vi`, `th`, `id`, and `he` for later activation.

## Routing and messages

- Routes use `app/[locale]` and always include a locale prefix.
- `/` is detected and redirected to the default `zh-TW` locale.
- `i18n/routing.ts` is the source of truth for active locales, labels, direction, and fonts.
- Static product UI copy lives in `messages/{locale}.json` and is reviewed before commit.
- `LanguageSwitcher` changes only the locale and keeps the current path.

## Message integrity check

Run the locale guard before shipping copy changes:

```bash
npm run i18n:check
```

The check uses `messages/zh-TW.json` as the base key set and fails when another locale is missing a key, contains an empty string, contains two or more repeated ASCII question marks, or contains the Unicode replacement character. Missing runtime translation keys fall back to the readable key path instead of rendering question marks.

Arabic uses `dir="rtl"` at the document level. Report translations set their own direction so Chinese source copy remains LTR inside a bilingual Arabic page. Layouts use logical `start/end` spacing, wrapping, and bounded controls to tolerate longer labels.

## Report translation pipeline

`POST /api/translate-report` accepts a `LaunchReport`, `sourceLocale`, `targetLocale`, product category, and optional provider preference. `TRANSLATION_PROVIDER` supports `mock`, `openai`, and `nvidia`.

1. Validate the source report at the API boundary.
2. Apply IP rate limiting and public-production real-AI protection.
3. Select a server-side translation provider.
4. Require schema-shaped JSON and run the translation validator.
5. On provider, JSON, timeout, or validation failure, return a clearly marked mock fallback.
6. Store the result in localStorage using `reportId + targetLocale + source hash`.

The source hash invalidates cached translations when report content changes. localStorage is demo-only; production should move translations, review state, and audit history to Supabase.

## Translation quality and risk

Translation prompts preserve meaning, prices, specifications, platform names, positioning, and legal notes. They prohibit adding product effects, medical or wellness claims, certifications, sales guarantees, and unsupported evidence. Every result stays inside the existing human review flow and must be reviewed before publication.

`MockTranslationProvider` is a deterministic fallback. English includes prepared demo copy; other phase-one locales preserve every source fact and clearly label the result as mock. It is a workflow demonstration, not approved commercial translation.

## Configuration

```env
TRANSLATION_PROVIDER=mock
OPENAI_API_KEY=
NVIDIA_API_KEY=
ENABLE_PUBLIC_REAL_AI=false
ENABLE_DEV_TRANSLATION_TOOLS=false
```

Use `openai` or `nvidia` only on a protected preview deployment with the matching server-side key. Never expose keys through `NEXT_PUBLIC_*` variables or browser code. Public production defaults to mock unless `ENABLE_PUBLIC_REAL_AI=true`.

## Site-copy development tool

`POST /api/translate-site-copy` is disabled in production and also requires `ENABLE_DEV_TRANSLATION_TOOLS=true`. It prepares keyed copy for review; it never writes message files and never replaces human review. Approved translations are committed manually to `messages/`.

## Export

Translated and bilingual exports include source locale, target locale, provider, model, timestamp, fallback state, and legal-risk notes. Platform exporters create copyable templates only and do not call Shopify, Amazon, or Etsy APIs.
