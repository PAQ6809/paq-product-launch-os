import type { LaunchReport } from "@/types/report";

const forbiddenMarketingClaimTerms = [
  "保證有效",
  "治療",
  "改善疾病",
  "醫療功效",
  "保證銷售",
  "月收保證"
];

type ValidationResult =
  | {
      ok: true;
      report: LaunchReport;
      errors: [];
    }
  | {
      ok: false;
      report: null;
      errors: string[];
    };

const requiredStringFields = [
  "productName",
  "category",
  "generatedAt",
  "positioning",
  "targetAudienceAnalysis",
  "frontPackagingCopy",
  "backPackagingCopy",
  "productTitle",
  "shortDescription",
  "longDescription"
] as const;

const requiredArrayFields = [
  "keySellingPoints",
  "competitorAnalysis",
  "seoKeywords",
  "socialPosts",
  "videoScripts",
  "faqs",
  "customerServiceScripts",
  "launchChecklist",
  "firstMonthMarketingPlan",
  "optimizationSuggestions"
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasNonEmptyString(record: Record<string, unknown>, field: string) {
  return typeof record[field] === "string" && record[field].trim().length > 0;
}

function hasNumber(record: Record<string, unknown>, field: string) {
  return typeof record[field] === "number" && Number.isFinite(record[field]);
}

function validateStringArray(record: Record<string, unknown>, field: string, errors: string[]) {
  const value = record[field];

  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${field} must be a non-empty array.`);
    return;
  }

  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      errors.push(`${field}[${index}] must be a non-empty string.`);
    }
  });
}

function validateObjectArray(
  record: Record<string, unknown>,
  field: string,
  fields: string[],
  errors: string[]
) {
  const value = record[field];

  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${field} must be a non-empty array.`);
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`${field}[${index}] must be an object.`);
      return;
    }

    fields.forEach((itemField) => {
      if (!hasNonEmptyString(item, itemField)) {
        errors.push(`${field}[${index}].${itemField} must be a non-empty string.`);
      }
    });
  });
}

function validateVideoScripts(record: Record<string, unknown>, errors: string[]) {
  const value = record.videoScripts;

  if (!Array.isArray(value) || value.length === 0) {
    errors.push("videoScripts must be a non-empty array.");
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`videoScripts[${index}] must be an object.`);
      return;
    }

    ["title", "hook", "cta"].forEach((field) => {
      if (!hasNonEmptyString(item, field)) {
        errors.push(`videoScripts[${index}].${field} must be a non-empty string.`);
      }
    });

    if (!hasNumber(item, "durationSeconds")) {
      errors.push(`videoScripts[${index}].durationSeconds must be a number.`);
    }

    validateStringArray(item, "scenes", errors);
  });
}

function validateSocialPosts(record: Record<string, unknown>, errors: string[]) {
  const value = record.socialPosts;

  if (!Array.isArray(value) || value.length === 0) {
    errors.push("socialPosts must be a non-empty array.");
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`socialPosts[${index}] must be an object.`);
      return;
    }

    ["platform", "caption", "cta"].forEach((field) => {
      if (!hasNonEmptyString(item, field)) {
        errors.push(`socialPosts[${index}].${field} must be a non-empty string.`);
      }
    });

    validateStringArray(item, "hashtags", errors);
  });
}

function validateFirstMonthMarketingPlan(record: Record<string, unknown>, errors: string[]) {
  const value = record.firstMonthMarketingPlan;

  if (!Array.isArray(value) || value.length === 0) {
    errors.push("firstMonthMarketingPlan must be a non-empty array.");
    return;
  }

  value.forEach((item, index) => {
    if (!isRecord(item)) {
      errors.push(`firstMonthMarketingPlan[${index}] must be an object.`);
      return;
    }

    ["week", "focus", "metric"].forEach((field) => {
      if (!hasNonEmptyString(item, field)) {
        errors.push(`firstMonthMarketingPlan[${index}].${field} must be a non-empty string.`);
      }
    });

    validateStringArray(item, "actions", errors);
  });
}

function validatePricingStrategy(record: Record<string, unknown>, errors: string[]) {
  const pricingStrategy = record.pricingStrategy;

  if (!isRecord(pricingStrategy)) {
    errors.push("pricingStrategy must be an object.");
    return;
  }

  ["suggestedPrice", "floorPrice", "premiumPrice", "marginRate"].forEach((field) => {
    if (!hasNumber(pricingStrategy, field)) {
      errors.push(`pricingStrategy.${field} must be a number.`);
    }
  });

  ["rationale", "promoNotes"].forEach((field) => {
    if (!hasNonEmptyString(pricingStrategy, field)) {
      errors.push(`pricingStrategy.${field} must be a non-empty string.`);
    }
  });
}

function validatePackagingBrief(record: Record<string, unknown>, errors: string[]) {
  const packagingBrief = record.packagingBrief;

  if (!isRecord(packagingBrief)) {
    errors.push("packagingBrief must be an object.");
    return;
  }

  ["concept", "visualDirection", "materials"].forEach((field) => {
    if (!hasNonEmptyString(packagingBrief, field)) {
      errors.push(`packagingBrief.${field} must be a non-empty string.`);
    }
  });

  validateStringArray(packagingBrief, "requiredElements", errors);
  validateStringArray(packagingBrief, "complianceNotes", errors);
}

export function validateLaunchReportPayload(payload: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      report: null,
      errors: ["Launch report payload must be an object."]
    };
  }

  requiredStringFields.forEach((field) => {
    if (!hasNonEmptyString(payload, field)) {
      errors.push(`${field} must be a non-empty string.`);
    }
  });

  if (typeof payload.isMock !== "boolean") {
    errors.push("isMock must be a boolean.");
  }

  requiredArrayFields.forEach((field) => {
    if (!Array.isArray(payload[field]) || payload[field].length === 0) {
      errors.push(`${field} must be a non-empty array.`);
    }
  });

  validateStringArray(payload, "keySellingPoints", errors);
  validateStringArray(payload, "seoKeywords", errors);
  validateObjectArray(payload, "competitorAnalysis", ["name", "positioning", "priceRange", "strength", "gap"], errors);
  validateObjectArray(payload, "faqs", ["question", "answer"], errors);
  validateObjectArray(payload, "customerServiceScripts", ["scenario", "response"], errors);
  validateObjectArray(payload, "launchChecklist", ["phase", "task", "ownerHint"], errors);
  validateObjectArray(payload, "optimizationSuggestions", ["signal", "action", "why"], errors);
  validateSocialPosts(payload, errors);
  validateVideoScripts(payload, errors);
  validateFirstMonthMarketingPlan(payload, errors);
  validatePricingStrategy(payload, errors);
  validatePackagingBrief(payload, errors);

  if (errors.length > 0) {
    return {
      ok: false,
      report: null,
      errors
    };
  }

  return {
    ok: true,
    report: payload as LaunchReport,
    errors: []
  };
}

export function parseLaunchReportJson(rawText: string): ValidationResult {
  try {
    return validateLaunchReportPayload(JSON.parse(rawText));
  } catch (error) {
    return {
      ok: false,
      report: null,
      errors: [error instanceof Error ? error.message : "Invalid JSON response."]
    };
  }
}

export function assertValidLaunchReport(payload: unknown): LaunchReport {
  const result = validateLaunchReportPayload(payload);

  if (!result.ok) {
    throw new Error(`Invalid launch report payload: ${result.errors.join("; ")}`);
  }

  return result.report;
}

export function assertNoForbiddenMarketingClaims(report: LaunchReport) {
  const claimSensitiveText = [
    report.positioning,
    report.targetAudienceAnalysis,
    report.frontPackagingCopy,
    report.backPackagingCopy,
    report.productTitle,
    report.shortDescription,
    report.longDescription,
    ...report.keySellingPoints,
    ...report.socialPosts.flatMap((post) => [post.caption, post.cta]),
    ...report.videoScripts.flatMap((script) => [script.title, script.hook, script.cta, ...script.scenes]),
    ...report.faqs.flatMap((faq) => [faq.question, faq.answer]),
    ...report.customerServiceScripts.flatMap((script) => [script.scenario, script.response])
  ].join("\n");

  const matchedTerms = forbiddenMarketingClaimTerms.filter((term) => claimSensitiveText.includes(term));

  if (matchedTerms.length > 0) {
    throw new Error(`Forbidden marketing claim terms found: ${matchedTerms.join(", ")}`);
  }
}
