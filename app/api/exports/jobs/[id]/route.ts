import { NextResponse } from "next/server";
import { getExportJob } from "@/lib/db/export-jobs";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const { id } = await context.params;
  const job = await getExportJob(user.id, id);
  if (!job) return NextResponse.json({ error: "EXPORT_JOB_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ job }, { headers: { "Cache-Control": "no-store" } });
}
