import { NextResponse } from "next/server";

const personalDomains = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
  "yahoo.com",
  "proton.me",
  "protonmail.com",
  "gmx.com"
]);

function asTrimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidBusinessEmail(email) {
  const normalized = email.toLowerCase();
  const parts = normalized.split("@");

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  if (!localPart || !domain || domain.length < 4 || !domain.includes(".")) {
    return false;
  }

  return !personalDomains.has(domain);
}

export async function POST(request) {
  try {
    const body = await request.json();

    const fullName = asTrimmed(body.fullName);
    const workEmail = asTrimmed(body.workEmail);
    const firmName = asTrimmed(body.firmName);
    const role = asTrimmed(body.role);
    const useCase = asTrimmed(body.useCase);
    const website = asTrimmed(body.website);

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

    if (!isValidBusinessEmail(workEmail)) {
      return NextResponse.json(
        { error: "Gebruik een zakelijk e-mailadres." },
        { status: 400 }
      );
    }

    console.info("[contact-request]", {
      fullName,
      workEmail,
      firmName,
      role,
      useCase
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Ongeldige aanvraag." },
      { status: 400 }
    );
  }
}
