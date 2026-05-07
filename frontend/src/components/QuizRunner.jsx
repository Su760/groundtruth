import { useState } from "react";
import { useNavigate } from "react-router-dom";

function getScoreMessage(score, total) {
  const ratio = score / total;
  if (ratio === 1) return "Perfect — you know this topic cold.";
  if (ratio >= 0.66) return "Strong — a few gaps, but solid understanding.";
  if (ratio >= 0.33)
    return "Getting there — consider running a GroundTruth analysis.";
  return "Good starting point — GroundTruth can fill in the gaps.";
}

export default function QuizRunner({ quiz, onReset }) {
  const navigate = useNavigate();
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  const question = quiz.questions[currentQ];
  const isLast = currentQ === total - 1;

  function handleSelect(idx) {
    if (revealed) return;
    setSelected(idx);
  }

  function handleReveal() {
    if (selected === null) return;
    setRevealed(true);
    if (selected === question.correct_index) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (isLast) {
      setFinished(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  if (finished) {
    const scoreMessage = getScoreMessage(score, total);
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <div className="gt-mono" style={{ marginBottom: 16 }}>
          QUIZ COMPLETE
        </div>

        <div
          style={{
            fontFamily: "var(--mono)",
            fontSize: 64,
            lineHeight: 1,
            color: "var(--ink-0)",
            marginBottom: 8,
          }}
        >
          {score}
          <span style={{ color: "var(--ink-3)", fontSize: 32 }}>/{total}</span>
        </div>

        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 20,
            color: "var(--ink-1)",
            fontStyle: "italic",
            marginBottom: 32,
          }}
        >
          {scoreMessage}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button className="gt-btn gt-btn-ghost" onClick={onReset}>
            Try another topic
          </button>
          <button
            className="gt-btn gt-btn-primary"
            onClick={() =>
              navigate("/analyze?topic=" + encodeURIComponent(quiz.topic))
            }
          >
            Analyze {quiz.topic} →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Progress line */}
      <div style={{ marginBottom: 20 }}>
        <div className="gt-mono" style={{ fontSize: 10, marginBottom: 8 }}>
          QUESTION {currentQ + 1} / {total}
        </div>
        <div style={{ height: 2, background: "var(--bg-3)", borderRadius: 1 }}>
          <div
            style={{
              height: "100%",
              borderRadius: 1,
              width: ((currentQ + 1) / total) * 100 + "%",
              background: "var(--amber)",
              transition: "width 0.3s var(--ease-out)",
            }}
          />
        </div>
      </div>

      {/* Source badge */}
      {quiz.source && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {quiz.source === "report" && (
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 3,
                background: "rgba(212,162,74,0.08)",
                border: "1px solid var(--amber-dim)",
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--amber)",
              }}
            >
              BASED ON YOUR REPORT
            </span>
          )}
          {quiz.source === "general" && (
            <span
              style={{
                padding: "3px 8px",
                borderRadius: 3,
                background: "rgba(107,138,168,0.08)",
                border: "1px solid var(--steel)",
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--steel)",
              }}
            >
              GENERAL KNOWLEDGE
            </span>
          )}
        </div>
      )}

      {/* Question text */}
      <div
        style={{
          fontFamily: "var(--serif)",
          fontSize: 26,
          lineHeight: 1.25,
          letterSpacing: "-0.015em",
          color: "var(--ink-0)",
          marginBottom: 28,
        }}
      >
        {question.question}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {question.options.map((option, idx) => {
          let optionStyle;
          if (!revealed) {
            optionStyle = {
              padding: "13px 18px",
              borderRadius: 5,
              cursor: "pointer",
              background: selected === idx ? "var(--bg-3)" : "var(--bg-2)",
              border:
                "1px solid " +
                (selected === idx
                  ? "var(--hairline-strong)"
                  : "var(--hairline)"),
              display: "flex",
              alignItems: "center",
              gap: 14,
              transition: "all 0.15s var(--ease-out)",
            };
          } else if (idx === question.correct_index) {
            optionStyle = {
              padding: "13px 18px",
              borderRadius: 5,
              cursor: "default",
              background: "#0a1a0a",
              border: "1px solid var(--phosphor)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            };
          } else if (idx === selected) {
            optionStyle = {
              padding: "13px 18px",
              borderRadius: 5,
              cursor: "default",
              background: "#1a0a0a",
              border: "1px solid var(--signal)",
              display: "flex",
              alignItems: "center",
              gap: 14,
            };
          } else {
            optionStyle = {
              padding: "13px 18px",
              borderRadius: 5,
              cursor: "default",
              background: "var(--bg-2)",
              border: "1px solid var(--hairline)",
              display: "flex",
              alignItems: "center",
              gap: 14,
              opacity: 0.45,
              pointerEvents: "none",
            };
          }

          return (
            <div
              key={idx}
              onClick={() => handleSelect(idx)}
              style={optionStyle}
            >
              <span
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: 11,
                  color:
                    !revealed && selected === idx
                      ? "var(--ink-1)"
                      : "var(--ink-3)",
                  minWidth: 16,
                }}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color:
                    !revealed && selected === idx
                      ? "var(--ink-0)"
                      : "var(--ink-1)",
                }}
              >
                {option}
              </span>
            </div>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 18px",
            background: "var(--bg-2)",
            border: "1px solid var(--hairline)",
            borderRadius: 5,
          }}
        >
          <div className="gt-mono" style={{ marginBottom: 6, fontSize: 9 }}>
            EXPLANATION
          </div>
          <div
            className="gt-body"
            style={{ fontStyle: "italic", color: "var(--ink-1)" }}
          >
            {question.explanation}
          </div>
        </div>
      )}

      {/* Submit / Next button */}
      {!revealed ? (
        <button
          className="gt-btn gt-btn-primary"
          onClick={handleReveal}
          style={{ marginTop: 20 }}
          disabled={selected === null}
        >
          Submit answer →
        </button>
      ) : (
        <button
          className="gt-btn gt-btn-ghost"
          onClick={handleNext}
          style={{ marginTop: 20 }}
        >
          {isLast ? "See results →" : "Next question →"}
        </button>
      )}
    </div>
  );
}
