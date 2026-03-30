import { NextResponse } from "next/server";
import {
  createRequestContext,
  getMetricsSnapshot,
  logRequestEnd,
  logRequestStart
} from "../../../../lib/observability";
import { getMonthlyCostProjection } from "../../../../lib/costModel";

const OPS_DASHBOARD_TOKEN = process.env.OPS_DASHBOARD_TOKEN || "";

export async function GET(request) {
  const ctx = createRequestContext({ request, route: "/api/ops/metrics" });
  logRequestStart(ctx);

  if (!OPS_DASHBOARD_TOKEN) {
    await logRequestEnd(ctx, { status: 503 });
    return NextResponse.json(
      { error: "Ops dashboard is not configured." },
      { status: 503 }
    );
  }

  const providedToken = String(
    request.headers.get("x-ops-token") || request.headers.get("authorization") || ""
  )
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!providedToken || providedToken !== OPS_DASHBOARD_TOKEN) {
    await logRequestEnd(ctx, { status: 403 });
    return NextResponse.json({ error: "Unauthorized." }, { status: 403 });
  }

  await logRequestEnd(ctx, { status: 200 });
  return NextResponse.json(
    {
      ...getMetricsSnapshot(),
      monthly_cost_projection: getMonthlyCostProjection()
    },
    { status: 200 }
  );
}
