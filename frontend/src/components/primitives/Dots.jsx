function driftTone(value) {
  if (value <= 2) return "phosphor";
  if (value <= 3) return "amber";
  return "signal";
}

export function GTDots({
  value = 0,
  max = 5,
  tone = "signal",
  label,
  size = 7,
  gap = 4,
}) {
  const dotTone = (i) => {
    if (i >= value) return "";
    if (tone === "drift") return driftTone(value);
    return tone;
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <div className="gt-dots" style={{ gap }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`gt-dot${i < value ? ` active ${dotTone(i)}` : ""}`}
            style={{ width: size, height: size }}
          />
        ))}
      </div>
      {label && (
        <span className="gt-mono" style={{ fontSize: 10 }}>
          {value}/{max} — {label}
        </span>
      )}
    </div>
  );
}

function sparkColor(v) {
  if (v == null) return "var(--ink-4)";
  if (v <= 2) return "var(--phosphor)";
  if (v <= 3) return "var(--amber)";
  return "var(--signal)";
}

export function GTSparkline({ runs = [] }) {
  return (
    <div className="gt-spark">
      {runs.map((v, i) => (
        <div
          key={i}
          className="gt-spark-dot"
          style={{ background: sparkColor(v) }}
        />
      ))}
    </div>
  );
}
