import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const FEATURES = [
  {
    title: 'Global Perspectives',
    description:
      'Aggregates coverage from Chinese state media, Al Jazeera, BBC, RT, Reuters, and US mainstream sources for every topic.',
  },
  {
    title: 'Bias Detection',
    description:
      'Scores each source on a bias scale and flags loaded language, selective omission, and hero/villain framing with quoted examples.',
  },
  {
    title: 'Propaganda Mapping',
    description:
      'Identifies specific rhetorical techniques — whataboutism, appeal to fear, false equivalence — with textual evidence from each outlet.',
  },
]

export default function Landing() {
  const [topic, setTopic] = useState('')
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = topic.trim()
    if (!trimmed) return
    navigate('/analyze?topic=' + encodeURIComponent(trimmed))
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        {/* Brand */}
        <div className="mb-2">
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
          >
            AI-powered media analysis
          </span>
        </div>
        <h1
          className="text-6xl md:text-7xl font-bold mb-6 tracking-tight"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Ground<span style={{ color: '#ef4444' }}>Truth</span>
        </h1>
        <p
          className="text-lg md:text-xl mb-12 text-center max-w-xl"
          style={{ color: '#666', lineHeight: '1.7' }}
        >
          See every perspective. Detect every bias.
          <br />
          Understand why different powers frame stories the way they do.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl flex gap-3">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a news topic..."
            className="flex-1 px-4 py-3 rounded text-sm outline-none transition-colors"
            style={{
              background: '#111111',
              border: '1px solid #222',
              color: '#e5e5e5',
              fontFamily: 'Inter, sans-serif',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#333'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#222'
            }}
          />
          <button
            type="submit"
            disabled={!topic.trim()}
            className="px-6 py-3 rounded text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: '#ef4444',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (topic.trim()) e.target.style.background = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ef4444'
            }}
          >
            Analyze
          </button>
        </form>

        <p className="mt-4 text-xs" style={{ color: '#333' }}>
          e.g. "Ukraine war", "Taiwan strait tensions", "Iran nuclear deal"
        </p>
      </div>

      {/* Feature cards */}
      <div className="px-6 pb-16">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="p-5 rounded"
              style={{ background: '#111111', border: '1px solid #1a1a1a' }}
            >
              <div
                className="text-xs font-medium mb-2 tracking-widest uppercase"
                style={{ color: '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {f.title}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#666' }}>
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
