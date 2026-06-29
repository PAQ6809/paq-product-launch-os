import { NextResponse } from "next/server";
import { createDataRequest } from "@/lib/db/data-requests";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return sameOriginError();
  if (process.env.ENABLE_ACCOUNT_DELETE_REQUEST === "false") {
    return NextResponse.json({ error: "ACCOUNT_DELETE_REQUEST_DISABLED" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const dataRequest = await createDataRequest(user.id, "delete_account");
  return NextResponse.json({ request: dataRequest }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
