# v0.4.8 Real AI Product Analysis Engine

## Goal

v0.4.8 upgrades report generation from a template-like demo response to a server-side, gated real AI product analysis engine.

The output must still preserve the existing `LaunchReport` fields so the current report page, export tools, translation flow, localStorage, and Supabase persistence keep working. Real AI providers additionally return structured `analysis` and `metadata` fields.

## Real Analysis vs Template Output

Real analysis must:

- Tie recommendations to product name, category, features, cost, target price, audience, brand style, and sales channels.
- Explain assumptions when competitor data, specs, packaging cost, or channel metrics are missing.
- Include reasoning, risks, and next actions instead of generic "根據您的產品" wording.
- Keep pricing logic grounded in cost, expected price, margin, platform fees, packaging, and launch testing.
- Avoid claiming live market research unless an actual research integration exists.

Template output is considered weak when it:

- Uses generic phrases without naming the product or target audience.
- Gives the same strategy regardless of category, price, channel, or brand style.
- Skips assumptions and missing information.
- Recommends broad actions such as "do marketing" without owner, reason, impact, or effort.

## Structured Output

The provider must return JSON matching `LAUNCH_REPORT_JSON_SCHEMA`.

Required compatibility fields remain:

- `positioning`
- `targetAudienceAnalysis`
- `keySellingPoints`
- `competitorAnalysis`
- `pricingStrategy`
- `packagingBrief`
- `listing copy`
- `socialPosts`
- `videoScripts`
- `faqs`
- `customerServiceScripts`
- `launchChecklist`
- `firstMonthMarketingPlan`
- `optimizationSuggestions`
- `legalRiskNotes`

New v0.4.8 fields:

- `analysis.executiveSummary`
- `analysis.productDiagnosis`
- `analysis.positioningAnalysis`
- `analysis.targetAudience`
- `analysis.competitiveStrategy`
- `analysis.pricingAnalysis`
- `analysis.packagingStrategy`
- `analysis.listingCopy`
- `analysis.marketingPlan`
- `analysis.socialContent`
- `analysis.customerSupport`
- `analysis.legalRiskAssessment`
- `analysis.nextActions`
- `metadata`

## Safety Gates

Real AI is only used when all gates pass:

1. `/api/generate-report` runs server-side.
2. `AI_PROVIDER` is `openai` or `nvidia`.
3. The matching server-side API key is configured.
4. `REAL_AI_REQUIRE_LOGIN=true` requires a valid Supabase session.
5. Production keeps real AI disabled unless `ENABLE_PUBLIC_REAL_AI=true`.
6. `REAL_AI_RATE_LIMIT_ENABLED=true` protects the endpoint.
7. Validator accepts the returned JSON.

If any gate fails, the API returns `MockAIProvider` with a clear `warning`.

## Environment Variables

```env
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
NVIDIA_API_KEY=
NVIDIA_MODEL=minimaxai/minimax-m2.7
ENABLE_PUBLIC_REAL_AI=false
REAL_AI_REQUIRE_LOGIN=true
REAL_AI_RATE_LIMIT_ENABLED=true
REAL_AI_RATE_LIMIT_WINDOW_SECONDS=3600
REAL_AI_RATE_LIMIT_MAX_REQUESTS=5
ENABLE_DEV_DIAGNOSTICS=false
```

## Fallback Rules

- Missing key: fallback to mock.
- Unauthenticated user with `REAL_AI_REQUIRE_LOGIN=true`: fallback to mock.
- Production with `ENABLE_PUBLIC_REAL_AI=false`: forced mock.
- Invalid JSON or schema mismatch: fallback to mock.
- High-risk outward-facing claims: fallback to mock.
- Supabase save failure: report still returns, but warning explains cloud save failed.

## Validator Rules

The validator checks:

- Required legacy fields.
- Required real analysis fields when generation requires v0.4.8 analysis.
- Non-empty string and array fields.
- Pricing and video numeric fields.
- High-risk claims in outward-facing copy.
- Template-like weak analysis warnings.

High-risk terms are allowed inside `legalRiskNotes` and `analysis.legalRiskAssessment` because those sections describe risk, not customer-facing claims.

## Supabase Persistence

When `productId` is supplied and the user is logged in:

1. The API verifies the product belongs to the session user.
2. The report is saved to `launch_reports`.
3. The API returns `savedReportId`.

The API never trusts client-supplied `user_id` and does not use the service role key for normal workspace operations.

## Developer Diagnostics

Developer Console shows:

- `AI_PROVIDER`
- public real AI enabled/disabled
- real AI login requirement
- OpenAI/NVIDIA key configured booleans
- selected provider readiness
- production forced mock status
- real AI rate limit settings

It never renders raw keys, service role keys, encryption keys, or provider tokens.
