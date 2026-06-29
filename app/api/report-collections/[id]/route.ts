import { NextResponse } from "next/server";
import { archiveReportCollection, getReportCollection } from "@/lib/db/report-collections";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { id } = await context.params;
  const collection = await getReportCollection(user.id, id);
  if (!collection) return NextResponse.json({ error: "COLLECTION_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ collection }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOriginRequest(request)) return sameOriginError();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { id } = await context.params;
  await archiveReportCollection(user.id, id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
