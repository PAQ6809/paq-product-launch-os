import "server-only";

import { isIP } from "node:net";

type RequestWithIp = Request & {
  ip?: string | null;
};

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    for (const candidate of forwardedFor.split(",")) {
      const normalized = normalizeIp(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }

  const realIp = normalizeIp(request.headers.get("x-real-ip"));
  if (realIp) {
    return realIp;
  }

  const requestIp = normalizeIp((request as RequestWithIp).ip);
  return requestIp ?? "unknown";
}

function normalizeIp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const candidate = value.trim();
  return isIP(candidate) ? candidate : null;
}
