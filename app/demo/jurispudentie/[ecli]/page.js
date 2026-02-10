"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import DemoDashboardShell from "../../../components/DemoDashboardShell";
import { demoScenario, demoSidebarItems } from "../../_data/demoFixtures";

export default function DemoJurispudentieDetailPage() {
  const params = useParams();
  const rawEcli = typeof params?.ecli === "string" ? params.ecli : "";
  const ecli = rawEcli ? decodeURIComponent(rawEcli) : "";

  const detail = useMemo(() => {
    if (!ecli) {
      return null;
    }
    return demoScenario.ecliDetails[ecli] || null;
  }, [ecli]);

  return (
    <DemoDashboardShell
      title="Jurisprudentie detail"
      sidebarItems={demoSidebarItems.detail}
    >
      <div className="form-card detail-card">
        <p className="eyebrow">Uitspraak</p>
        <h2>{detail?.title || "Uitspraak niet gevonden"}</h2>
        <div className="detail-meta">
          <span>{detail?.ecli || ecli || "ECLI onbekend"}</span>
          <span>{detail?.court || "Rechtbank onbekend"}</span>
          <span>{detail?.decision_date || "Datum onbekend"}</span>
        </div>
      </div>

      {detail ? (
        <div className="form-card detail-content">
          <p className="eyebrow">Volledige inhoud</p>
          <div className="detail-sections">
            {detail.content.map((chunk, index) => (
              <p key={`${detail.ecli}-${index}`}>{chunk}</p>
            ))}
          </div>
        </div>
      ) : (
        <div className="form-card detail-content">
          <p className="eyebrow">Volledige inhoud</p>
          <p className="search-note">
            Deze ECLI bestaat niet in de demo-omgeving. Kies een ECLI vanuit de
            demoresultaten.
          </p>
        </div>
      )}
    </DemoDashboardShell>
  );
}
