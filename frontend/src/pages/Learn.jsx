import { useState } from "react";
import { useNavigate } from "react-router-dom";
import QuizRunner from "../components/QuizRunner";
import { GTHeader, GTDots, BLOCS } from "../components/primitives";

const CURATED_TOPICS = [
  { label: "Taiwan Strait", code: "CN", diff: 4 },
  { label: "Ukraine War", code: "RU", diff: 5 },
  { label: "Gaza Conflict", code: "ME", diff: 5 },
  { label: "South China Sea", code: "CN", diff: 3 },
  { label: "Iran Nuclear Deal", code: "ME", diff: 4 },
  { label: "NATO Expansion", code: "EU", diff: 3 },
  { label: "India-Pakistan Tensions", code: "IN", diff: 4 },
  { label: "Sudan Civil War", code: "GS", diff: 3 },
  { label: "US-China Trade War", code: "CN", diff: 4 },
  { label: "Syria Conflict", code: "ME", diff: 4 },
  { label: "Venezuela Crisis", code: "GS", diff: 2 },
  { label: "North Korea Nukes", code: "CN", diff: 4 },
];

export default function Learn() {
  const navigate = useNavigate();
  const [customInput, setCustomInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function triggerQuiz(topic) {
    setSelectedTopic(topic);
    setLoading(true);
    setQuiz(null);
    setError(null);
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/learn/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      },
    )
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }

  function handleCustomSubmit(e) {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    triggerQuiz(trimmed);
  }

  const header = (
    <GTHeader
      crumbs={[{ label: "learn", link: true }]}
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

  if (loading) {
    return (
      <div
        className="gt-root gt-texture gt-scroll"
        style={{ minHeight: "100vh" }}
      >
        {header}
        <div style={{ padding: "80px 0", textAlign: "center" }}>
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
            GENERATING QUIZ
          </div>
          <div className="gt-meta" style={{ marginTop: 8 }}>
            {selectedTopic}
          </div>
        </div>
      </div>
    );
  }

  if (quiz) {
    return (
      <div
        className="gt-root gt-texture gt-scroll"
        style={{ minHeight: "100vh" }}
      >
        {header}
        <div style={{ maxWidth: 740, margin: "0 auto", padding: "40px 36px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 3,
                background: "var(--bg-3)",
                border: "1px solid var(--hairline)",
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-2)",
              }}
            >
              GENERAL KNOWLEDGE
            </span>
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 3,
                background: "var(--bg-3)",
                border: "1px solid var(--hairline)",
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--ink-2)",
              }}
            >
              {selectedTopic.toUpperCase()}
            </span>
          </div>
          <QuizRunner
            quiz={quiz}
            onReset={() => {
              setQuiz(null);
              setSelectedTopic(null);
              setCustomInput("");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="gt-root gt-texture gt-scroll"
      style={{ minHeight: "100vh" }}
    >
      {header}

      <div
        style={{ maxWidth: 980, margin: "0 auto", padding: "40px 36px 60px" }}
      >
        <div className="gt-mono" style={{ marginBottom: 14 }}>
          KNOWLEDGE QUIZZES · {CURATED_TOPICS.length} CURATED · CUSTOM TOPIC
          AVAILABLE
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 52,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: "var(--ink-0)",
            marginBottom: 14,
          }}
        >
          Test your <span style={{ fontStyle: "italic" }}>understanding.</span>
        </div>
        <div
          className="gt-body"
          style={{ color: "var(--ink-2)", maxWidth: 540, marginBottom: 32 }}
        >
          AI-generated quizzes on geopolitical topics. Pick a topic or enter
          your own.
        </div>

        {/* Custom input */}
        <form onSubmit={handleCustomSubmit}>
          <div style={{ display: "flex", gap: 10, marginBottom: 36 }}>
            <input
              className="gt-input"
              placeholder="Enter any topic…"
              style={{ flex: 1 }}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
            />
            <button
              type="submit"
              className="gt-btn gt-btn-primary"
              disabled={!customInput.trim()}
            >
              Start quiz →
            </button>
          </div>
        </form>

        {error && (
          <div
            className="gt-meta"
            style={{ color: "var(--signal)", marginBottom: 20 }}
          >
            {error}
          </div>
        )}

        <div className="gt-mono" style={{ marginBottom: 14 }}>
          CURATED · {CURATED_TOPICS.length} TOPICS
        </div>

        {/* Topic grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {CURATED_TOPICS.map((topic) => {
            const b = BLOCS[topic.code];
            return (
              <div
                key={topic.label}
                className="gt-card gt-card-hover"
                style={{
                  padding: 18,
                  position: "relative",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => triggerQuiz(topic.label)}
              >
                {/* Subtle color circle */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: 60,
                    height: 60,
                    opacity: 0.06,
                    background: b.color,
                    borderRadius: "50%",
                    transform: "translate(20px, -20px)",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: b.color,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--mono)",
                        fontSize: 9.5,
                        color: "var(--ink-3)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {b.code} · {b.name.toUpperCase()}
                    </span>
                  </div>
                  <GTDots
                    value={topic.diff}
                    max={5}
                    tone="amber"
                    size={4}
                    gap={3}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "var(--serif)",
                    fontSize: 22,
                    color: "var(--ink-0)",
                    letterSpacing: "-0.015em",
                    marginBottom: 4,
                  }}
                >
                  {topic.label}
                </div>
                <div className="gt-meta" style={{ fontSize: 11 }}>
                  6 questions · ~3 min
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
