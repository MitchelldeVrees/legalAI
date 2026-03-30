"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "../../components/DashboardShell";

export default function JurispudentieDetailPage() {
  const params = useParams();
  const rawEcli = typeof params?.ecli === "string" ? params.ecli : "";
  const ecli = rawEcli ? decodeURIComponent(rawEcli) : "";
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [detail, setDetail] = useState({
    ecli: "",
    title: "",
    court: "",
    decision_date: "",
    content: [],
    raw_xml: "",
    uitspraak_html: ""
  });

  useEffect(() => {
    if (!ecli) {
      setStatus({ loading: false, error: "ECLI ontbreekt." });
      return;
    }

    const loadDetail = async () => {
      setStatus({ loading: true, error: "" });

      try {
        const response = await fetch(`/api/ecli/${encodeURIComponent(ecli)}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error("ECLI fetch failed:", response.status, errorText);
          throw new Error("Fetch failed.");
        }

        const data = await response.json();
        setDetail({
          ecli: data?.ecli || ecli,
          title: data?.title || "",
          court: data?.court || "",
          decision_date: data?.decision_date || "",
          content: Array.isArray(data?.content) ? data.content : [],
          raw_xml: data?.raw_xml || "",
          uitspraak_html: data?.uitspraak_html || ""
        });
        setStatus({ loading: false, error: "" });
      } catch (error) {
        console.error("ECLI fetch error:", error);
        setStatus({
          loading: false,
          error: "Ophalen van de uitspraak is mislukt."
        });
      }
    };

    loadDetail();
  }, [ecli]);

  return (
    <DashboardShell
      title="Jurisprudentie detail"
      sidebarItems={[
        { label: "Contract reader", href: "/dashboard" },
        { label: "Jurispudentie search", href: "/jurispudentie-search" },
        { label: "Vraag stellen", href: "/vraag-stellen" }
      ]}
    >
      <div className="form-card detail-card">
        <p className="eyebrow">Uitspraak</p>
        <h2>{detail.title || detail.ecli || "Onbekende uitspraak"}</h2>
        <div className="detail-meta">
          <span>{detail.ecli || "ECLI onbekend"}</span>
          <span>{detail.court || "Rechtbank onbekend"}</span>
          <span>{detail.decision_date || "Datum onbekend"}</span>
        </div>
        {status.loading ? (
          <p className="search-note">Bezig met laden...</p>
        ) : null}
        {status.error ? <p className="form-error">{status.error}</p> : null}
      </div>

      {!status.loading && !status.error ? (
        <div className="form-card detail-content">
          <p className="eyebrow">Volledige inhoud</p>
          {detail.uitspraak_html ? (
            <div
              className="uitspraak-html"
              dangerouslySetInnerHTML={{ __html: detail.uitspraak_html }}
            />
          ) : detail.content.length ? (
            <div className="detail-sections">
              {detail.content.map((chunk, index) => (
                <p key={`${detail.ecli}-${index}`}>{chunk}</p>
              ))}
            </div>
          ) : (
            <p className="search-note">Geen inhoud beschikbaar.</p>
          )}
        </div>
      ) : null}

    </DashboardShell>
  );
}
