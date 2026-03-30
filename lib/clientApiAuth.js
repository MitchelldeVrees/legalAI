"use client";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return String(data?.session?.access_token || "").trim();
};

export const buildAuthenticatedHeaders = async (baseHeaders = {}) => {
  const token = await getAccessToken();
  const headers = { ...baseHeaders };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
};

