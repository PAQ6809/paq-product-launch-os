import { NextResponse } from "next/server";
import { createDataRequest, listDataRequests } from "@/lib/db/data-requests";
import { listExportJobs } from "@/lib/db/export-jobs";
import { listProducts } from "@/lib/db/products";
import { listReportCollections } from "@/lib/db/report-collections";
import { isSameOriginRequest, sameOriginError } from "@/lib/security/same-origin";
import { getCurrentUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return sameOriginError();
  if (process.env.ENABLE_DATA_EXPORT === "false") {
    return NextResponse.json({ error: "DATA_EXPORT_DISABLED" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const dataRequest = await createDataRequest(user.id, "export_data");
  const [products, collections, exportJobs, dataRequests] = await Promise.all([
    listProducts(user.id),
    listReportCollections(user.id),
    listExportJobs(user.id),
    listDataRequests(user.id)
  ]);

  return NextResponse.json(
    {
      request: dataRequest,
      export: {
        profile: { id: user.id, email: user.email ?? null },
        products,
        collections,
        exportJobs,
        dataRequests
      }
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
