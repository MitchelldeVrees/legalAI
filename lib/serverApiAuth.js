import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const getHeader = (headers, key) => {
  if (!headers) {
    return "";
  }

  if (typeof headers.get === "function") {
    return String(headers.get(key) || "").trim();
  }

  const lower = key.toLowerCase();
  return String(headers[lower] || headers[key] || "").trim();
};

export const getBearerToken = (headers) => {
  const authHeader = getHeader(headers, "authorization");
  if (!authHeader) {
    return "";
  }
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
};

export const requireAuthenticatedAccount = async (headers) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return {
      ok: false,
      status: 500,
      error: "Serverconfiguratie ontbreekt."
    };
  }

  const accessToken = getBearerToken(headers);
  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      error: "Niet geauthenticeerd."
    };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return {
      ok: false,
      status: 401,
      error: "Sessie ongeldig of verlopen."
    };
  }

  const user = userData.user;
  const email = String(user.email || "").trim().toLowerCase();
  if (!email) {
    return {
      ok: false,
      status: 403,
      error: "Accountgegevens ontbreken."
    };
  }

  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, email, firm_id")
    .eq("email", email)
    .maybeSingle();

  if (accountError) {
    return {
      ok: false,
      status: 500,
      error: "Accountcontrole mislukt."
    };
  }

  if (!account?.firm_id) {
    return {
      ok: false,
      status: 403,
      error: "Geen actief kantoorprofiel gevonden."
    };
  }

  return {
    ok: true,
    user,
    account: {
      id: String(account.id || "").trim(),
      email: String(account.email || "").trim().toLowerCase(),
      firm_id: String(account.firm_id || "").trim()
    }
  };
};

