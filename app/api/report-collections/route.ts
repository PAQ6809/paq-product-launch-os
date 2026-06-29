import { NextResponse } from "next/server";
import { createReportCollection, listReportCollections } from "@/lib/db/report-collections";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const collections = await listReportCollections(user.id);
  return NextResponse.json({ collections }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return sameOriginError();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const input = readCollectionInput(payload);
  if (!input) return NextResponse.json({ error: "INVALID_COLLECTION" }, { status: 400 });

  const collection = await createReportCollection(user.id, input);
  return NextResponse.json({ collection }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

function readCollectionInput(payload: unknown) {
  if (!isRecord(payload)) return null;
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : undefined;
  const productIds = Array.isArray(payload.productIds)
    ? payload.productIds.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
  const templateId = typeof payload.templateId === "string" ? payload.templateId : "portfolio-overview";

  if (!title || productIds.length === 0) return null;
  return { title, description, productIds, templateId };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
