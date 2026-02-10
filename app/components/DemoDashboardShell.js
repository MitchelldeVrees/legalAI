"use client";

import Link from "next/link";

export default function DemoDashboardShell({
  eyebrow = "Demo",
  title,
  sidebarItems = [],
  children
}) {
  return (
    <main className="page dashboard-shell">
      <div className="halo" aria-hidden="true" />
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <div className="header-actions">
          <Link className="ghost" href="/">
            Ga terug naar home
          </Link>
          <div className="account-chip">
            <div>
              <p>Account</p>
              <strong>Demo gebruiker</strong>
              <span>Voorbeeldomgeving</span>
            </div>
            <div className="avatar" aria-hidden="true" />
          </div>
        </div>
      </header>

      <p className="demo-disclaimer">
        Voorbeeldomgeving met fictieve output. Geen juridisch advies.
      </p>

      <div className="dashboard-body">
        <aside className="sidebar">
          <p className="sidebar-title">Navigatie</p>
          {sidebarItems.map((item) =>
            item.active ? (
              <button
                key={item.label}
                className="sidebar-item active"
                type="button"
                disabled
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

        <section className="dashboard-main">{children}</section>
      </div>
    </main>
  );
}
