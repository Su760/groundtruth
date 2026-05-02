import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GTHeader, GTDots } from "../components/primitives";

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 172800) return "yesterday";
  return `${Math.floor(diff / 86400)} days ago`;
}

const GRID_COLS = "40px 1fr 140px 110px 80px 24px";

export default function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/reports`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`);
        return r.json();
      })
      .then(setReports)
      .catch((e) => setError(e.message));
  }, []);

  const header = (
    <GTHeader
      crumbs={[{ label: "history" }]}
      nav={false}
      right={
        <span
          className="gt-crumb gt-crumb-link"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer", marginRight: 8 }}
        >
          ← back
        </span>
      }
    />
  );

  return (
    <div
      className="gt-root gt-texture gt-scroll"
      style={{ minHeight: "100vh" }}
    >
      {header}

      <div style={{ maxWidth: 980, margin: "0 auto", padding: "40px 36px" }}>
        <div className="gt-mono" style={{ marginBottom: 14 }}>
          PAST ANALYSES · LOCAL TO THIS BROWSER
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: "var(--ink-0)",
            marginBottom: 28,
          }}
        >
          Your <span style={{ fontStyle: "italic" }}>archive</span>.
        </div>

        {/* Loading */}
        {reports === null && !error && (
          <div
            style={{
              padding: "60px 0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              className="gt-pulse"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--signal)",
              }}
            />
            <div className="gt-mono" style={{ fontSize: 10 }}>
              LOADING
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="gt-meta" style={{ color: "var(--signal)" }}>
            Failed to load history: {error}
          </div>
        )}

        {/* Table */}
        {reports !== null && !error && (
          <>
            {/* Table header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                gap: 16,
                padding: "10px 16px",
                borderTop: "1px solid var(--hairline)",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              <span className="gt-mono" style={{ fontSize: 9 }}>
                #
              </span>
              <span className="gt-mono" style={{ fontSize: 9 }}>
                TOPIC
              </span>
              <span className="gt-mono" style={{ fontSize: 9 }}>
                WHEN
              </span>
              <span className="gt-mono" style={{ fontSize: 9 }}>
                CONF
              </span>
              <span className="gt-mono" style={{ fontSize: 9 }}>
                SOURCES
              </span>
              <span />
            </div>

            {/* Report rows */}
            {reports.map((r, i) => {
              const confVal =
                r.confidence_score != null
                  ? Math.round(r.confidence_score * 5)
                  : 0;
              const sources = r.sources_count ?? r.sources ?? null;
              return (
                <div
                  key={r.slug}
                  className="gt-card-hover"
                  style={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLS,
                    gap: 16,
                    padding: "14px 16px",
                    borderBottom: "1px solid var(--hairline)",
                    alignItems: "center",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    navigate("/analyze?topic=" + encodeURIComponent(r.title))
                  }
                >
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--ink-3)",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 18,
                        color: "var(--ink-0)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {r.title}
                    </div>
                    {r.blocs_covered != null && (
                      <div
                        className="gt-meta"
                        style={{ fontSize: 11, marginTop: 2 }}
                      >
                        {r.blocs_covered} blocs covered
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--ink-2)",
                    }}
                  >
                    {timeAgo(r.created_at)}
                  </span>
                  <GTDots value={confVal} max={5} tone="phosphor" />
                  <span
                    style={{
                      fontFamily: "var(--mono)",
                      fontSize: 11,
                      color: "var(--ink-2)",
                    }}
                  >
                    {sources != null ? sources : "—"}
                  </span>
                  <span
                    style={{
                      color: "var(--ink-3)",
                      fontFamily: "var(--mono)",
                    }}
                  >
                    →
                  </span>
                </div>
              );
            })}

            {/* Ghost row */}
            <div
              style={{
                marginTop: 12,
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: GRID_COLS,
                gap: 16,
                alignItems: "center",
                border: "1px dashed var(--hairline-strong)",
                borderRadius: 4,
                opacity: 0.5,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--ink-4)",
                }}
              >
                {String(reports.length + 1).padStart(2, "0")}
              </span>
              <div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 16,
                    color: "var(--ink-3)",
                    fontStyle: "italic",
                  }}
                >
                  {reports.length === 0
                    ? "No analyses yet — run a topic from the home page →"
                    : "Run a topic from the home page →"}
                </div>
                <div
                  className="gt-meta"
                  style={{ fontSize: 11, marginTop: 2, color: "var(--ink-4)" }}
                >
                  Reports saved locally
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--ink-4)",
                }}
              >
                —
              </span>
              <GTDots value={0} max={5} />
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--ink-4)",
                }}
              >
                —
              </span>
              <span />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
