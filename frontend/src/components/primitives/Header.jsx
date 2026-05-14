import { GTWordmark } from "./Mark";

export function GTHeader({ crumbs = [], nav = true, right }) {
  return (
    <div className="gt-header">
      <GTWordmark size={13} />
      {crumbs.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="gt-crumb-sep">/</span>
          {crumbs.map((c, i) => (
            <span
              key={i}
              style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
            >
              {i > 0 && <span className="gt-crumb-sep">/</span>}
              <span className={`gt-crumb${c.link ? " gt-crumb-link" : ""}`}>
                {c.label}
              </span>
            </span>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }} />
      {right}
      {nav && (
        <div style={{ display: "flex", gap: 22 }}>
          {["Learn", "Tracker", "History"].map((n) => (
            <span
              key={n}
              className="gt-crumb gt-crumb-link"
              style={{ fontSize: 11 }}
            >
              {n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
