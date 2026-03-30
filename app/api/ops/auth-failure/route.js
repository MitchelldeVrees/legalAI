import { NextResponse } from "next/server";
import {
  createRequestContext,
  logProviderError,
  logRequestEnd,
  logRequestStart
} from "../../../../lib/observability";

export async function POST(request) {
  const ctx = createRequestContext({ request, route: "/api/ops/auth-failure" });
  logRequestStart(ctx);

  let reason = "unknown";
  try {
    const payload = await request.json().catch(() => ({}));
    reason = String(payload?.reason || "unknown").slice(0, 120);
  } catch {
    reason = "unknown";
  }

  await logProviderError("auth", {
    route: ctx.route,
    request_id: ctx.request_id,
    reason
  });
  await logRequestEnd(ctx, { status: 200 });
  return NextResponse.json({ ok: true });
}
