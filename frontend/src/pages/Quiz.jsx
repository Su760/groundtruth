import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GTWordmark } from "../components/primitives";

const QUESTIONS = [
  {
    id: 0,
    text: "What brings you to GroundTruth?",
    multi: false,
    options: [
      "I want to understand a specific news event",
      "I'm studying geopolitics or international relations",
      "I'm a journalist or researcher",
      "I'm just curious about the world",
    ],
  },
  {
    id: 1,
    text: "How would you rate your geopolitical knowledge?",
    multi: false,
    options: [
      "Beginner — I follow headlines but not deep background",
      "Intermediate — I follow international news regularly",
      "Advanced — I have professional or academic background",
    ],
  },
  {
    id: 2,
    text: "Which regions do you know least about?",
    multi: true,
    subtitle: "Select all that apply",
    options: [
      "China & East Asia",
      "Russia & Eastern Europe",
      "Middle East & North Africa",
      "India & South Asia",
      "Global South (Africa, Latin America)",
      "I'm fairly familiar with all regions",
    ],
  },
  {
    id: 3,
    text: "How much historical context do you want in your reports?",
    multi: false,
    options: [
      "Just what's happening now — keep it current",
      "Some background — help me understand why this matters",
      "Deep context — I want the full historical picture",
    ],
  },
  {
    id: 4,
    text: "What frustrates you most about mainstream news coverage?",
    multi: false,
    options: [
      "I can't tell what's true vs propaganda",
      "Stories lack historical context",
      "Only Western perspectives get coverage",
      "Headlines oversimplify complex issues",
    ],
  },
  {
    id: 5,
    text: "How do you prefer information presented?",
    multi: false,
    options: [
      "Plain language — explain it to me simply",
      "Analytical — give me the data and let me judge",
      "Comparative — show me how different sides see it",
      "Dense and detailed — don't simplify",
    ],
  },
  {
    id: 6,
    text: "When reading about a conflict, what do you most want to understand?",
    multi: false,
    options: [
      "Who's right and who's wrong",
      "Why each side believes what they believe",
      "The economic and political interests involved",
      "How the media is manipulating the story",
    ],
  },
  {
    id: 7,
    text: "Do you have personal ties to any region outside the US/West?",
    multi: false,
    options: [
      "Yes — East Asia or China",
      "Yes — Russia or Eastern Europe",
      "Yes — Middle East or North Africa",
      "Yes — South Asia or India",
      "Yes — Africa or Latin America",
      "No personal ties / prefer not to say",
    ],
  },
  {
    id: 8,
    text: "How long do you want GroundTruth reports to be?",
    multi: false,
    options: [
      "Concise — key points only",
      "Standard — thorough but readable",
      "Comprehensive — give me everything",
    ],
  },
  {
    id: 9,
    text: "What's the main thing you want GroundTruth to help you with?",
    multi: false,
    options: [
      "Cut through propaganda and find the truth",
      "Understand perspectives I've never been exposed to",
      "Challenge my own assumptions and biases",
      "Get research-quality analysis of current events",
    ],
  },
];

const REGION_MAP = {
  "China & East Asia": "China",
  "Russia & Eastern Europe": "Russia",
  "Middle East & North Africa": "Middle East",
  "India & South Asia": "India",
  "Global South (Africa, Latin America)": "Global South",
};

const TIE_MAP = {
  "Yes — East Asia or China": "China",
  "Yes — Russia or Eastern Europe": "Russia",
  "Yes — Middle East or North Africa": "Middle East",
  "Yes — South Asia or India": "India",
  "Yes — Africa or Latin America": "Global South",
};

function deriveProfile(answers) {
  const expertise_level =
    {
      "Beginner — I follow headlines but not deep background": "beginner",
      "Intermediate — I follow international news regularly": "intermediate",
      "Advanced — I have professional or academic background": "advanced",
    }[answers[1]] ?? "intermediate";

  const emphasized_blocs = (answers[2] || [])
    .filter((r) => REGION_MAP[r])
    .map((r) => REGION_MAP[r]);

  const tieBloc = TIE_MAP[answers[7]];
  if (tieBloc && !emphasized_blocs.includes(tieBloc))
    emphasized_blocs.push(tieBloc);

  const depth =
    {
      "Just what's happening now — keep it current": "shallow",
      "Some background — help me understand why this matters": "medium",
      "Deep context — I want the full historical picture": "deep",
    }[answers[3]] ?? "medium";

  const tone =
    {
      "Plain language — explain it to me simply": "explanatory",
      "Analytical — give me the data and let me judge": "analytical",
      "Comparative — show me how different sides see it": "comparative",
      "Dense and detailed — don't simplify": "analytical",
    }[answers[5]] ?? "comparative";

  const goal =
    {
      "Cut through propaganda and find the truth": "fact-check",
      "Understand perspectives I've never been exposed to": "understand",
      "Challenge my own assumptions and biases": "challenge-self",
      "Get research-quality analysis of current events": "research",
    }[answers[9]] ?? "understand";

  return {
    expertise_level,
    tone,
    depth,
    emphasized_blocs,
    goal,
    frustration: answers[4] || "",
  };
}

export default function Quiz() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multiSelected, setMultiSelected] = useState(new Set());
  const [building, setBuilding] = useState(false);
  const navigate = useNavigate();

  const total = QUESTIONS.length;
  const question = QUESTIONS[currentQ];
  const isMultiSelect = question.multi;
  const canContinue = isMultiSelect
    ? multiSelected.size > 0
    : answers[currentQ] !== undefined;

  function handleSingleSelect(value) {
    setAnswers({ ...answers, [currentQ]: value });
  }

  function handleMultiToggle(option) {
    const next = new Set(multiSelected);
    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }
    setMultiSelected(next);
  }

  function handleMultiContinue() {
    const newAnswers = { ...answers, [currentQ]: [...multiSelected] };
    setAnswers(newAnswers);
    setMultiSelected(new Set());
    setCurrentQ(currentQ + 1);
  }

  function finishQuiz(finalAnswers) {
    setBuilding(true);
    setTimeout(() => {
      const profile = deriveProfile(finalAnswers);
      localStorage.setItem("gt_user_profile", JSON.stringify(profile));
      navigate("/");
    }, 1500);
  }

  function handleNext() {
    if (isMultiSelect) {
      handleMultiContinue();
    } else {
      const val = answers[currentQ];
      if (val === undefined) return;
      const newAnswers = { ...answers, [currentQ]: val };
      if (currentQ < total - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        finishQuiz(newAnswers);
      }
    }
  }

  if (building) {
    return (
      <div className="gt-root gt-texture" style={{ minHeight: "100vh" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: 16,
          }}
        >
          <div
            className="gt-pulse"
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--signal)",
            }}
          />
          <div className="gt-mono" style={{ color: "var(--signal)" }}>
            BUILDING YOUR PROFILE
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gt-root gt-texture" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 24px",
          borderBottom: "1px solid var(--hairline)",
          height: 49,
        }}
      >
        <span
          className="gt-crumb gt-crumb-link"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          ← back
        </span>
        <span className="gt-crumb-sep">/</span>
        <GTWordmark size={12} />
        <span className="gt-crumb-sep">/</span>
        <span className="gt-crumb">profile · quiz</span>
        <div style={{ flex: 1 }} />
        <span className="gt-mono" style={{ fontSize: 10 }}>
          QUESTION {String(currentQ + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--bg-2)" }}>
        <div
          style={{
            height: "100%",
            width: ((currentQ + 1) / total) * 100 + "%",
            background: "var(--signal)",
            transition: "width 0.4s var(--ease-out)",
          }}
        />
      </div>

      {/* Question area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 51px)",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 620, width: "100%" }}>
          <div
            className="gt-mono"
            style={{ marginBottom: 18, color: "var(--signal)" }}
          >
            {String(currentQ + 1).padStart(2, "0")} · QUESTION
          </div>

          <div
            style={{
              fontFamily: "var(--serif)",
              fontSize: 36,
              lineHeight: 1.15,
              color: "var(--ink-0)",
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            {question.text}
          </div>

          {isMultiSelect && (
            <div
              className="gt-body"
              style={{ color: "var(--ink-2)", marginBottom: 24 }}
            >
              Select all that apply.
            </div>
          )}

          {!isMultiSelect && <div style={{ marginBottom: 24 }} />}

          {/* Options */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {question.options.map((option, i) => {
              const isSelected = isMultiSelect
                ? multiSelected.has(option)
                : answers[currentQ] === option;
              return (
                <div
                  key={option}
                  onClick={() =>
                    isMultiSelect
                      ? handleMultiToggle(option)
                      : handleSingleSelect(option)
                  }
                  style={{
                    padding: "15px 20px",
                    borderRadius: 5,
                    cursor: "pointer",
                    background: isSelected ? "var(--bg-3)" : "var(--bg-2)",
                    border:
                      "1px solid " +
                      (isSelected ? "var(--signal)" : "var(--hairline)"),
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    transition: "all 0.15s var(--ease-out)",
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 3,
                      flexShrink: 0,
                      background: isSelected ? "var(--signal)" : "transparent",
                      border:
                        "1px solid " +
                        (isSelected
                          ? "var(--signal)"
                          : "var(--hairline-strong)"),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "#fff",
                    }}
                  >
                    {isSelected ? "✓" : String.fromCharCode(65 + i)}
                  </div>
                  <span
                    style={{
                      fontSize: 14.5,
                      color: isSelected ? "var(--ink-0)" : "var(--ink-1)",
                    }}
                  >
                    {option}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 28,
            }}
          >
            <span className="gt-mono" style={{ fontSize: 10 }}>
              {isMultiSelect ? "SELECT ALL THAT APPLY" : "↵ CLICK TO CONTINUE"}
            </span>
            <button
              className="gt-btn gt-btn-primary"
              onClick={handleNext}
              disabled={!canContinue}
            >
              {currentQ === total - 1 ? "Finish →" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
