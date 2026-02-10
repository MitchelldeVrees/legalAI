"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

let accountCache = {
  email: "",
  fullName: "",
  ready: false
};
let accountLoadPromise = null;

const readAccountFromSupabase = async () => {
  const { data } = await supabase.auth.getUser();
  const userEmail = data?.user?.email || "";
  if (!userEmail) {
    return { email: "", fullName: "", ready: false };
  }

  let fullName = "";
  const { data: accountRow } = await supabase
    .from("accounts")
    .select("full_name")
    .eq("email", userEmail)
    .single();

  if (accountRow?.full_name) {
    fullName = accountRow.full_name;
  }

  return {
    email: userEmail,
    fullName,
    ready: true
  };
};

const loadAccountWithCache = async () => {
  if (accountCache.ready) {
    return accountCache;
  }

  if (!accountLoadPromise) {
    accountLoadPromise = readAccountFromSupabase()
      .then((result) => {
        accountCache = result;
        return result;
      })
      .finally(() => {
        accountLoadPromise = null;
      });
  }

  return accountLoadPromise;
};

export default function DashboardShell({
  eyebrow = "Dashboard",
  title,
  sidebarItems = [],
  children
}) {
  const router = useRouter();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountName, setAccountName] = useState("Gebruiker");
  const [accountEmail, setAccountEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [accountStatus, setAccountStatus] = useState({
    loading: false,
    error: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      const cached = await loadAccountWithCache();
      const userEmail = cached.email;
      if (!userEmail) {
        router.push("/login");
        return;
      }

      setAccountEmail(userEmail);
      setAccountName(cached.fullName || "Gebruiker");
      setAuthReady(true);
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user?.email) {
        accountCache = { email: "", fullName: "", ready: false };
      }
    });

    loadUser();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    accountCache = { email: "", fullName: "", ready: false };
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleDeleteAccount = async () => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error("Delete account: missing Supabase env vars");
      setAccountStatus({
        loading: false,
        error: "Account verwijderen is nu niet beschikbaar."
      });
      return;
    }

    const confirmed = window.confirm(
      "Weet je zeker dat je dit account permanent wilt verwijderen?"
    );
    if (!confirmed) {
      return;
    }

    const emailToDelete = accountEmail;
    if (!emailToDelete) {
      return;
    }

    setAccountStatus({ loading: true, error: "" });

    try {
      const { data: accountRow, error: fetchError } = await supabase
        .from("accounts")
        .select("id, firm_id")
        .eq("email", emailToDelete)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const { error: deleteAccountError } = await supabase
        .from("accounts")
        .delete()
        .eq("id", accountRow.id);

      if (deleteAccountError) {
        throw deleteAccountError;
      }

      if (accountRow.firm_id) {
        const { error: deleteFirmError } = await supabase
          .from("firms")
          .delete()
          .eq("id", accountRow.firm_id);

        if (deleteFirmError) {
          throw deleteFirmError;
        }
      }

      await handleSignOut();
    } catch (error) {
      console.error("Delete account failed:", error);
      setAccountStatus({
        loading: false,
        error: "Verwijderen mislukt. Probeer het opnieuw."
      });
    }
  };

  const showLoading = !authReady;

  return (
    <main className="page dashboard-shell">
      <div className="halo" aria-hidden="true" />
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="account-chip">
          <div>
            <p>Account</p>
            <strong>{showLoading ? "Laden..." : accountName}</strong>
            <span>Instellingen</span>
          </div>
          <button
            className="avatar-button"
            type="button"
            onClick={() => {
              if (!showLoading) {
                setAccountMenuOpen((open) => !open);
              }
            }}
            aria-label="Accountmenu"
            disabled={showLoading}
          >
            <div className="avatar" aria-hidden="true" />
          </button>
          {accountMenuOpen && !showLoading ? (
            <div className="account-menu">
              <button type="button" onClick={handleSignOut}>
                Uitloggen
              </button>
              <button
                type="button"
                className="danger"
                onClick={handleDeleteAccount}
              >
                Account verwijderen
              </button>
            </div>
          ) : null}
        </div>
      </header>
      {accountStatus.error ? (
        <p className="form-error">{accountStatus.error}</p>
      ) : null}

      <div className="dashboard-body">
        <aside className="sidebar">
          <p className="sidebar-title">Navigatie</p>
          {sidebarItems.map((item) =>
            item.active ? (
              <button
                key={item.label}
                className="sidebar-item active"
                type="button"
              >
                {item.label}
              </button>
            ) : (
              <Link key={item.label} className="sidebar-item" href={item.href}>
                {item.label}
              </Link>
            )
          )}
        </aside>

        <section className="dashboard-main">
          {showLoading ? (
            <div className="form-card dashboard-card">
              <p className="eyebrow">Dashboard</p>
              <h2>Bezig met laden...</h2>
            </div>
          ) : (
            children
          )}
        </section>
      </div>
    </main>
  );
}
