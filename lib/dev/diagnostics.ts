import "server-only";

import { readdir, readFile } from "fs/promises";
import { join } from "path";
import type { DeveloperAccess } from "@/lib/auth/roles";
import { getHelpRateLimitConfig, getRateLimitConfig } from "@/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type DeveloperDiagnostics = Awaited<ReturnType<typeof getDeveloperDiagnostics>>;

export async function getDeveloperDiagnostics(access: DeveloperAccess) {
  const i18nStatus = await getI18nIntegrityStatus();

  return {
    access: {
      mode: access.mode,
      email: access.mode === "supabase" ? access.profile.email : null,
      role: access.mode === "supabase" ? access.profile.role : "demo"
    },
    providers: {
      aiProvider: process.env.AI_PROVIDER ?? "mock",
      helpAIProvider: process.env.HELP_AI_PROVIDER ?? "mock",
      publicRealAIEnabled: isEnabled(process.env.ENABLE_PUBLIC_REAL_AI),
      publicHelpAIEnabled: isEnabled(process.env.ENABLE_PUBLIC_HELP_AI),
      openAIKeyConfigured: hasValue(process.env.OPENAI_API_KEY),
      nvidiaKeyConfigured: hasValue(process.env.NVIDIA_API_KEY)
    },
    rateLimit: {
      generateReport: getRateLimitConfig(),
      helpChat: getHelpRateLimitConfig()
    },
    system: {
      supabaseConfigured: isSupabaseConfigured(),
      nodeEnv: process.env.NODE_ENV ?? "development",
      secretRedaction: "enabled"
    },
    i18n: i18nStatus
  };
}

async function getI18nIntegrityStatus() {
  try {
    const messagesDir = join(process.cwd(), "messages");
    const files = (await readdir(messagesDir)).filter((file) => file.endsWith(".json")).sort();
    const base = await readMessageFile(join(messagesDir, "zh-TW.json"));
    const baseKeys = Object.keys(flattenMessages(base));
    const issues: string[] = [];

    for (const file of files) {
      const localeMessages = await readMessageFile(join(messagesDir, file));
      const flattened = flattenMessages(localeMessages);

      for (const key of baseKeys) {
        if (!(key in flattened)) {
          issues.push(`${file}: missing ${key}`);
        }
      }

      for (const [key, value] of Object.entries(flattened)) {
        if (!value.trim()) {
          issues.push(`${file}: empty ${key}`);
        }
        if (/\?\?|�/.test(value)) {
          issues.push(`${file}: broken text ${key}`);
        }
      }
    }

    return {
      ok: issues.length === 0,
      localeFiles: files.length,
      issueCount: issues.length,
      sampleIssues: issues.slice(0, 5)
    };
  } catch (error) {
    return {
      ok: false,
      localeFiles: 0,
      issueCount: 1,
      sampleIssues: [error instanceof Error ? error.message : "Unable to read i18n messages"]
    };
  }
}

async function readMessageFile(filePath: string) {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

function flattenMessages(value: unknown, prefix = "", output: Record<string, string> = {}) {
  if (typeof value === "string") {
    output[prefix] = value;
    return output;
  }

  if (!isRecord(value)) {
    output[prefix] = String(value ?? "");
    return output;
  }

  for (const [key, child] of Object.entries(value)) {
    flattenMessages(child, prefix ? `${prefix}.${key}` : key, output);
  }

  return output;
}

function isEnabled(value: string | undefined) {
  return value === "true";
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
