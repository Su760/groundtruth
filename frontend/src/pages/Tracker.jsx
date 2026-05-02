import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GTHeader,
  GTDots,
  GTSparkline,
  GTMark,
  BLOCS,
  blocFromRegion,
} from "../components/primitives";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function driftScore(textA, textB) {
  if (!textA || !textB) return null;
  const wordsA = new Set(textA.toLowerCase().match(/\w+/g) || []);
  const wordsB = new Set(textB.toLowerCase().match(/\w+/g) || []);
  const shared = [...wordsA].filter((w) => wordsB.has(w)).length;
  const maxLen = Math.max(wordsA.size, wordsB.size);
  if (maxLen === 0) return null;
  return Math.round((shared / maxLen) * 5);
}

// Convert similarity score → drift value for GTDots tone="drift"
function driftValue(textA, textB) {
  const sim = driftScore(textA, textB);
  if (sim === null) return null;
  return Math.max(0, 5 - sim);
}

function driftLabel(val) {
  if (val === null) return "No data";
  if (val <= 1) return "Stable";
  if (val <= 2) return "Low drift";
  if (val <= 3) return "Moderate";
  return "High drift";
}

const BLOC_FIELDS = [
  { key: "narrative_frame", label: "NARRATIVE FRAME" },
  { key: "structural_interests", label: "STRUCTURAL INTERESTS" },
  { key: "what_this_bloc_gains", label: "WHAT THIS BLOC GAINS" },
  { key: "deliberate_vs_organic", label: "DELIBERATE VS ORGANIC" },
];

const COMPARE_FIELDS = [
  { key: "narrative_frame", label: "NARRATIVE FRAME" },
  { key: "structural_interests", label: "STRUCTURAL INTERESTS" },
  { key: "what_this_bloc_gains", label: "WHAT THIS BLOC GAINS" },
];

function BlocDetailCard({ snapshot }) {
  const bloc = blocFromRegion(snapshot.region);
  const color = bloc ? bloc.color : "var(--ink-4)";
  const name = bloc ? bloc.name : snapshot.region;
  const code = bloc ? bloc.code : "??";

  return (
    <div className="gt-card" style={{ padding: "22px 26px", marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
          }}
        />
        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 13,
            color: "var(--ink-0)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {name}
        </div>
        <span className="gt-bloc-code">{code}</span>
      </div>

      {BLOC_FIELDS.map((field) => {
        const val = snapshot[field.key];
        const isError = val === "[parse error]";
        return (
          <div key={field.key} style={{ marginBottom: 16 }}>
            <div
              className="gt-mono"
              style={{ marginBottom: 8, color: "var(--ink-2)" }}
            >
              {field.label}
            </div>
            {isError ? (
              <div
                className="gt-meta"
                style={{ fontStyle: "italic", color: "var(--ink-3)" }}
              >
                Analysis unavailable for this run.
              </div>
            ) : (
              <div className="gt-body">{val || "—"}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CompareBlocCard({ region, snapA, snapB, dateA, dateB }) {
  const bloc = blocFromRegion(region);
  const color = bloc ? bloc.color : "var(--ink-4)";
  const name = bloc ? bloc.name : region;
  const code = bloc ? bloc.code : "??";
  const drift = driftValue(snapA?.narrative_frame, snapB?.narrative_frame);

  return (
    <div className="gt-card" style={{ padding: "22px 26px", marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid var(--hairline)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
            }}
          />
          <div
            style={{
              fontFamily: "var(--mono)",
              fontSize: 13,
              color: "var(--ink-0)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {name}
          </div>
          <span className="gt-bloc-code">{code}</span>
        </div>
        {drift !== null && (
          <GTDots
            value={drift}
            max={5}
            tone="drift"
            label={driftLabel(drift)}
          />
        )}
      </div>

      {COMPARE_FIELDS.map((field) => {
        const valA = snapA?.[field.key];
        const valB = snapB?.[field.key];
        const isErrA = valA === "[parse error]";
        const isErrB = !snapB || valB === "[parse error]";

        return (
          <div key={field.key} style={{ marginBottom: 20 }}>
            <div className="gt-mono" style={{ marginBottom: 8 }}>
              {field.label}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
              }}
            >
              <div>
                <div
                  className="gt-mono"
                  style={{
                    marginBottom: 6,
                    color: "var(--signal)",
                    fontSize: 9,
                  }}
                >
                  RUN A · {dateA}
                </div>
                {isErrA ? (
                  <div
                    className="gt-meta"
                    style={{ fontStyle: "italic", color: "var(--ink-3)" }}
                  >
                    Analysis unavailable for this run.
                  </div>
                ) : (
                  <div className="gt-body">{valA || "—"}</div>
                )}
              </div>
              <div>
                <div
                  className="gt-mono"
                  style={{
                    marginBottom: 6,
                    color: "var(--amber)",
                    fontSize: 9,
                  }}
                >
                  RUN B · {dateB}
                </div>
                {isErrB ? (
                  <div
                    className="gt-meta"
                    style={{ fontStyle: "italic", color: "var(--ink-3)" }}
                  >
                    Analysis unavailable for this run.
                  </div>
                ) : (
                  <div className="gt-body">{valB || "—"}</div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Tracker() {
  const navigate = useNavigate();
  const [view, setView] = useState("list");
  const [topics, setTopics] = useState(null);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [runA, setRunA] = useState(0);
  const [runB, setRunB] = useState(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/tracker`)
      .then((r) => r.json())
      .then((data) => {
        setTopics(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  function handleTopicClick(slug) {
    setLoading(true);
    setError(null);
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/tracker/${slug}`,
    )
      .then((r) => r.json())
      .then((data) => {
        setHistory(data);
        setSelectedSlug(slug);
        setRunA(0);
        setRunB(data.length - 1);
        setView("detail");
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }

  function handleBackToList() {
    setView("list");
    setHistory(null);
    setSelectedSlug(null);
  }

  const isSingleRun = history && history.length === 1;

  function getRegionsForRuns() {
    if (!history) return [];
    const runAData = history[runA];
    const runBData = history[runB];
    const allRegions = new Set();
    (runAData?.bloc_snapshots || []).forEach((s) => allRegions.add(s.region));
    (runBData?.bloc_snapshots || []).forEach((s) => allRegions.add(s.region));
    return [...allRegions].sort();
  }

  function getSnapForRegion(runIdx, region) {
    return (
      history?.[runIdx]?.bloc_snapshots?.find((s) => s.region === region) ||
      null
    );
  }

  // Stats for list view
  const totalRuns = topics
    ? topics.reduce((sum, t) => sum + t.run_count, 0)
    : 0;
  const highDriftTopics = topics
    ? topics.filter((t) => {
        const sparkData = Array.from({ length: t.run_count }, () => 1);
        return Math.max(...sparkData) >= 4;
      }).length
    : 0;

  // Overall drift for compare banner
  const overallDrift = (() => {
    if (!history || runB === null || isSingleRun) return null;
    const regions = getRegionsForRuns();
    const scores = regions
      .map((r) => {
        const sA = getSnapForRegion(runA, r);
        const sB = getSnapForRegion(runB, r);
        return driftValue(sA?.narrative_frame, sB?.narrative_frame);
      })
      .filter((s) => s !== null);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  })();

  const currentTopic = history?.[0]?.topic || selectedSlug || "";

  const headerCrumbs =
    view === "detail"
      ? [{ label: "tracker", link: true }, { label: currentTopic }]
      : [{ label: "tracker" }];

  return (
    <div
      className="gt-root gt-texture gt-scroll"
      style={{ minHeight: "100vh" }}
    >
      <GTHeader crumbs={headerCrumbs} />

      {/* Loading */}
      {loading && (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
          <div
            className="gt-pulse"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--signal)",
              margin: "0 auto",
              marginBottom: 16,
            }}
          />
          <div className="gt-mono">LOADING</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div
          style={{
            maxWidth: 600,
            margin: "60px auto",
            padding: "0 36px",
          }}
        >
          <div
            className="gt-card"
            style={{
              padding: "24px 28px",
              borderColor: "var(--signal-dim)",
            }}
          >
            <div
              className="gt-mono"
              style={{ color: "var(--signal)", marginBottom: 10 }}
            >
              ERROR
            </div>
            <div className="gt-body" style={{ marginBottom: 20 }}>
              {error}
            </div>
            <button
              className="gt-btn gt-btn-ghost"
              onClick={handleBackToList}
              style={{ fontSize: 11 }}
            >
              ← Back to list
            </button>
          </div>
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {!loading && !error && view === "list" && topics && (
        <div className="gt-scroll" style={{ padding: "40px 36px 60px" }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <div className="gt-mono" style={{ marginBottom: 14 }}>
              NARRATIVE ARC TRACKER
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 52,
                lineHeight: 1,
                letterSpacing: "-0.025em",
                color: "var(--ink-0)",
                marginBottom: 16,
              }}
            >
              Watch narratives{" "}
              <span style={{ fontStyle: "italic" }}>drift</span> over time.
            </div>
            <div
              className="gt-body"
              style={{
                color: "var(--ink-2)",
                maxWidth: 580,
                marginBottom: 36,
              }}
            >
              Re-run any topic and we&apos;ll show you how each bloc&apos;s
              framing has shifted. Each dot is one run, colored by drift from
              baseline.
            </div>

            {/* Stats bar */}
            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "center",
                marginBottom: 28,
                padding: "14px 0",
                borderTop: "1px solid var(--hairline)",
                borderBottom: "1px solid var(--hairline)",
              }}
            >
              <div>
                <div
                  className="gt-mono"
                  style={{ fontSize: 9, marginBottom: 5 }}
                >
                  TRACKED
                </div>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    color: "var(--ink-0)",
                  }}
                >
                  {topics.length}
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  background: "var(--hairline)",
                  alignSelf: "stretch",
                }}
              />
              <div>
                <div
                  className="gt-mono"
                  style={{ fontSize: 9, marginBottom: 5 }}
                >
                  TOTAL RUNS
                </div>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    color: "var(--ink-0)",
                  }}
                >
                  {totalRuns}
                </span>
              </div>
              <div
                style={{
                  width: 1,
                  background: "var(--hairline)",
                  alignSelf: "stretch",
                }}
              />
              <div>
                <div
                  className="gt-mono"
                  style={{ fontSize: 9, marginBottom: 5 }}
                >
                  HIGH-DRIFT TOPICS
                </div>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 18,
                    color: "var(--signal)",
                  }}
                >
                  {highDriftTopics}
                </span>
              </div>
              <div style={{ flex: 1 }} />
            </div>

            {/* Topic list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topics.map((t, i) => {
                const sparkData = Array.from({ length: t.run_count }, () => 1);
                return (
                  <div
                    key={t.slug}
                    className="gt-card gt-card-hover"
                    style={{
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 20,
                      cursor: "pointer",
                    }}
                    onClick={() => handleTopicClick(t.slug)}
                  >
                    <div
                      style={{
                        width: 28,
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                        color: "var(--ink-3)",
                        flexShrink: 0,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontFamily: "var(--serif)",
                          fontSize: 20,
                          color: "var(--ink-0)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {t.topic}
                      </div>
                      <div
                        className="gt-meta"
                        style={{ fontSize: 11, marginTop: 3 }}
                      >
                        {t.run_count} {t.run_count === 1 ? "run" : "runs"} ·
                        last {timeAgo(t.last_run)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexShrink: 0,
                      }}
                    >
                      <span className="gt-mono" style={{ fontSize: 9 }}>
                        DRIFT
                      </span>
                      <GTSparkline runs={sparkData} />
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 14,
                        color: "var(--ink-3)",
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Empty-state ghost card */}
            <div
              style={{
                marginTop: 14,
                padding: "18px 20px",
                border: "1px dashed var(--hairline-strong)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 20,
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: 28,
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color: "var(--ink-4)",
                }}
              >
                {String(topics.length + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  fontFamily: "var(--serif)",
                  fontSize: 18,
                  color: "var(--ink-3)",
                  fontStyle: "italic",
                }}
              >
                + Run a topic to start tracking
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DETAIL VIEW ── */}
      {!loading && !error && view === "detail" && history && (
        <div style={{ display: "flex", height: "calc(100vh - 49px)" }}>
          {/* Left sidebar */}
          <div
            style={{
              width: 220,
              borderRight: "1px solid var(--hairline)",
              padding: "24px 18px",
              flexShrink: 0,
              overflowY: "auto",
            }}
          >
            <button
              className="gt-crumb gt-crumb-link"
              onClick={handleBackToList}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                marginBottom: 20,
                display: "block",
              }}
            >
              ← All Topics
            </button>

            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                color: "var(--ink-0)",
                lineHeight: 1.3,
                marginBottom: 24,
              }}
            >
              {currentTopic}
            </div>

            {/* Jump to bloc */}
            <div className="gt-mono" style={{ marginBottom: 10, fontSize: 9 }}>
              JUMP TO BLOC
            </div>
            {getRegionsForRuns().map((region) => {
              const bloc = blocFromRegion(region);
              return (
                <div
                  key={region}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 8px",
                    borderRadius: 3,
                    marginBottom: 2,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: bloc ? bloc.color : "var(--ink-4)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "var(--sans)",
                      fontSize: 12,
                      color: "var(--ink-2)",
                    }}
                  >
                    {bloc ? bloc.name : region}
                  </span>
                </div>
              );
            })}

            {/* Runs */}
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: "1px solid var(--hairline)",
              }}
            >
              <div
                className="gt-mono"
                style={{ marginBottom: 10, fontSize: 9 }}
              >
                RUNS
              </div>
              {history.map((run, idx) => (
                <div
                  key={run.id}
                  onClick={() => setRunA(idx)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 3,
                    marginBottom: 4,
                    fontFamily: "var(--mono)",
                    fontSize: 10,
                    cursor: "pointer",
                    background:
                      runA === idx ? "var(--signal-glow)" : "transparent",
                    border: `1px solid ${runA === idx ? "var(--signal-dim)" : "transparent"}`,
                    color: runA === idx ? "var(--ink-0)" : "var(--ink-3)",
                  }}
                >
                  Run {String(idx + 1).padStart(2, "0")} ·{" "}
                  {formatDate(run.created_at)}
                </div>
              ))}
              {isSingleRun && (
                <div
                  style={{
                    marginTop: 12,
                    fontSize: 11,
                    color: "var(--ink-3)",
                    fontStyle: "italic",
                    fontFamily: "var(--sans)",
                  }}
                >
                  Run again to see drift →
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div
            className="gt-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}
          >
            {/* ── SINGLE RUN MODE ── */}
            {isSingleRun && (
              <>
                <div className="gt-mono" style={{ marginBottom: 10 }}>
                  RUN 01 · {formatDate(history[0].created_at).toUpperCase()}
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 36,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-0)",
                    marginBottom: 24,
                  }}
                >
                  {currentTopic}
                </div>

                {/* Single-run callout */}
                <div
                  style={{
                    padding: "16px 20px",
                    background: "var(--bg-2)",
                    border: "1px dashed var(--hairline-strong)",
                    borderRadius: 5,
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <GTMark size={20} color="var(--amber)" />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 16,
                        color: "var(--ink-0)",
                        fontStyle: "italic",
                      }}
                    >
                      This is the only run so far.
                    </div>
                    <div className="gt-meta" style={{ fontSize: 11.5 }}>
                      Re-run this topic to see how each bloc&apos;s framing has
                      drifted.
                    </div>
                  </div>
                  <button
                    className="gt-btn gt-btn-primary"
                    style={{ fontSize: 11, padding: "7px 14px" }}
                    onClick={() =>
                      navigate("/?topic=" + encodeURIComponent(currentTopic))
                    }
                  >
                    ↻ Re-run analysis
                  </button>
                </div>

                {getRegionsForRuns().map((region) => (
                  <BlocDetailCard
                    key={region}
                    snapshot={getSnapForRegion(0, region)}
                  />
                ))}
              </>
            )}

            {/* ── COMPARE MODE ── */}
            {!isSingleRun && (
              <>
                <div className="gt-mono" style={{ marginBottom: 10 }}>
                  COMPARE RUNS · DRIFT ANALYSIS
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 36,
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    color: "var(--ink-0)",
                    marginBottom: 24,
                  }}
                >
                  {currentTopic}
                </div>

                {/* Run A/B selector */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 18,
                    marginBottom: 28,
                  }}
                >
                  <div>
                    <div className="gt-mono" style={{ marginBottom: 8 }}>
                      RUN A · BASELINE
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {history.map((run, idx) => (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => setRunA(idx)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 3,
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            cursor: "pointer",
                            background:
                              runA === idx
                                ? "var(--signal-glow)"
                                : "transparent",
                            border: `1px solid ${runA === idx ? "var(--signal)" : "var(--hairline)"}`,
                            color:
                              runA === idx ? "var(--ink-0)" : "var(--ink-3)",
                          }}
                        >
                          Run {String(idx + 1).padStart(2, "0")} ·{" "}
                          {formatDate(run.created_at)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="gt-mono" style={{ marginBottom: 8 }}>
                      RUN B · COMPARE
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {history.map((run, idx) => (
                        <button
                          key={run.id}
                          type="button"
                          onClick={() => setRunB(idx)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 3,
                            fontFamily: "var(--mono)",
                            fontSize: 10,
                            cursor: "pointer",
                            background:
                              runB === idx
                                ? "rgba(212,162,74,0.1)"
                                : "transparent",
                            border: `1px solid ${runB === idx ? "var(--amber)" : "var(--hairline)"}`,
                            color:
                              runB === idx ? "var(--ink-0)" : "var(--ink-3)",
                          }}
                        >
                          Run {String(idx + 1).padStart(2, "0")} ·{" "}
                          {formatDate(run.created_at)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Drift summary banner */}
                <div
                  style={{
                    padding: "20px 24px",
                    borderRadius: 6,
                    marginBottom: 22,
                    background: "var(--bg-2)",
                    border: "1px solid var(--hairline-strong)",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                  }}
                >
                  <div>
                    <div
                      className="gt-mono"
                      style={{ fontSize: 9, marginBottom: 6 }}
                    >
                      COMPARE RUNS
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--serif)",
                        fontSize: 20,
                        color: "var(--ink-0)",
                      }}
                    >
                      Narrative drift analysis
                    </div>
                  </div>
                  <div style={{ flex: 1 }} />
                  {overallDrift !== null && (
                    <GTDots
                      value={overallDrift}
                      max={5}
                      tone="drift"
                      label="Overall"
                    />
                  )}
                </div>

                {/* Per-bloc compare cards */}
                {runB !== null &&
                  getRegionsForRuns().map((region) => (
                    <CompareBlocCard
                      key={region}
                      region={region}
                      snapA={getSnapForRegion(runA, region)}
                      snapB={getSnapForRegion(runB, region)}
                      dateA={formatDate(history[runA]?.created_at)}
                      dateB={formatDate(history[runB]?.created_at)}
                    />
                  ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
