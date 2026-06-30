import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const messagesDir = path.join(rootDir, "messages");
const baseFile = "zh-TW.json";
const badQuestionMarks = /\?{2,}/;
const replacementCharacter = "\uFFFD";

function readJson(fileName) {
  const filePath = path.join(messagesDir, fileName);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { __parseError: error instanceof Error ? error.message : String(error) };
  }
}

function flatten(value, prefix = "", output = new Map()) {
  if (typeof value === "string") {
    output.set(prefix, value);
    return output;
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, output);
    }
  }

  return output;
}

const files = fs.readdirSync(messagesDir).filter((file) => file.endsWith(".json")).sort();
const baseMessages = readJson(baseFile);
const failures = [];

if ("__parseError" in baseMessages) {
  failures.push(`${baseFile}: invalid JSON: ${baseMessages.__parseError}`);
} else {
  const baseEntries = flatten(baseMessages);
  const baseKeys = [...baseEntries.keys()];

  for (const file of files) {
    const messages = readJson(file);
    if ("__parseError" in messages) {
      failures.push(`${file}: invalid JSON: ${messages.__parseError}`);
      continue;
    }

    const entries = flatten(messages);

    for (const key of baseKeys) {
      if (!entries.has(key)) {
        failures.push(`${file}: missing key "${key}"`);
      }
    }

    for (const [key, value] of entries) {
      if (value.trim().length === 0) {
        failures.push(`${file}: empty value at "${key}"`);
      }

      if (badQuestionMarks.test(value)) {
        failures.push(`${file}: suspicious question marks at "${key}"`);
      }

      if (value.includes(replacementCharacter)) {
        failures.push(`${file}: replacement character at "${key}"`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("i18n message integrity check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`i18n message integrity check passed for ${files.length} locale files.`);
