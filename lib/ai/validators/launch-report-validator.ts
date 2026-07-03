import type { LaunchReport } from "@/types/report";

const forbiddenMarketingClaimPatterns = [
  { label: "保證", pattern: /保證/u },
  { label: "100%", pattern: /100\s*%/u },
  { label: "最有效", pattern: /最有效/u },
  { label: "治療", pattern: /治療/u },
  { label: "療效", pattern: /療效/u },
  { label: "改善疾病", pattern: /改善疾病/u },
  { label: "無風險", pattern: /無風險/u },
  { label: "必賺", pattern: /必賺/u },
  { label: "guaranteed", pattern: /\bguaranteed\b/iu },
  { label: "guaranteed sales", pattern: /\bguaranteed sales\b/iu },
  { label: "cure", pattern: /\bcure\b/iu },
  { label: "treat disease", pattern: /\btreat disease\b/iu },
  { label: "clinically proven", pattern: /\bclinically proven\b/iu },
  { label: "risk-free", pattern: /\brisk[- ]free\b/iu }
] as const;

const genericTemplatePatterns = [
  /根據您的產品/u,
  /您的商品/u,
  /這款產品/u,
  /依照商品特色/u,
  /目標客群需要/u
] as const;

type ValidationOptions = {
  requireAnalysis?: boolean;
};

type ValidationResult =
  | {
      ok: true;
      report: LaunchReport;
      errors: [];
      warnings: string[];
    }
  | {
      ok: false;
      report: null;
      errors: string[];
      warnings: string[];
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
  "optimizationSuggestions",
  "legalRiskNotes"
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

function validateStringArray(record: Record<string, unknown>, field: string, errors: string[], minItems = 1) {
  const value = record[field];

  if (!Array.isArray(value) || value.length < minItems) {
    errors.push(`${field} must be an array with at least ${minItems} item(s).`);
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
  errors: string[],
  minItems = 1
) {
  const value = record[field];

  if (!Array.isArray(value) || value.length < minItems) {
    errors.push(`${field} must be an array with at least ${minItems} item(s).`);
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
  const allowedPlatforms = new Set(["IG", "Threads", "TikTok"]);

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

    if (typeof item.platform === "string" && !allowedPlatforms.has(item.platform)) {
      errors.push(`socialPosts[${index}].platform must be IG, Threads, or TikTok.`);
    }

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

function validateAnalysis(record: Record<string, unknown>, errors: string[], warnings: string[]) {
  const analysis = record.analysis;
  if (!isRecord(analysis)) {
    errors.push("analysis must be an object.");
    return;
  }

  const executiveSummary = analysis.executiveSummary;
  if (!isRecord(executiveSummary) || !hasNonEmptyString(executiveSummary, "summary")) {
    errors.push("analysis.executiveSummary.summary must be a non-empty string.");
  }

  const productDiagnosis = analysis.productDiagnosis;
  if (!isRecord(productDiagnosis)) {
    errors.push("analysis.productDiagnosis must be an object.");
  } else {
    validateStringArray(productDiagnosis, "assumptions", errors);
    validateStringArray(productDiagnosis, "missingInformation", errors, 0);
    validateStringArray(productDiagnosis, "recommendations", errors);
    if (Array.isArray(productDiagnosis.missingInformation) && productDiagnosis.missingInformation.length >= 5) {
      warnings.push("Analysis has many missingInformation items; confidence should remain low or medium.");
    }
  }

  const nextActions = analysis.nextActions;
  if (!Array.isArray(nextActions) || nextActions.length === 0) {
    errors.push("analysis.nextActions must be a non-empty array.");
  }

  const legalRiskAssessment = analysis.legalRiskAssessment;
  if (!isRecord(legalRiskAssessment)) {
    errors.push("analysis.legalRiskAssessment must be an object.");
  } else {
    validateStringArray(legalRiskAssessment, "riskyClaims", errors);
    validateStringArray(legalRiskAssessment, "saferAlternatives", errors);
    validateStringArray(legalRiskAssessment, "requiredDisclaimers", errors);
    if (typeof legalRiskAssessment.reviewNeeded !== "boolean") {
      errors.push("analysis.legalRiskAssessment.reviewNeeded must be a boolean.");
    }
  }
}

function validateMetadata(record: Record<string, unknown>, errors: string[]) {
  const metadata = record.metadata;
  if (!isRecord(metadata)) {
    errors.push("metadata must be an object.");
    return;
  }

  if (!["mock", "openai", "nvidia"].includes(String(metadata.provider))) {
    errors.push("metadata.provider must be mock, openai, or nvidia.");
  }

  ["model", "generatedAt", "confidenceLevel"].forEach((field) => {
    if (!hasNonEmptyString(metadata, field)) {
      errors.push(`metadata.${field} must be a non-empty string.`);
    }
  });

  ["isAiGenerated", "isFallback", "validationPassed"].forEach((field) => {
    if (typeof metadata[field] !== "boolean") {
      errors.push(`metadata.${field} must be a boolean.`);
    }
  });

  validateStringArray(metadata, "assumptionsUsed", errors);
}

export function validateLaunchReportPayload(
  payload: unknown,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      ok: false,
      report: null,
      errors: ["Launch report payload must be an object."],
      warnings
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
  validateStringArray(payload, "legalRiskNotes", errors);
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

  if (options.requireAnalysis) {
    validateAnalysis(payload, errors, warnings);
    validateMetadata(payload, errors);
  } else if (isRecord(payload.analysis)) {
    validateAnalysis(payload, errors, warnings);
  }

  const matchedTerms = findForbiddenMarketingClaims(payload as LaunchReport);
  matchedTerms.forEach((term) => errors.push(`Forbidden outward-facing marketing claim found: ${term}.`));

  const templateWarning = getTemplateLikeWarning(payload as LaunchReport);
  if (templateWarning) warnings.push(templateWarning);

  if (errors.length > 0) {
    return {
      ok: false,
      report: null,
      errors: Array.from(new Set(errors)),
      warnings: Array.from(new Set(warnings))
    };
  }

  return {
    ok: true,
    report: payload as LaunchReport,
    errors: [],
    warnings: Array.from(new Set(warnings))
  };
}

export function parseLaunchReportJson(rawText: string, options: ValidationOptions = {}): ValidationResult {
  try {
    return validateLaunchReportPayload(JSON.parse(rawText), options);
  } catch (error) {
    return {
      ok: false,
      report: null,
      errors: [error instanceof Error ? error.message : "Invalid JSON response."],
      warnings: []
    };
  }
}

export function assertValidLaunchReport(payload: unknown): LaunchReport {
  const result = validateLaunchReportPayload(payload, { requireAnalysis: true });

  if (!result.ok) {
    throw new Error(`Invalid launch report payload: ${result.errors.join("; ")}`);
  }

  return result.report;
}

export function assertNoForbiddenMarketingClaims(report: LaunchReport) {
  const matchedTerms = findForbiddenMarketingClaims(report);

  if (matchedTerms.length > 0) {
    throw new Error(`Forbidden marketing claim terms found: ${matchedTerms.join(", ")}`);
  }
}

function findForbiddenMarketingClaims(report: LaunchReport) {
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

  return forbiddenMarketingClaimPatterns
    .filter(({ pattern }) => pattern.test(claimSensitiveText))
    .map(({ label }) => label);
}

function getTemplateLikeWarning(report: LaunchReport) {
  const text = [
    report.positioning,
    report.targetAudienceAnalysis,
    report.longDescription,
    report.analysis?.executiveSummary.summary ?? "",
    report.analysis?.productDiagnosis.reasoning ?? ""
  ].join("\n");
  const genericHits = genericTemplatePatterns.filter((pattern) => pattern.test(text)).length;
  const concreteTerms = [report.productName, report.category, ...report.keySellingPoints.slice(0, 2)]
    .filter(Boolean)
    .filter((term) => text.includes(term.slice(0, Math.min(term.length, 8))));

  if (genericHits >= 2 && concreteTerms.length < 2) {
    return "Output appears template-like and may need stronger product-specific analysis.";
  }

  return null;
}
