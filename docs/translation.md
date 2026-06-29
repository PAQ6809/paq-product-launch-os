# Report Translation

The original English-only translation workflow was upgraded in v0.3.6 to site-wide localization and multilingual report translation. The current architecture, environment variables, provider behavior, validation, cache, RTL rules, and export flow are documented in [localization.md](./localization.md).

## Current contract

- Locales: `zh-TW`, `en`, `ja`, `ko`, `ar`
- Providers: `mock`, `openai`, `nvidia`
- API: `POST /api/translate-report`
- Metadata: `sourceLocale`, `targetLocale`, `provider`, `model`, `translatedAt`, `isFallback`, `warning`
- Storage: localStorage cache keyed by report ID, target locale, and stable source hash
- Safety: server-side keys only, validation, rate limiting, production forced mock, and human review

Set `TRANSLATION_PROVIDER=mock` for the public demo. OpenAI and NVIDIA modes require the matching API key and should only be enabled in a protected environment.
