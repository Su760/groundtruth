import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QuizRunner from '../components/QuizRunner'

const CURATED_TOPICS = [
  { label: 'Taiwan Strait', region: 'China' },
  { label: 'Ukraine War', region: 'Russia' },
  { label: 'Gaza Conflict', region: 'Middle East' },
  { label: 'South China Sea', region: 'China' },
  { label: 'Iran Nuclear Deal', region: 'Middle East' },
  { label: 'NATO Expansion', region: 'Europe' },
  { label: 'India-Pakistan Tensions', region: 'India' },
  { label: 'Sudan Civil War', region: 'Global South' },
  { label: 'US-China Trade War', region: 'China' },
  { label: 'Syria Conflict', region: 'Middle East' },
  { label: 'Venezuela Crisis', region: 'Global South' },
  { label: 'North Korea Nukes', region: 'China' },
]

export default function Learn() {
  const navigate = useNavigate()
  const [customInput, setCustomInput] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function triggerQuiz(topic) {
    setSelectedTopic(topic)
    setLoading(true)
    setQuiz(null)
    setError(null)
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/learn/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    })
      .then((r) => r.json())
      .then((data) => {
        setQuiz(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(e.message)
        setLoading(false)
      })
  }

  function handleCustomSubmit(e) {
    e.preventDefault()
    const trimmed = customInput.trim()
    if (!trimmed) return
    triggerQuiz(trimmed)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
        <Header navigate={navigate} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: '#ef4444' }}
            />
            <span className="text-sm" style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
              Generating quiz on {selectedTopic}...
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (quiz) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
        <Header navigate={navigate} />
        <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
          <div className="text-xs mb-2 tracking-widest uppercase" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedTopic}
          </div>
          <QuizRunner
            quiz={quiz}
            onReset={() => {
              setQuiz(null)
              setSelectedTopic(null)
              setCustomInput('')
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      <Header navigate={navigate} />

      <div className="flex-1 px-6 py-10 max-w-4xl mx-auto w-full">
        {/* Page title */}
        <div className="mb-8">
          <div
            className="text-xs tracking-widest uppercase mb-2"
            style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Knowledge Quizzes
          </div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#e5e5e5', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Test Your Understanding
          </h1>
          <p className="text-sm" style={{ color: '#555' }}>
            AI-generated quizzes on geopolitical topics. Pick a topic or enter your own.
          </p>
        </div>

        {/* Custom topic form */}
        <form onSubmit={handleCustomSubmit} className="flex gap-3 mb-10 max-w-xl">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Enter any topic..."
            className="flex-1 px-4 py-3 rounded text-sm outline-none transition-colors"
            style={{
              background: '#111111',
              border: '1px solid #222',
              color: '#e5e5e5',
              fontFamily: 'Inter, sans-serif',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#333')}
            onBlur={(e) => (e.target.style.borderColor = '#222')}
          />
          <button
            type="submit"
            disabled={!customInput.trim()}
            className="px-5 py-3 rounded text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              cursor: customInput.trim() ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (customInput.trim()) e.currentTarget.style.background = '#dc2626'
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
          >
            Start Quiz →
          </button>
        </form>

        {error && (
          <div
            className="rounded px-4 py-3 mb-6 text-sm"
            style={{ background: '#1a0a0a', border: '1px solid #3f1515', color: '#ef4444' }}
          >
            {error}
          </div>
        )}

        {/* Curated topic grid */}
        <div
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
        >
          Curated Topics
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURATED_TOPICS.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => triggerQuiz(t.label)}
              className="text-left p-4 rounded transition-all"
              style={{
                background: '#111111',
                border: '1px solid #1a1a1a',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
            >
              <div className="text-sm mb-1" style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}>
                {t.label}
              </div>
              <div
                className="text-xs tracking-widest uppercase"
                style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
              >
                {t.region}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Header({ navigate }) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-4"
      style={{ borderBottom: '1px solid #141414' }}
    >
      <button
        onClick={() => navigate('/')}
        className="text-xs transition-colors"
        style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
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
      <span className="text-sm" style={{ color: '#666' }}>
        learn
      </span>
    </div>
  )
}
