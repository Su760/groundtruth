import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SAMPLE_HEADLINES = [
  "Scientists Discover Coffee Drinkers Live 10 Years Longer on Average",
  "New Study Shows Social Media Use Has No Effect on Teen Mental Health",
  "Government Confirms UFO Sightings Are Actually Weather Balloons",
  "Economists Agree: Raising Minimum Wage Always Increases Unemployment",
  "Study Finds People Only Use 10% of Their Brain Capacity",
  "Drinking 8 Glasses of Water Daily Proven to Cure Most Illnesses",
  "Vaccines Shown to Alter Human DNA in Landmark Study",
]

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
  const [nudgeRating, setNudgeRating] = useState(null)
  const [headline] = useState(
    () => SAMPLE_HEADLINES[Math.floor(Math.random() * SAMPLE_HEADLINES.length)]
  )
  const [profile] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gt_user_profile')) } catch { return null }
  })
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

        {/* Accuracy nudge card */}
        <div
          className="w-full max-w-xl rounded mb-8"
          style={{ background: '#111111', border: '1px solid #1a1a1a', padding: '20px' }}
        >
          <div
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Before you analyze — a quick check
          </div>
          <p className="text-sm mb-2 text-center" style={{ color: '#666' }}>
            Rate the accuracy of this headline:
          </p>
          <p
            className="text-sm text-center mb-4 italic"
            style={{ color: '#888', maxWidth: '100%' }}
          >
            "{headline}"
          </p>

          {/* Rating buttons */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setNudgeRating(n)}
                  className="flex items-center justify-center text-sm font-medium transition-all"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: nudgeRating === n ? '#ef4444' : '#1a1a1a',
                    border: nudgeRating === n ? 'none' : '1px solid #2a2a2a',
                    color: nudgeRating === n ? '#fff' : '#444',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (nudgeRating !== n) e.currentTarget.style.borderColor = '#333'
                  }}
                  onMouseLeave={(e) => {
                    if (nudgeRating !== n) e.currentTarget.style.borderColor = '#2a2a2a'
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full" style={{ maxWidth: '220px' }}>
              <span className="text-xs" style={{ color: '#333' }}>Not accurate</span>
              <span className="text-xs" style={{ color: '#333' }}>Very accurate</span>
            </div>
          </div>

          {nudgeRating !== null && (
            <p
              className="text-xs text-center italic mt-2"
              style={{ color: '#555' }}
            >
              Good — you're now primed to read critically.
            </p>
          )}
        </div>

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
            className="px-6 py-3 rounded text-sm font-medium transition-colors disabled:cursor-not-allowed"
            style={{
              background: '#ef4444',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
              opacity: nudgeRating === null ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (topic.trim()) e.currentTarget.style.background = '#dc2626'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ef4444'
            }}
          >
            {nudgeRating === null ? 'Rate headline first →' : 'Analyze →'}
          </button>
        </form>

        <p className="mt-4 text-xs" style={{ color: '#333' }}>
          e.g. "Ukraine war", "Taiwan strait tensions", "Iran nuclear deal"
        </p>

        {/* Profile nudge / badge */}
        {profile ? (
          <p className="mt-3 text-xs" style={{ color: '#555' }}>
            ✓ Profile set — {profile.expertise_level}
            {' · '}
            <button
              type="button"
              onClick={() => navigate('/quiz')}
              className="underline transition-colors"
              style={{ color: '#444', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              onMouseEnter={(e) => (e.target.style.color = '#666')}
              onMouseLeave={(e) => (e.target.style.color = '#444')}
            >
              retake quiz
            </button>
          </p>
        ) : (
          <p className="mt-3 text-xs" style={{ color: '#444' }}>
            Get personalized reports →{' '}
            <button
              type="button"
              onClick={() => navigate('/quiz')}
              className="transition-colors"
              style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              onMouseEnter={(e) => (e.target.style.color = '#888')}
              onMouseLeave={(e) => (e.target.style.color = '#666')}
            >
              Take the 1-min quiz
            </button>
          </p>
        )}
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
