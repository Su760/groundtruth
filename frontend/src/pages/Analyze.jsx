import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const AGENT_ORDER = [
  { key: 'planner', label: 'Planner' },
  { key: 'researcher', label: 'Researcher' },
  { key: 'context_historian', label: 'Context Historian' },
  { key: 'translation_layer', label: 'Translation Layer' },
  { key: 'bias_detector', label: 'Bias Detector' },
  { key: 'perspective_analyst', label: 'Perspective Analyst' },
  { key: 'propaganda_mapper', label: 'Propaganda Mapper' },
  { key: 'fact_checker', label: 'Fact Checker' },
  { key: 'synthesizer', label: 'Synthesizer' },
]

function AgentStep({ label, status }) {
  const isDone = status === 'done'
  const isActive = status === 'active'
  return (
    <div className="flex items-center gap-3 py-2">
      {/* Status indicator */}
      <div
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
        style={{
          background: isDone ? '#22c55e' : 'transparent',
          border: isDone ? 'none' : isActive ? 'none' : '1px solid #2a2a2a',
          transition: 'all 0.3s ease',
        }}
      >
        {isDone && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="#0a0a0a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {isActive && (
          <div
            className="w-5 h-5 rounded-full animate-pulse"
            style={{ background: '#ef4444' }}
          />
        )}
      </div>
      <span
        className="text-sm transition-all duration-300"
        style={{
          color: isDone || isActive ? '#e5e5e5' : '#333',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default function Analyze() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const topic = searchParams.get('topic') || ''

  // Read profile once — not reactive, profile doesn't change during analysis
  const profile = (() => {
    try { return JSON.parse(localStorage.getItem('gt_user_profile')) } catch { return null }
  })()

  const [agentStatuses, setAgentStatuses] = useState(() =>
    Object.fromEntries(AGENT_ORDER.map((a) => [a.key, 'pending']))
  )
  const [activeAgent, setActiveAgent] = useState(AGENT_ORDER[0].key)
  const [report, setReport] = useState(null)
  const [missingRegions, setMissingRegions] = useState([])
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(true)

  useEffect(() => {
    if (!topic) {
      navigate('/')
      return
    }

    const controller = new AbortController()

    async function startAnalysis() {
      try {
        const res = await fetch('http://localhost:8000/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic, profile }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const text = await res.text()
          setError(`Server error ${res.status}: ${text}`)
          setIsRunning(false)
          return
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          // SSE events are delimited by \n\n
          const parts = buffer.split('\n\n')
          buffer = parts.pop() // keep incomplete trailing chunk

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith('data: ')) continue
            try {
              const evt = JSON.parse(line.slice(6).trim())
              if (evt.type === 'progress') {
                setAgentStatuses((prev) => ({ ...prev, [evt.agent]: 'done' }))
                // Set next agent as active
                const idx = AGENT_ORDER.findIndex((a) => a.key === evt.agent)
                const next = AGENT_ORDER[idx + 1]
                setActiveAgent(next ? next.key : null)
              } else if (evt.type === 'coverage') {
                setMissingRegions(evt.missing_regions || [])
              } else if (evt.type === 'done') {
                setReport(evt.report)
                setActiveAgent(null)
                setIsRunning(false)
              } else if (evt.type === 'error') {
                setError(evt.message)
                setActiveAgent(null)
                setIsRunning(false)
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
          setIsRunning(false)
        }
      }
    }

    startAnalysis()
    return () => controller.abort()
  }, [topic, navigate])

  const completedCount = Object.values(agentStatuses).filter((s) => s === 'done').length

  // Compute displayed statuses: active agent overrides pending
  const displayStatuses = Object.fromEntries(
    AGENT_ORDER.map((a) => {
      const s = agentStatuses[a.key]
      if (s === 'pending' && a.key === activeAgent && isRunning) return [a.key, 'active']
      return [a.key, s]
    })
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: '1px solid #141414' }}
      >
        <button
          onClick={() => navigate('/')}
          className="text-xs transition-colors"
          style={{
            color: '#444',
            fontFamily: 'JetBrains Mono, monospace',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#666')}
          onMouseLeave={(e) => (e.target.style.color = '#444')}
        >
          ← back
        </button>
        <span
          className="text-sm font-bold"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: '#ef4444' }}
        >
          GroundTruth
        </span>
        <span className="text-xs" style={{ color: '#333' }}>
          /
        </span>
        <span className="text-sm truncate max-w-xs" style={{ color: '#666' }}>
          {topic}
        </span>
        <div className="ml-auto">
          <button
            onClick={() => navigate('/reports')}
            className="text-xs transition-colors"
            style={{
              color: '#444',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#666')}
            onMouseLeave={(e) => (e.target.style.color = '#444')}
          >
            History
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 gap-0">
        {/* Left sidebar — agent progress */}
        <div
          className="w-full lg:w-64 flex-shrink-0 p-6"
          style={{ borderRight: '1px solid #141414' }}
        >
          <div className="mb-4">
            <div className="text-xs tracking-widest uppercase mb-1" style={{ color: '#333' }}>
              Analysis pipeline
            </div>
            <div className="text-xs" style={{ color: '#444' }}>
              {completedCount} / {AGENT_ORDER.length} complete
            </div>
          </div>

          <div className="space-y-0">
            {AGENT_ORDER.map((agent) => (
              <AgentStep
                key={agent.key}
                label={agent.label}
                status={displayStatuses[agent.key]}
              />
            ))}
          </div>

          {isRunning && (
            <div className="mt-6 flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#ef4444' }}
              />
              <span className="text-xs" style={{ color: '#444' }}>
                Running...
              </span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 lg:p-8 overflow-auto">
          {error && (
            <div
              className="rounded p-4 mb-6"
              style={{ background: '#1a0a0a', border: '1px solid #3f1515' }}
            >
              <div className="text-sm font-medium mb-1" style={{ color: '#ef4444' }}>
                Analysis failed
              </div>
              <div className="text-sm" style={{ color: '#888' }}>
                {error}
              </div>
              <button
                onClick={() => navigate('/')}
                className="mt-3 text-xs px-3 py-1.5 rounded transition-colors"
                style={{ background: '#1f1f1f', color: '#999', border: '1px solid #2a2a2a' }}
              >
                Try another topic
              </button>
            </div>
          )}

          {isRunning && !error && (
            <div className="flex flex-col items-start">
              <div
                className="text-xs tracking-widest uppercase mb-4"
                style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
              >
                Analyzing
              </div>
              <div
                className="text-2xl font-bold mb-6"
                style={{ fontFamily: 'JetBrains Mono, monospace', color: '#e5e5e5' }}
              >
                {topic}
              </div>
              {/* Progress skeleton */}
              <div className="w-full space-y-3">
                {[120, 80, 100, 90].map((w, i) => (
                  <div
                    key={i}
                    className="h-3 rounded animate-pulse"
                    style={{
                      background: '#141414',
                      width: `${w * 0.6 + 20}%`,
                      maxWidth: '100%',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {report && !isRunning && (
            <div>
              {missingRegions.length > 0 && (
                <div
                  className="rounded px-4 py-3 mb-6 text-xs"
                  style={{
                    background: '#1a1500',
                    border: '1px solid #3a2a00',
                    color: '#a16207',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  ⚠ No coverage found for: {missingRegions.join(', ')} — analysis may reflect
                  incomplete power bloc perspectives.
                </div>
              )}

              <div className="report-content">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>

              <div className="mt-10 pt-6" style={{ borderTop: '1px solid #1a1a1a' }}>
                <button
                  onClick={() => navigate('/')}
                  className="px-5 py-2.5 rounded text-sm font-medium transition-colors"
                  style={{
                    background: '#111111',
                    color: '#e5e5e5',
                    border: '1px solid #222',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => (e.target.style.borderColor = '#333')}
                  onMouseLeave={(e) => (e.target.style.borderColor = '#222')}
                >
                  Analyze another topic
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
