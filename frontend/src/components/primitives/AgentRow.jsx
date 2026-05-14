export function GTAgentRow({ agents, activeIdx }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        padding: "10px 14px",
        background: "var(--bg-2)",
        border: "1px solid var(--hairline)",
        borderRadius: 6,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      {agents.map((a, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <span
            key={a}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 10px",
                borderRadius: 4,
                background: active ? "var(--signal-glow)" : "transparent",
                border:
                  "1px solid " + (active ? "var(--signal-dim)" : "transparent"),
                opacity: done || active ? 1 : 0.45,
                transition: "all 0.3s var(--ease-out)",
              }}
            >
              <div
                className={active ? "gt-pulse" : ""}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: done
                    ? "var(--phosphor)"
                    : active
                      ? "var(--signal)"
                      : "var(--ink-4)",
                }}
              />
              <span
                className="gt-mono"
                style={{
                  fontSize: 10,
                  color: active
                    ? "var(--ink-0)"
                    : done
                      ? "var(--ink-2)"
                      : "var(--ink-3)",
                }}
              >
                {a}
              </span>
            </div>
            {i < agents.length - 1 && (
              <span
                style={{
                  color: "var(--ink-4)",
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                }}
              >
                ›
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
