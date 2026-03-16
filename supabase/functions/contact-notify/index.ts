import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ContactPayload = {
  fullName?: string;
  workEmail?: string;
  firmName?: string;
  role?: string;
  useCase?: string;
  submittedAt?: string;
};

function asTrimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function insertContactRequestRecord(payload: Required<ContactPayload>) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !serviceRoleKey) {
    return;
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/contact_requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      Prefer: "return=minimal"
    },
    body: JSON.stringify([
      {
        full_name: payload.fullName,
        work_email: payload.workEmail,
        firm_name: payload.firmName,
        role: payload.role,
        use_case: payload.useCase,
        submitted_at: payload.submittedAt
      }
    ])
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Kon contact_requests niet opslaan (${response.status}): ${text.slice(0, 200)}`);
  }
}

async function sendEmail(payload: Required<ContactPayload>) {
  const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
  const recipientEmail = Deno.env.get("CONTACT_RECIPIENT_EMAIL") || "";
  const fromEmail = Deno.env.get("CONTACT_FROM_EMAIL") || "LegalAI <onboarding@resend.dev>";

  if (!resendApiKey || !recipientEmail) {
    throw new Error("RESEND_API_KEY of CONTACT_RECIPIENT_EMAIL ontbreekt.");
  }

  const subject = `Nieuwe contactaanvraag van ${payload.fullName}`;
  const text = [
    "Nieuwe contactaanvraag ontvangen:",
    `Naam: ${payload.fullName}`,
    `E-mail: ${payload.workEmail}`,
    `Kantoor: ${payload.firmName}`,
    `Functie: ${payload.role}`,
    `Ingediend op: ${payload.submittedAt}`,
    "",
    "Hulpvraag:",
    payload.useCase
  ].join("\n");

  const html = `
    <h2>Nieuwe contactaanvraag</h2>
    <p><strong>Naam:</strong> ${escapeHtml(payload.fullName)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(payload.workEmail)}</p>
    <p><strong>Kantoor:</strong> ${escapeHtml(payload.firmName)}</p>
    <p><strong>Functie:</strong> ${escapeHtml(payload.role)}</p>
    <p><strong>Ingediend op:</strong> ${escapeHtml(payload.submittedAt)}</p>
    <h3>Hulpvraag</h3>
    <p>${escapeHtml(payload.useCase).replaceAll("\n", "<br />")}</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [recipientEmail],
      reply_to: payload.workEmail,
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`E-mail versturen mislukt (${response.status}): ${responseText.slice(0, 300)}`);
  }
}

serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const requiredInternalSecret = Deno.env.get("CONTACT_INTERNAL_SECRET") || "";
  if (requiredInternalSecret) {
    const receivedInternalSecret = request.headers.get("x-contact-internal-secret") || "";
    if (receivedInternalSecret !== requiredInternalSecret) {
      return jsonResponse(401, { error: "Unauthorized" });
    }
  }

  let rawPayload: ContactPayload;
  try {
    rawPayload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse(400, { error: "Invalid JSON" });
  }

  const payload = {
    fullName: asTrimmed(rawPayload.fullName),
    workEmail: asTrimmed(rawPayload.workEmail),
    firmName: asTrimmed(rawPayload.firmName),
    role: asTrimmed(rawPayload.role),
    useCase: asTrimmed(rawPayload.useCase),
    submittedAt: asTrimmed(rawPayload.submittedAt) || new Date().toISOString()
  };

  if (!payload.fullName || !payload.workEmail || !payload.firmName || !payload.role || !payload.useCase) {
    return jsonResponse(400, { error: "Missing required fields" });
  }

  try {
    await insertContactRequestRecord(payload);
    await sendEmail(payload);
    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error("[contact-notify-error]", error);
    return jsonResponse(500, { error: "Contact delivery failed" });
  }
});
