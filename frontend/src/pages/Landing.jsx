import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GTHeader, GTHeroWordmark, GTDots } from "../components/primitives";

const SAMPLE_HEADLINES = [
  "Scientists Discover Coffee Drinkers Live 10 Years Longer on Average",
  "New Study Shows Social Media Use Has No Effect on Teen Mental Health",
  "Government Confirms UFO Sightings Are Actually Weather Balloons",
  "Economists Agree: Raising Minimum Wage Always Increases Unemployment",
  "Study Finds People Only Use 10% of Their Brain Capacity",
  "Drinking 8 Glasses of Water Daily Proven to Cure Most Illnesses",
  "Vaccines Shown to Alter Human DNA in Landmark Study",
];

const SAMPLE_TOPICS = [
  "Ukraine war",
  "Taiwan strait",
  "Iran nuclear deal",
  "Sudan civil war",
];

function BlocOrbit() {
  const colors = ["cn", "ru", "me", "eu", "ws", "us", "in", "gs"];
  return (
    <svg width="80" height="56" viewBox="0 0 80 56">
      <circle
        cx="40"
        cy="28"
        r="20"
        fill="none"
        stroke="var(--hairline-strong)"
        strokeWidth="0.5"
        strokeDasharray="2 3"
      />
      {colors.map((c, i) => {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const x = 40 + Math.cos(a) * 20;
        const y = 28 + Math.sin(a) * 20;
        return (
          <circle key={c} cx={x} cy={y} r="2.5" fill={`var(--bloc-${c})`} />
        );
      })}
      <circle cx="40" cy="28" r="3" fill="var(--signal)" />
    </svg>
  );
}

function BiasMeter() {
  return (
    <svg width="100" height="50" viewBox="0 0 100 50">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={6 + i * 14}
          y={42 - (i + 1) * 5}
          width="10"
          height={(i + 1) * 5}
          fill={
            i < 4
              ? "var(--phosphor-dim)"
              : i < 6
                ? "var(--amber-dim)"
                : "var(--signal)"
          }
        />
      ))}
      <line
        x1="0"
        y1="42"
        x2="100"
        y2="42"
        stroke="var(--hairline-strong)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function PropMap() {
  const cells = Array.from({ length: 18 }, (_, i) => i);
  const lit = new Set([2, 5, 7, 10, 11, 14]);
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "repeat(9, 8px)", gap: 2 }}
    >
      {cells.map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 1,
            background: lit.has(i) ? "var(--signal)" : "var(--bg-3)",
          }}
        />
      ))}
    </div>
  );
}

function QuizGrid() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 4, width: 90 }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 7,
            borderRadius: 1,
            background: "var(--bg-3)",
            borderLeft: `2px solid ${
              i === 0
                ? "var(--phosphor)"
                : i === 1
                  ? "var(--signal)"
                  : "var(--ink-4)"
            }`,
          }}
        />
      ))}
      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
        <GTDots value={3} max={5} tone="amber" size={5} gap={3} />
      </div>
    </div>
  );
}

function FeatureCard({ label, title, body, visual }) {
  return (
    <div
      className="gt-card gt-card-hover"
      style={{ padding: 18, display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-1)",
          borderRadius: 4,
          border: "1px solid var(--hairline)",
        }}
      >
        {visual}
      </div>
      <div
        className="gt-mono"
        style={{ color: "var(--signal)", fontSize: 9.5 }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 18,
          color: "var(--ink-0)",
          lineHeight: 1.15,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>
      <div
        className="gt-body"
        style={{ fontSize: 12.5, color: "var(--ink-2)" }}
      >
        {body}
      </div>
    </div>
  );
}

const FEATURE_CARDS = [
  {
    label: "01 · GLOBAL PERSPECTIVES",
    title: "Eight power blocs.",
    body: "Aggregates coverage from Chinese state media, Al Jazeera, BBC, RT, Reuters, and US mainstream for every topic.",
    visual: <BlocOrbit />,
  },
  {
    label: "02 · BIAS DETECTION",
    title: "Scored & quoted.",
    body: "Scores each source on a bias scale and flags loaded language, selective omission, and hero/villain framing with quoted examples.",
    visual: <BiasMeter />,
  },
  {
    label: "03 · PROPAGANDA MAPPING",
    title: "Techniques mapped.",
    body: "Identifies whataboutism, appeal to fear, false equivalence with textual evidence from each outlet.",
    visual: <PropMap />,
  },
  {
    label: "04 · KNOWLEDGE QUIZZES",
    title: "Learn by doing.",
    body: "Test your understanding of geopolitical topics with AI-generated quizzes. From the Taiwan Strait to the Iran nuclear deal.",
    visual: <QuizGrid />,
  },
];

export default function Landing() {
  const [topic, setTopic] = useState("");
  const [nudgeRating, setNudgeRating] = useState(null);
  const [headline] = useState(
    () => SAMPLE_HEADLINES[Math.floor(Math.random() * SAMPLE_HEADLINES.length)],
  );
  const [profile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("gt_user_profile"));
    } catch {
      return null;
    }
  });
  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || nudgeRating === null) return;
    navigate("/analyze?topic=" + encodeURIComponent(trimmed));
  }

  const navRight = (
    <div style={{ display: "flex", gap: 22 }}>
      {[
        { label: "Learn", path: "/learn" },
        { label: "Tracker", path: "/tracker" },
        { label: "History", path: "/reports" },
      ].map(({ label, path }) => (
        <span
          key={label}
          className="gt-crumb gt-crumb-link"
          style={{ fontSize: 11 }}
          onClick={() => navigate(path)}
        >
          {label}
        </span>
      ))}
    </div>
  );

  return (
    <div className="gt-root gt-texture gt-scroll">
      <GTHeader nav={false} right={navRight} />

      <div
        style={{ maxWidth: 920, margin: "0 auto", padding: "64px 32px 48px" }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div className="gt-mono" style={{ marginBottom: 24 }}>
            AI · POWERED · MEDIA · ANALYSIS
          </div>
          <GTHeroWordmark />
          <p
            style={{
              fontFamily: "var(--serif)",
              fontSize: 22,
              lineHeight: 1.35,
              color: "var(--ink-1)",
              marginTop: 28,
              fontWeight: 300,
              maxWidth: 580,
              marginLeft: "auto",
              marginRight: "auto",
              letterSpacing: "-0.01em",
            }}
          >
            See every perspective. Detect every bias.
            <br />
            <span style={{ color: "var(--ink-2)", fontStyle: "italic" }}>
              Understand why different powers frame stories the way they do.
            </span>
          </p>
        </div>

        {/* Centered column for nudge + input */}
        <div style={{ maxWidth: 728, margin: "0 auto" }}>
          {/* Accuracy nudge card */}
          <div
            className="gt-card"
            style={{
              background: "var(--bg-2)",
              borderColor: "var(--hairline-strong)",
              padding: "24px 28px",
              marginBottom: 32,
              borderLeft: "2px solid var(--signal-dim)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
              }}
            >
              <span className="gt-mono">
                BEFORE YOU ANALYZE — A QUICK CHECK
              </span>
              <span className="gt-mono" style={{ fontSize: 9 }}>
                RESEARCH-BACKED · 2024
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 18,
                fontStyle: "italic",
                color: "var(--ink-0)",
                marginBottom: 18,
                lineHeight: 1.35,
              }}
            >
              "{headline}"
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <span className="gt-meta" style={{ fontSize: 11 }}>
                Rate this headline:
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="gt-btn"
                    onClick={() => setNudgeRating(n)}
                    style={{
                      width: 30,
                      height: 30,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 4,
                      background:
                        nudgeRating === n ? "var(--signal)" : "var(--bg-3)",
                      border:
                        "1px solid " +
                        (nudgeRating === n
                          ? "var(--signal)"
                          : "var(--hairline-strong)"),
                      color: nudgeRating === n ? "#fff" : "var(--ink-2)",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  flex: 1,
                }}
                className="gt-mono"
              >
                <span style={{ fontSize: 10 }}>Not accurate</span>
                <span style={{ fontSize: 10 }}>Very accurate</span>
              </div>
            </div>

            {nudgeRating !== null && (
              <p
                style={{
                  fontSize: 11,
                  fontStyle: "italic",
                  marginTop: 12,
                  color: "var(--ink-3)",
                  fontFamily: "var(--sans)",
                }}
              >
                Good — you're now primed to read critically.
              </p>
            )}
          </div>

          {/* Topic input row */}
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: 10, marginBottom: 12 }}
          >
            <input
              type="text"
              className="gt-input"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter a news topic to analyze…"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              disabled={!topic.trim() || nudgeRating === null}
              className={`gt-btn ${nudgeRating !== null ? "gt-btn-primary" : "gt-btn-ghost"}`}
              style={{
                whiteSpace: "nowrap",
                opacity: nudgeRating === null ? 0.6 : 1,
              }}
            >
              {nudgeRating === null ? "Rate headline first" : "Analyze →"}
            </button>
          </form>

          {/* Sample topic pills */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
            }}
          >
            <span className="gt-mono" style={{ fontSize: 10 }}>
              TRY:
            </span>
            {SAMPLE_TOPICS.map((s) => (
              <span
                key={s}
                onClick={() => setTopic(s)}
                style={{
                  padding: "4px 10px",
                  border: "1px solid var(--hairline)",
                  borderRadius: 3,
                  fontSize: 11,
                  color: "var(--ink-2)",
                  cursor: "pointer",
                  fontFamily: "var(--mono)",
                }}
              >
                {s}
              </span>
            ))}
          </div>

          {/* Quiz nudge / profile badge */}
          {profile ? (
            <div className="gt-mono" style={{ fontSize: 10, marginTop: 14 }}>
              <span style={{ color: "var(--phosphor)" }}>✓ Profile set</span>
              {" · "}
              <span
                style={{ color: "var(--ink-2)", cursor: "pointer" }}
                onClick={() => navigate("/quiz")}
              >
                retake →
              </span>
            </div>
          ) : (
            <div className="gt-meta" style={{ fontSize: 11, marginTop: 14 }}>
              Personalize results →{" "}
              <span
                style={{
                  color: "var(--ink-1)",
                  borderBottom: "1px solid var(--ink-3)",
                  cursor: "pointer",
                }}
                onClick={() => navigate("/quiz")}
              >
                Take the 1-min profile quiz
              </span>
            </div>
          )}
        </div>

        {/* Feature cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginTop: 56,
          }}
        >
          {FEATURE_CARDS.map((card) => (
            <FeatureCard key={card.label} {...card} />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 80,
            paddingTop: 24,
            borderTop: "1px solid var(--hairline)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span className="gt-mono">v0.4.0 · BETA</span>
          <span className="gt-mono">A 10-AGENT INTELLIGENCE PIPELINE</span>
        </div>
      </div>
    </div>
  );
}
