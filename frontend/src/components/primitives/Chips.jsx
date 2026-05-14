import { BLOCS } from "./blocs";

export function GTBlocChip({ bloc, showRegion = false }) {
  const b = BLOCS[bloc];
  if (!b) return null;
  return (
    <div className="gt-bloc-chip">
      <div className="gt-bloc-dot" style={{ background: b.color }} />
      <span>{b.name}</span>
      <span className="gt-bloc-code">{b.code}</span>
      {showRegion && (
        <span
          style={{
            color: "var(--ink-3)",
            textTransform: "none",
            letterSpacing: 0,
            marginLeft: 4,
          }}
        >
          {b.region}
        </span>
      )}
    </div>
  );
}

export function GTSourceChip({ name, color }) {
  return (
    <span className="gt-source-chip">
      <span
        className="gt-source-chip-dot"
        style={{ background: color || "var(--ink-3)" }}
      />
      {name}
    </span>
  );
}
