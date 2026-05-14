export function GTMark({ size = 18, color = "var(--signal)" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ display: "block", flexShrink: 0 }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
      />
      <line x1="12" y1="1.5" x2="12" y2="6" stroke={color} strokeWidth="1.2" />
      <line
        x1="12"
        y1="18"
        x2="12"
        y2="22.5"
        stroke={color}
        strokeWidth="1.2"
      />
      <line x1="1.5" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.2" />
      <line
        x1="18"
        y1="12"
        x2="22.5"
        y2="12"
        stroke={color}
        strokeWidth="1.2"
      />
      <circle cx="12" cy="12" r="1" fill={color} />
    </svg>
  );
}

export function GTWordmark({ size = 14, color = "var(--ink-0)" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <GTMark size={size + 4} />
      <span
        style={{
          fontFamily: "var(--sans)",
          fontWeight: 600,
          fontSize: size,
          letterSpacing: "-0.01em",
          color,
        }}
      >
        Ground<span style={{ color: "var(--signal)" }}>Truth</span>
      </span>
    </div>
  );
}

export function GTHeroWordmark() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <GTMark size={32} />
      <div
        style={{
          fontFamily: "var(--serif)",
          fontWeight: 400,
          fontSize: 64,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color: "var(--ink-0)",
        }}
      >
        Ground
        <span style={{ color: "var(--signal)", fontStyle: "italic" }}>
          Truth
        </span>
      </div>
    </div>
  );
}
