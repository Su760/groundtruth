import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import QuizRunner from "../components/QuizRunner";
import { GTHeader, GTDots, GTAgentRow, GTMark } from "../components/primitives";

function topicToSlug(topic) {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const AGENT_ORDER = [
  { key: "planner", label: "Planner" },
  { key: "researcher", label: "Researcher" },
  { key: "context_historian", label: "Context Historian" },
  { key: "translation_layer", label: "Translation Layer" },
  { key: "bias_detector", label: "Bias Detector" },
  { key: "perspective_analyst", label: "Perspective" },
  { key: "propaganda_mapper", label: "Propaganda" },
  { key: "fact_checker", label: "Fact-check" },
  { key: "synthesizer", label: "Synthesizer" },
];

const AGENT_LABELS = AGENT_ORDER.map((a) => a.label);

function parseConfidenceScore(reportText) {
  if (!reportText) return null;
  const match = reportText.match(/Confidence Score[:\s]+([0-9.]+)/i);
  return match ? parseFloat(match[1]) : null;
}

const mdComponents = {
  h2: ({ children }) => (
    <div
      style={{
        marginTop: 40,
        marginBottom: 20,
        paddingTop: 28,
        borderTop: "1px solid var(--hairline)",
      }}
    >
      <div
        className="gt-mono"
        style={{ color: "var(--signal)", marginBottom: 8 }}
      >
        {String(children).toUpperCase()}
      </div>
    </div>
  ),
  h3: ({ children }) => (
    <div
      style={{
        fontFamily: "var(--sans)",
        fontSize: 13,
        fontWeight: 600,
        color: "var(--ink-2)",
        marginTop: 24,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  ),
  p: ({ children }) => (
    <p className="gt-body" style={{ marginBottom: 16 }}>
      {children}
    </p>
  ),
  strong: ({ children }) => <span className="gt-highlight">{children}</span>,
  ul: ({ children }) => (
    <ul style={{ paddingLeft: 20, marginBottom: 16 }}>{children}</ul>
  ),
  li: ({ children }) => (
    <li className="gt-body" style={{ marginBottom: 6 }}>
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <div style={{ display: "flex", gap: 16, margin: "20px 0" }}>
      <div
        style={{
          width: 3,
          background: "var(--signal)",
          opacity: 0.6,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 20,
          lineHeight: 1.3,
          fontStyle: "italic",
          color: "var(--ink-0)",
          fontWeight: 300,
        }}
      >
        {children}
      </div>
    </div>
  ),
};

export default function Analyze() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const topic = searchParams.get("topic") || "";

  const profile = (() => {
    try {
      return JSON.parse(localStorage.getItem("gt_user_profile"));
    } catch {
      return null;
    }
  })();

  const [agentStatuses, setAgentStatuses] = useState(() =>
    Object.fromEntries(AGENT_ORDER.map((a) => [a.key, "pending"])),
  );
  const [activeAgent, setActiveAgent] = useState(AGENT_ORDER[0].key);
  const [report, setReport] = useState(null);
  const [missingRegions, setMissingRegions] = useState([]);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState(null);
  const [runCount, setRunCount] = useState(0);
  const [sources, setSources] = useState([]);

  function handleGenerateQuiz() {
    setQuizLoading(true);
    setQuizError(null);
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/learn/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, report_content: report }),
      },
    )
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data);
        setQuizLoading(false);
      })
      .catch((e) => {
        setQuizError(e.message);
        setQuizLoading(false);
      });
  }

  useEffect(() => {
    if (!topic) {
      navigate("/");
      return;
    }

    const controller = new AbortController();

    async function startAnalysis() {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/analyze`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic, profile }),
            signal: controller.signal,
          },
        );

        if (!res.ok) {
          const text = await res.text();
          setError(`Server error ${res.status}: ${text}`);
          setIsRunning(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop();

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6).trim());
              if (evt.type === "progress") {
                setAgentStatuses((prev) => ({ ...prev, [evt.agent]: "done" }));
                const idx = AGENT_ORDER.findIndex((a) => a.key === evt.agent);
                const next = AGENT_ORDER[idx + 1];
                setActiveAgent(next ? next.key : null);
              } else if (evt.type === "coverage") {
                setMissingRegions(evt.missing_regions || []);
              } else if (evt.type === "done") {
                setReport(evt.report);
                setActiveAgent(null);
                setIsRunning(false);
                fetch(
                  `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/tracker/${topicToSlug(topic)}/count`,
                )
                  .then((r) => r.json())
                  .then((data) => setRunCount(data.count))
                  .catch(() => {});
              } else if (evt.type === "sources") {
                setSources(evt.data);
              } else if (evt.type === "error") {
                setError(evt.message);
                setActiveAgent(null);
                setIsRunning(false);
              }
            } catch {
              // ignore malformed SSE lines
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setIsRunning(false);
        }
      }
    }

    startAnalysis();
    return () => controller.abort();
  }, [topic, navigate]);

  const completedCount = Object.values(agentStatuses).filter(
    (s) => s === "done",
  ).length;

  const activeIdx = isRunning ? completedCount : AGENT_LABELS.length;

  const parsedScore = parseConfidenceScore(report);

  const reportDate = new Date()
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  const crumbs =
    report && !isRunning
      ? [{ label: "analyze", link: true }, { label: topic.toLowerCase() }]
      : [{ label: "analyze" }];

  return (
    <div
      className="gt-root gt-texture gt-scroll"
      style={{ minHeight: "100vh" }}
    >
      <GTHeader crumbs={crumbs} />

      <div
        style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 36px 80px" }}
      >
        {/* Error state */}
        {error && (
          <div
            style={{
              background: "#1a0a0a",
              border: "1px solid #3f1515",
              borderRadius: 6,
              padding: "16px 20px",
              marginBottom: 28,
            }}
          >
            <div
              className="gt-mono"
              style={{ color: "var(--signal)", marginBottom: 6 }}
            >
              ANALYSIS FAILED
            </div>
            <div className="gt-body" style={{ color: "var(--ink-2)" }}>
              {error}
            </div>
            <button
              className="gt-btn gt-btn-ghost"
              onClick={() => navigate("/")}
              style={{ marginTop: 14, fontSize: 11, padding: "7px 12px" }}
            >
              ← Try another topic
            </button>
          </div>
        )}

        {/* Topic header — shown after done */}
        {report && !isRunning && (
          <div style={{ marginBottom: 28 }}>
            <div className="gt-mono" style={{ marginBottom: 12 }}>
              REPORT · {reportDate}
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 48,
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "var(--ink-0)",
                marginBottom: 20,
              }}
            >
              {topic}
            </div>
            {/* Metadata bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                padding: "14px 0",
                borderTop: "1px solid var(--hairline)",
                borderBottom: "1px solid var(--hairline)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  className="gt-mono"
                  style={{ fontSize: 9, marginBottom: 5 }}
                >
                  CONFIDENCE
                </div>
                <GTDots
                  value={parsedScore ? Math.round(parsedScore * 5) : 0}
                  max={5}
                  tone="phosphor"
                  label={
                    parsedScore
                      ? parsedScore >= 0.8
                        ? "High"
                        : parsedScore >= 0.6
                          ? "Moderate"
                          : "Low"
                      : "—"
                  }
                />
              </div>
              <div
                style={{ width: 1, height: 32, background: "var(--hairline)" }}
              />
              <div>
                <div
                  className="gt-mono"
                  style={{ fontSize: 9, marginBottom: 5 }}
                >
                  SOURCES
                </div>
                <span
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 14,
                    color: "var(--ink-0)",
                  }}
                >
                  {sources.length}
                </span>
              </div>
              {runCount >= 2 && (
                <>
                  <div
                    style={{
                      width: 1,
                      height: 32,
                      background: "var(--hairline)",
                    }}
                  />
                  <button
                    className="gt-btn gt-btn-ghost"
                    onClick={() => navigate("/tracker")}
                    style={{ fontSize: 11, padding: "7px 12px" }}
                  >
                    {runCount} runs — View narrative drift →
                  </button>
                </>
              )}
              {missingRegions.length > 0 && (
                <div
                  className="gt-mono"
                  style={{
                    color: "var(--amber)",
                    fontSize: 10,
                    padding: "6px 10px",
                    background: "rgba(212, 162, 74, 0.06)",
                    border: "1px solid var(--amber-dim)",
                    borderRadius: 3,
                  }}
                >
                  ⚠ No coverage: {missingRegions.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pipeline row — always shown */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <span className="gt-mono">
              {isRunning ? "PIPELINE — ANALYZING" : "PIPELINE — COMPLETE"}
            </span>
            {isRunning && (
              <span className="gt-mono" style={{ color: "var(--signal)" }}>
                ● LIVE
              </span>
            )}
          </div>
          <GTAgentRow agents={AGENT_LABELS} activeIdx={activeIdx} />
        </div>

        {/* Loading state */}
        {isRunning && !report && !error && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div
              className="gt-pulse"
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--signal)",
                margin: "0 auto 16px",
              }}
            />
            <div className="gt-mono" style={{ color: "var(--signal)" }}>
              ANALYZING
            </div>
            <div className="gt-meta" style={{ marginTop: 8 }}>
              Running {completedCount} of 9 agents…
            </div>
          </div>
        )}

        {/* Report content */}
        {report && !isRunning && (
          <div>
            {/* Confidence score bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
                padding: "12px 16px",
                background: "var(--bg-2)",
                border: "1px solid var(--hairline)",
                borderRadius: 4,
              }}
            >
              <span className="gt-mono">CONFIDENCE SCORE</span>
              <GTDots
                value={parsedScore ? Math.round(parsedScore * 5) : 0}
                max={5}
                tone="phosphor"
                label={
                  parsedScore
                    ? parsedScore >= 0.8
                      ? "High"
                      : parsedScore >= 0.6
                        ? "Moderate"
                        : "Low"
                    : undefined
                }
              />
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                  color: "var(--ink-2)",
                }}
              >
                {parsedScore ? (parsedScore * 100).toFixed(0) + "%" : "—"}
              </span>
            </div>

            {/* Report card */}
            <div
              className="gt-card"
              style={{ padding: "32px 40px", marginBottom: 24 }}
            >
              <ReactMarkdown components={mdComponents}>{report}</ReactMarkdown>
            </div>

            {/* Sources section */}
            {sources.length > 0 && (
              <div
                style={{
                  marginTop: 32,
                  paddingTop: 20,
                  borderTop: "1px solid var(--hairline)",
                }}
              >
                <div className="gt-mono" style={{ marginBottom: 14 }}>
                  SOURCES · {sources.length}
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {sources.map((s, i) => {
                    const agentColor =
                      s.agent === "Researcher"
                        ? "var(--signal)"
                        : "var(--amber)";
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            padding: "1px 6px",
                            borderRadius: 3,
                            background: "var(--bg-3)",
                            border: "1px solid var(--hairline)",
                            fontFamily: "var(--mono)",
                            fontSize: 9,
                            color: agentColor,
                            flexShrink: 0,
                          }}
                        >
                          {s.agent?.toUpperCase() || "SOURCE"}
                        </span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: 12,
                            color: "var(--ink-2)",
                            textDecoration: "none",
                            fontFamily: "var(--sans)",
                            lineHeight: 1.4,
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.color = "var(--ink-0)")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.color = "var(--ink-2)")
                          }
                        >
                          {s.title || s.url}
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quiz CTA */}
            <div
              style={{
                marginTop: 36,
                padding: "28px 32px",
                background: "var(--bg-2)",
                border: "1px solid var(--hairline-strong)",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 28,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 4,
                  background: "var(--bg-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid var(--signal-dim)",
                  flexShrink: 0,
                }}
              >
                <GTMark size={22} />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  className="gt-mono"
                  style={{ color: "var(--signal)", marginBottom: 6 }}
                >
                  TEST YOUR UNDERSTANDING
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 20,
                    color: "var(--ink-0)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Did you absorb how each bloc framed this story?
                </div>
                <div
                  className="gt-body"
                  style={{ color: "var(--ink-2)", marginTop: 4, fontSize: 13 }}
                >
                  6 questions · ~2 minutes · AI-generated from this report
                </div>
              </div>
              {!quiz && (
                <button
                  className="gt-btn gt-btn-primary"
                  onClick={handleGenerateQuiz}
                  disabled={quizLoading}
                >
                  {quizLoading ? "Generating…" : "Start quiz →"}
                </button>
              )}
            </div>

            {quizError && !quizLoading && (
              <div className="gt-meta" style={{ marginTop: 12 }}>
                Couldn't generate quiz.{" "}
                <span
                  style={{ color: "var(--ink-2)", cursor: "pointer" }}
                  onClick={handleGenerateQuiz}
                >
                  Try again
                </span>
              </div>
            )}

            {quiz && !quizLoading && (
              <div style={{ marginTop: 28 }}>
                <div className="gt-mono" style={{ marginBottom: 16 }}>
                  QUIZ
                </div>
                <QuizRunner
                  quiz={quiz}
                  onReset={() => {
                    setQuiz(null);
                    setQuizError(null);
                  }}
                />
              </div>
            )}

            {/* Analyze another topic */}
            <div style={{ marginTop: 28 }}>
              <button
                className="gt-btn gt-btn-ghost"
                onClick={() => navigate("/")}
              >
                ← Analyze another topic
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
