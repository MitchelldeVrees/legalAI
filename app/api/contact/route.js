import { NextResponse } from "next/server";
import {
  createRequestContext,
  logProviderError,
  logRequestEnd,
  logRequestStart,
  reportError
} from "../../../lib/observability";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_CONTACT_FUNCTION_NAME =
  process.env.SUPABASE_CONTACT_FUNCTION_NAME || "contact-notify";
const CONTACT_INTERNAL_SECRET = process.env.CONTACT_INTERNAL_SECRET || "";

function asTrimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email) {
  const normalized = email.toLowerCase();
  const parts = normalized.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  if (!localPart || !domain || domain.length < 4 || !domain.includes(".")) {
    return false;
  }

  if (domain.startsWith(".") || domain.endsWith(".")) {
    return false;
  }

  return true;
}

async function sendContactNotification(payload) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase configuratie ontbreekt.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY
  };

  if (CONTACT_INTERNAL_SECRET) {
    headers["x-contact-internal-secret"] = CONTACT_INTERNAL_SECRET;
  }

  const endpoint = `${SUPABASE_URL}/functions/v1/${SUPABASE_CONTACT_FUNCTION_NAME}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const rawText = await response.text();
  let parsedBody = null;
  try {
    parsedBody = rawText ? JSON.parse(rawText) : null;
  } catch {
    parsedBody = null;
  }

  // Some edge functions always return 200 and encode provider failures in the JSON body.
  const embeddedStatusCode =
    parsedBody && typeof parsedBody.statusCode === "number"
      ? parsedBody.statusCode
      : null;

  if (!response.ok || (embeddedStatusCode !== null && embeddedStatusCode >= 400)) {
    const responseText = rawText || JSON.stringify(parsedBody);
    throw new Error(
      `Supabase function fout (${response.status}): ${responseText.slice(0, 400)}`
    );
  }
}

export async function POST(request) {
  const ctx = createRequestContext({ request, route: "/api/contact" });
  logRequestStart(ctx);
  let loggedEnd = false;
  const respond = async (status, payload) => {
    if (!loggedEnd) {
      await logRequestEnd(ctx, { status });
      loggedEnd = true;
    }
    return NextResponse.json(payload, { status });
  };

  let body;

  try {
    body = await request.json();
  } catch {
    return await respond(400, { error: "Ongeldige aanvraag." });
  }

  try {
    const fullName = asTrimmed(body?.fullName);
    const workEmail = asTrimmed(body?.workEmail);
    const firmName = asTrimmed(body?.firmName);
    const role = asTrimmed(body?.role);
    const useCase = asTrimmed(body?.useCase);
    const website = asTrimmed(body?.website);

    if (website) {
      if (!loggedEnd) {
        await logRequestEnd(ctx, { status: 200, extra: { honeypot: true } });
        loggedEnd = true;
      }
      return NextResponse.json({ ok: true });
    }

    if (!fullName || !workEmail || !firmName || !role || !useCase) {
      return await respond(400, { error: "Vul alle verplichte velden in." });
    }

    if (
      fullName.length > 120 ||
      workEmail.length > 160 ||
      firmName.length > 160 ||
      role.length > 120 ||
      useCase.length > 2500
    ) {
      return await respond(400, { error: "Een of meer velden zijn te lang." });
    }

    if (!isValidEmail(workEmail)) {
      return await respond(400, { error: "Gebruik een geldig e-mailadres." });
    }

    const submittedAt = new Date().toISOString();

    console.info("[contact-request]", {
      fullName,
      workEmail,
      firmName,
      role,
      useCase,
      submittedAt
    });

    await sendContactNotification({
      fullName,
      workEmail,
      firmName,
      role,
      useCase,
      submittedAt
    });

    if (!loggedEnd) {
      await logRequestEnd(ctx, { status: 200 });
      loggedEnd = true;
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact-request-error]", error);
    await logProviderError("supabase", {
      route: ctx.route,
      request_id: ctx.request_id,
      error_message: String(error?.message || "")
    });
    await reportError({
      ctx,
      error,
      status: 502,
      tags: { component: "contact_api" }
    });
    loggedEnd = true;
    return NextResponse.json(
      { error: "Aanvraag ontvangen, maar afleveren via e-mail is mislukt." },
      { status: 502 }
    );
  }
}
