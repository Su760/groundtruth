import {
  BLOCS,
  GTMark,
  GTWordmark,
  GTHeroWordmark,
  GTHeader,
  GTDots,
  GTSparkline,
  GTBlocChip,
  GTSourceChip,
  GTAgentRow,
} from "../components/primitives";

const PIPELINE_AGENTS = [
  "planner",
  "researcher",
  "bias",
  "perspective",
  "propaganda",
  "fact-check",
  "synthesizer",
];

function Section({ label, children }) {
  return (
    <div
      style={{
        marginBottom: 40,
        paddingBottom: 32,
        borderBottom: "1px solid var(--hairline)",
      }}
    >
      <div
        className="gt-mono"
        style={{ marginBottom: 18, color: "var(--signal)" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 16,
        alignItems: "center",
        marginBottom: 12,
      }}
    >
      <span className="gt-mono">{label}</span>
      <div>{children}</div>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <div
      className="gt-root gt-texture gt-scroll"
      style={{ minHeight: "100vh" }}
    >
      <GTHeader crumbs={[{ label: "design-system" }]} nav={false} />

      <div
        style={{ padding: "40px 44px 80px", maxWidth: 900, margin: "0 auto" }}
      >
        <div className="gt-mono" style={{ marginBottom: 12 }}>
          DESIGN SYSTEM · v0.4 · SMOKE TEST
        </div>
        <div
          style={{
            fontFamily: "var(--serif)",
            fontSize: 48,
            lineHeight: 1,
            letterSpacing: "-0.025em",
            color: "var(--ink-0)",
            marginBottom: 8,
          }}
        >
          Tokens &amp; <span style={{ fontStyle: "italic" }}>primitives</span>.
        </div>
        <div
          className="gt-body"
          style={{ color: "var(--ink-2)", marginBottom: 40 }}
        >
          All components rendering here means Phase 1 is clean.
        </div>

        {/* MARK + WORDMARKS */}
        <Section label="01 · MARK + WORDMARKS">
          <Row label="GTMark">
            <GTMark size={24} />
          </Row>
          <Row label="GTWordmark">
            <GTWordmark size={14} />
          </Row>
          <Row label="GTHeroWordmark">
            <div style={{ paddingTop: 16, paddingBottom: 16 }}>
              <GTHeroWordmark />
            </div>
          </Row>
        </Section>

        {/* DOTS */}
        <Section label="02 · DOTS — 5-DOT INTENSITY LANGUAGE">
          <Row label="SIGNAL · 5/5">
            <GTDots value={5} max={5} tone="signal" label="State-coordinated" />
          </Row>
          <Row label="PHOSPHOR · 4/5">
            <GTDots value={4} max={5} tone="phosphor" label="High confidence" />
          </Row>
          <Row label="AMBER · 3/5">
            <GTDots value={3} max={5} tone="amber" label="Moderate" />
          </Row>
          <Row label="DRIFT · LOW · 2/5">
            <GTDots value={2} max={5} tone="drift" label="Some drift" />
          </Row>
          <Row label="DRIFT · HIGH · 4/5">
            <GTDots value={4} max={5} tone="drift" label="Major reframing" />
          </Row>
          <Row label="SPARKLINE">
            <GTSparkline runs={[1, 2, 2, 3, 4]} />
          </Row>
        </Section>

        {/* BLOC CHIPS */}
        <Section label="03 · BLOC CHIPS — ALL 8 BLOCS">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.keys(BLOCS).map((code) => (
              <GTBlocChip key={code} bloc={code} showRegion />
            ))}
          </div>
        </Section>

        {/* SOURCE CHIPS */}
        <Section label="04 · SOURCE CHIPS">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <GTSourceChip name="Xinhua" color="var(--bloc-cn)" />
            <GTSourceChip name="RT" color="var(--bloc-ru)" />
            <GTSourceChip name="Al Jazeera" color="var(--bloc-me)" />
            <GTSourceChip name="BBC" color="var(--bloc-eu)" />
            <GTSourceChip name="Reuters" color="var(--bloc-ws)" />
            <GTSourceChip name="AP" color="var(--bloc-ws)" />
            <GTSourceChip name="CNN" color="var(--bloc-us)" />
            <GTSourceChip name="NDTV" color="var(--bloc-in)" />
          </div>
        </Section>

        {/* BUTTONS */}
        <Section label="05 · BUTTONS + INPUT">
          <Row label="PRIMARY">
            <button className="gt-btn gt-btn-primary">Analyze →</button>
          </Row>
          <Row label="GHOST">
            <button className="gt-btn gt-btn-ghost">Cancel</button>
          </Row>
          <Row label="INPUT">
            <input
              className="gt-input"
              placeholder="Enter a topic…"
              style={{ maxWidth: 360 }}
            />
          </Row>
        </Section>

        {/* HIGHLIGHTS */}
        <Section label="06 · INLINE HIGHLIGHTS">
          <div className="gt-body" style={{ maxWidth: 560 }}>
            Phrases like{" "}
            <span className="gt-highlight">"Operation Bunyan Marsoos"</span>{" "}
            suggest coordinated framing, while{" "}
            <span className="gt-highlight-amber">
              deliberate state-directed
            </span>{" "}
            language appears across multiple outlets simultaneously.
          </div>
        </Section>

        {/* AGENT ROW */}
        <Section label="07 · AGENT PIPELINE ROW">
          <GTAgentRow agents={PIPELINE_AGENTS} activeIdx={2} />
          <div className="gt-meta" style={{ marginTop: 10 }}>
            activeIdx=2 (bias is active, planner+researcher done)
          </div>
        </Section>

        {/* COLOR SWATCHES */}
        <Section label="08 · COLOR TOKENS">
          <div className="gt-mono" style={{ marginBottom: 10 }}>
            BACKGROUNDS
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              ["BG-0", "#0a0a0b", "var(--bg-0)"],
              ["BG-1", "#111113", "var(--bg-1)"],
              ["BG-2", "#16161a", "var(--bg-2)"],
              ["BG-3", "#1c1c22", "var(--bg-3)"],
              ["BG-4", "#24242c", "var(--bg-4)"],
            ].map(([n, hex, v]) => (
              <div key={n} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 48,
                    background: v,
                    border: "1px solid var(--hairline)",
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                <div className="gt-mono" style={{ fontSize: 9 }}>
                  {n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--mono)",
                    fontSize: 9,
                    color: "var(--ink-3)",
                  }}
                >
                  {hex}
                </div>
              </div>
            ))}
          </div>

          <div className="gt-mono" style={{ marginBottom: 10 }}>
            SIGNAL &amp; ACCENTS
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              ["SIGNAL", "var(--signal)"],
              ["AMBER", "var(--amber)"],
              ["STEEL", "var(--steel)"],
              ["PHOSPHOR", "var(--phosphor)"],
            ].map(([n, v]) => (
              <div key={n} style={{ flex: 1 }}>
                <div
                  style={{
                    height: 40,
                    background: v,
                    borderRadius: 4,
                    marginBottom: 6,
                  }}
                />
                <div className="gt-mono" style={{ fontSize: 9 }}>
                  {n}
                </div>
              </div>
            ))}
          </div>

          <div className="gt-mono" style={{ marginBottom: 10 }}>
            BLOC IDENTIFIERS
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(BLOCS).map(([k, b]) => (
              <div
                key={k}
                style={{
                  flex: 1,
                  padding: 10,
                  background: "var(--bg-2)",
                  border: "1px solid var(--hairline)",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 24,
                    background: b.color,
                    borderRadius: 2,
                    marginBottom: 8,
                  }}
                />
                <div className="gt-mono" style={{ fontSize: 9 }}>
                  {k}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* CARDS */}
        <Section label="09 · CARDS + MOTION">
          <div style={{ display: "flex", gap: 12 }}>
            <div className="gt-card" style={{ padding: 16, flex: 1 }}>
              <div className="gt-mono" style={{ marginBottom: 8 }}>
                GT-CARD
              </div>
              <div className="gt-body">
                Static card with bg-2 and hairline border.
              </div>
            </div>
            <div
              className="gt-card gt-card-hover"
              style={{ padding: 16, flex: 1, cursor: "pointer" }}
            >
              <div className="gt-mono" style={{ marginBottom: 8 }}>
                GT-CARD-HOVER
              </div>
              <div className="gt-body">
                Hover me — lifts 1px, border strengthens.
              </div>
            </div>
            <div
              className="gt-card"
              style={{
                padding: 16,
                flex: 1,
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div
                className="gt-pulse"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--signal)",
                  flexShrink: 0,
                }}
              />
              <div>
                <div className="gt-mono">GT-PULSE</div>
                <div className="gt-meta" style={{ marginTop: 4 }}>
                  1.4s loop · active agent indicator
                </div>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
