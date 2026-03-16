import { NextResponse } from "next/server";

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const SUPABASE_CONTACT_FUNCTION_NAME =
  process.env.SUPABASE_CONTACT_FUNCTION_NAME || "contact-notify";
const CONTACT_INTERNAL_SECRET = process.env.CONTACT_INTERNAL_SECRET || "";
const CONTACT_RECIPIENT_EMAIL = process.env.CONTACT_RECIPIENT_EMAIL || "";
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || "LegalAI <onboarding@resend.dev>";

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
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag." },
      { status: 400 }
    );
  }

  try {
    const fullName = asTrimmed(body?.fullName);
    const workEmail = asTrimmed(body?.workEmail);
    const firmName = asTrimmed(body?.firmName);
    const role = asTrimmed(body?.role);
    const useCase = asTrimmed(body?.useCase);
    const website = asTrimmed(body?.website);

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (!fullName || !workEmail || !firmName || !role || !useCase) {
      return NextResponse.json(
        { error: "Vul alle verplichte velden in." },
        { status: 400 }
      );
    }

    if (
      fullName.length > 120 ||
      workEmail.length > 160 ||
      firmName.length > 160 ||
      role.length > 120 ||
      useCase.length > 2500
    ) {
      return NextResponse.json(
        { error: "Een of meer velden zijn te lang." },
        { status: 400 }
      );
    }

    if (!isValidEmail(workEmail)) {
      return NextResponse.json(
        { error: "Gebruik een geldig e-mailadres." },
        { status: 400 }
      );
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

    const subject = `Nieuwe contactaanvraag van ${fullName}`;
    const text = [
      "Nieuwe contactaanvraag ontvangen:",
      `Naam: ${fullName}`,
      `E-mail: ${workEmail}`,
      `Kantoor: ${firmName}`,
      `Functie: ${role}`,
      `Ingediend op: ${submittedAt}`,
      "",
      "Hulpvraag:",
      useCase
    ].join("\n");
    const html = [
      "<h2>Nieuwe contactaanvraag</h2>",
      `<p><strong>Naam:</strong> ${fullName}</p>`,
      `<p><strong>E-mail:</strong> ${workEmail}</p>`,
      `<p><strong>Kantoor:</strong> ${firmName}</p>`,
      `<p><strong>Functie:</strong> ${role}</p>`,
      `<p><strong>Ingediend op:</strong> ${submittedAt}</p>`,
      "<h3>Hulpvraag</h3>",
      `<p>${useCase.replaceAll("\n", "<br />")}</p>`
    ].join("");

    const toRecipients = CONTACT_RECIPIENT_EMAIL
      ? [CONTACT_RECIPIENT_EMAIL]
      : [];

    if (!toRecipients.length) {
      throw new Error("CONTACT_RECIPIENT_EMAIL ontbreekt in de app-omgeving.");
    }

    await sendContactNotification({
      fullName,
      workEmail,
      firmName,
      role,
      useCase,
      submittedAt,
      to: toRecipients,
      from: CONTACT_FROM_EMAIL,
      reply_to: workEmail,
      subject,
      text,
      html
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact-request-error]", error);
    return NextResponse.json(
      { error: "Aanvraag ontvangen, maar afleveren via e-mail is mislukt." },
      { status: 502 }
    );
  }
}
