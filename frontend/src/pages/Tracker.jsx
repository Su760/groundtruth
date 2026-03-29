import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function driftScore(textA, textB) {
  if (!textA || !textB) return null
  const wordsA = new Set((textA.toLowerCase().match(/\w+/g) || []))
  const wordsB = new Set((textB.toLowerCase().match(/\w+/g) || []))
  const shared = [...wordsA].filter((w) => wordsB.has(w)).length
  const maxLen = Math.max(wordsA.size, wordsB.size)
  if (maxLen === 0) return null
  return Math.round((shared / maxLen) * 5)
}

function DriftDots({ score }) {
  if (score === null) return <span className="text-xs" style={{ color: '#333' }}>No data</span>
  const color = score >= 4 ? '#22c55e' : score >= 2 ? '#a16207' : '#ef4444'
  const label = score >= 4 ? 'Stable' : score >= 2 ? 'Some drift' : 'Significant shift'
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: n <= score ? color : 'transparent',
            border: `1.5px solid ${n <= score ? color : '#2a2a2a'}`,
          }}
        />
      ))}
      <span className="text-xs ml-1" style={{ color: '#444', fontFamily: 'Inter, sans-serif' }}>
        {score}/5 — {label}
      </span>
    </div>
  )
}

function BlocCard({ region, snapA, snapB, runALabel, runBLabel }) {
  const [expanded, setExpanded] = useState(true)

  const FIELDS = [
    { key: 'narrative_frame', label: 'Narrative Frame' },
    { key: 'structural_interests', label: 'Structural Interests' },
    { key: 'what_this_bloc_gains', label: 'What This Bloc Gains' },
    { key: 'deliberate_vs_organic', label: 'Deliberate vs Organic' },
  ]

  const score = snapA && snapB
    ? driftScore(snapA.narrative_frame, snapB.narrative_frame)
    : null

  const isSingleRun = !snapB

  return (
    <div
      className="rounded mb-4"
      style={{ background: '#111111', border: '1px solid #1a1a1a' }}
    >
      {/* Card header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ cursor: 'pointer', background: 'none', border: 'none' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }} />
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {region}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {!isSingleRun && <DriftDots score={score} />}
          <span className="text-xs" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
            {expanded ? '▼' : '▶'}
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #1a1a1a' }}>
          {FIELDS.map((field) => {
            const valA = snapA?.[field.key]
            const valB = snapB?.[field.key]
            return (
              <div
                key={field.key}
                className="px-5 py-4"
                style={{ borderBottom: '1px solid #141414' }}
              >
                <div
                  className="text-xs mb-2 tracking-wide"
                  style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  {field.label}
                </div>
                {isSingleRun ? (
                  <p className="text-sm leading-relaxed" style={{ color: '#888', fontFamily: 'Inter, sans-serif' }}>
                    {valA || <span style={{ color: '#333' }}>No data</span>}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
                        {runALabel}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>
                        {valA || <span style={{ color: '#222' }}>No data</span>}
                      </p>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
                        {runBLabel}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}>
                        {valB || <span style={{ color: '#222' }}>No data</span>}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Tracker() {
  const navigate = useNavigate()
  const [view, setView] = useState('list')
  const [topics, setTopics] = useState(null)
  const [selectedSlug, setSelectedSlug] = useState(null)
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [runA, setRunA] = useState(0)
  const [runB, setRunB] = useState(null)

  // Fetch topic list on mount
  useEffect(() => {
    setLoading(true)
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/tracker`)
      .then((r) => r.json())
      .then((data) => {
        setTopics(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  function handleTopicClick(slug) {
    setLoading(true)
    setError(null)
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/tracker/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data)
        setSelectedSlug(slug)
        setRunA(0)
        setRunB(data.length - 1)
        setView('detail')
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }

  function handleBackToList() {
    setView('list')
    setHistory(null)
    setSelectedSlug(null)
  }

  const isSingleRun = history && history.length === 1

  // Compute all unique regions across both selected runs
  function getRegionsForRuns() {
    if (!history) return []
    const runAData = history[runA]
    const runBData = history[runB]
    const allRegions = new Set()
    ;(runAData?.bloc_snapshots || []).forEach((s) => allRegions.add(s.region))
    ;(runBData?.bloc_snapshots || []).forEach((s) => allRegions.add(s.region))
    return [...allRegions].sort()
  }

  function getSnapForRegion(runIdx, region) {
    return history?.[runIdx]?.bloc_snapshots?.find((s) => s.region === region) || null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid #141414' }}
      >
        {view === 'detail' ? (
          <button
            onClick={handleBackToList}
            className="text-xs transition-colors"
            style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
            onMouseEnter={(e) => (e.target.style.color = '#666')}
            onMouseLeave={(e) => (e.target.style.color = '#444')}
          >
            ← All Topics
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="text-xs transition-colors"
            style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
            onMouseEnter={(e) => (e.target.style.color = '#666')}
            onMouseLeave={(e) => (e.target.style.color = '#444')}
          >
            ← back
          </button>
        )}
        <span
          className="text-sm font-bold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ef4444' }}
        >
          GroundTruth
        </span>
        <span className="text-xs" style={{ color: '#333' }}>/</span>
        <span className="text-sm" style={{ color: '#666' }}>
          {view === 'detail' && history
            ? history[0]?.topic
            : 'tracker'}
        </span>
      </div>

      <div className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {loading && (
          <div className="flex items-center gap-2 mt-8">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ef4444' }} />
            <span className="text-sm" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
              Loading...
            </span>
          </div>
        )}

        {error && (
          <div
            className="rounded px-4 py-3 text-sm"
            style={{ background: '#1a0a0a', border: '1px solid #3f1515', color: '#ef4444' }}
          >
            {error}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && !loading && (
          <>
            <div className="mb-6">
              <div
                className="text-xs tracking-widest uppercase mb-2"
                style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Narrative Arc Tracker
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Tracked Topics
              </h1>
            </div>

            {topics && topics.length === 0 && (
              <p className="text-sm" style={{ color: '#444', fontFamily: 'Inter, sans-serif' }}>
                No topics tracked yet. Run your first analysis to start tracking.
              </p>
            )}

            <div className="space-y-3">
              {(topics || []).map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => handleTopicClick(t.slug)}
                  className="w-full text-left p-4 rounded transition-all"
                  style={{
                    background: '#111111',
                    border: '1px solid #1a1a1a',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
                >
                  <div
                    className="text-sm font-medium mb-1 capitalize"
                    style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}
                  >
                    {t.topic}
                  </div>
                  <div className="text-xs" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
                    {t.run_count} {t.run_count === 1 ? 'run' : 'runs'} · last run {timeAgo(t.last_run)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── DETAIL VIEW ── */}
        {view === 'detail' && !loading && history && (
          <>
            {isSingleRun ? (
              <>
                <div
                  className="text-xs tracking-widest uppercase mb-6"
                  style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Run 1 — {formatDate(history[0].created_at)}
                </div>

                {getRegionsForRuns().map((region) => (
                  <BlocCard
                    key={region}
                    region={region}
                    snapA={getSnapForRegion(0, region)}
                    snapB={null}
                    runALabel="Run 1"
                    runBLabel=""
                  />
                ))}

                <p
                  className="mt-6 text-sm"
                  style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
                >
                  Run this topic again to see narrative drift →
                </p>
              </>
            ) : (
              <>
                {/* Run selectors */}
                <div className="mb-6">
                  <div
                    className="text-xs tracking-widest uppercase mb-3"
                    style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
                  >
                    Compare runs
                  </div>
                  <div className="grid grid-cols-2 gap-4 max-w-xl">
                    <div>
                      <div className="text-xs mb-2" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
                        Run A (baseline)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {history.map((run, idx) => (
                          <button
                            key={run.id}
                            type="button"
                            onClick={() => setRunA(idx)}
                            className="text-xs px-3 py-1.5 rounded transition-all"
                            style={{
                              background: runA === idx ? '#1a0a0a' : '#111111',
                              border: `1px solid ${runA === idx ? '#ef4444' : '#1a1a1a'}`,
                              color: runA === idx ? '#e5e5e5' : '#666',
                              fontFamily: 'JetBrains Mono, monospace',
                              cursor: 'pointer',
                            }}
                          >
                            Run {idx + 1} — {formatDate(run.created_at)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs mb-2" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
                        Run B (compare)
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {history.map((run, idx) => (
                          <button
                            key={run.id}
                            type="button"
                            onClick={() => setRunB(idx)}
                            className="text-xs px-3 py-1.5 rounded transition-all"
                            style={{
                              background: runB === idx ? '#1a0a0a' : '#111111',
                              border: `1px solid ${runB === idx ? '#ef4444' : '#1a1a1a'}`,
                              color: runB === idx ? '#e5e5e5' : '#666',
                              fontFamily: 'JetBrains Mono, monospace',
                              cursor: 'pointer',
                            }}
                          >
                            Run {idx + 1} — {formatDate(run.created_at)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloc comparison cards */}
                <div>
                  {getRegionsForRuns().map((region) => (
                    <BlocCard
                      key={region}
                      region={region}
                      snapA={getSnapForRegion(runA, region)}
                      snapB={getSnapForRegion(runB, region)}
                      runALabel={`Run ${runA + 1} — ${formatDate(history[runA]?.created_at)}`}
                      runBLabel={`Run ${runB + 1} — ${formatDate(history[runB]?.created_at)}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
