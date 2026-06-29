import { NextResponse } from "next/server";
import { listExportJobs } from "@/lib/db/export-jobs";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const jobs = await listExportJobs(user.id);
  return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store" } });
}
