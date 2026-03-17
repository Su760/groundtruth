import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function timeAgo(isoStr) {
  const diff = (Date.now() - new Date(isoStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 172800) return 'yesterday'
  return `${Math.floor(diff / 86400)} days ago`
}

export default function Reports() {
  const navigate = useNavigate()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('http://localhost:8000/reports')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then(setReports)
      .catch((e) => setError(e.message))
  }, [])

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
          history
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        <div className="text-xs tracking-widest uppercase mb-6" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
          Past Analyses
        </div>

        {error && (
          <div className="text-sm" style={{ color: '#888' }}>
            Failed to load history: {error}
          </div>
        )}

        {reports === null && !error && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded animate-pulse"
                style={{ background: '#111111' }}
              />
            ))}
          </div>
        )}

        {reports !== null && reports.length === 0 && (
          <div className="text-sm" style={{ color: '#444' }}>
            No analyses yet. Run your first topic from the{' '}
            <button
              onClick={() => navigate('/')}
              style={{ color: '#666', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              home page
            </button>
            .
          </div>
        )}

        {reports !== null && reports.length > 0 && (
          <div className="space-y-2">
            {reports.map((r) => (
              <button
                key={r.slug}
                onClick={() => navigate('/analyze?topic=' + encodeURIComponent(r.title))}
                className="w-full text-left p-4 rounded transition-colors"
                style={{
                  background: '#111111',
                  border: '1px solid #1a1a1a',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}
              >
                <div className="text-sm font-medium capitalize mb-1" style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}>
                  {r.title}
                </div>
                <div className="text-xs" style={{ color: '#444' }}>
                  {timeAgo(r.created_at)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
