import "server-only";

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const expectedOrigin = getExpectedOrigin(request);

  if (origin) return origin === expectedOrigin;
  if (referer) return safeOrigin(referer) === expectedOrigin;

  // Some same-site server/runtime calls omit both headers. Keep this permissive in v0.4.5.
  return true;
}

export function sameOriginError() {
  return Response.json(
    {
      error: "INVALID_ORIGIN",
      message: "State-changing requests must come from the same origin."
    },
    { status: 403, headers: { "Cache-Control": "no-store" } }
  );
}

function getExpectedOrigin(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return new URL(appUrl).origin;
  return new URL(request.url).origin;
}

function safeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
}
