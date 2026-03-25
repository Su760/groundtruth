import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const QUESTIONS = [
  {
    id: 0,
    text: 'What brings you to GroundTruth?',
    multi: false,
    options: [
      'I want to understand a specific news event',
      'I\'m studying geopolitics or international relations',
      'I\'m a journalist or researcher',
      'I\'m just curious about the world',
    ],
  },
  {
    id: 1,
    text: 'How would you rate your geopolitical knowledge?',
    multi: false,
    options: [
      'Beginner — I follow headlines but not deep background',
      'Intermediate — I follow international news regularly',
      'Advanced — I have professional or academic background',
    ],
  },
  {
    id: 2,
    text: 'Which regions do you know least about?',
    multi: true,
    subtitle: 'Select all that apply',
    options: [
      'China & East Asia',
      'Russia & Eastern Europe',
      'Middle East & North Africa',
      'India & South Asia',
      'Global South (Africa, Latin America)',
      'I\'m fairly familiar with all regions',
    ],
  },
  {
    id: 3,
    text: 'How much historical context do you want in your reports?',
    multi: false,
    options: [
      'Just what\'s happening now — keep it current',
      'Some background — help me understand why this matters',
      'Deep context — I want the full historical picture',
    ],
  },
  {
    id: 4,
    text: 'What frustrates you most about mainstream news coverage?',
    multi: false,
    options: [
      'I can\'t tell what\'s true vs propaganda',
      'Stories lack historical context',
      'Only Western perspectives get coverage',
      'Headlines oversimplify complex issues',
    ],
  },
  {
    id: 5,
    text: 'How do you prefer information presented?',
    multi: false,
    options: [
      'Plain language — explain it to me simply',
      'Analytical — give me the data and let me judge',
      'Comparative — show me how different sides see it',
      'Dense and detailed — don\'t simplify',
    ],
  },
  {
    id: 6,
    text: 'When reading about a conflict, what do you most want to understand?',
    multi: false,
    options: [
      'Who\'s right and who\'s wrong',
      'Why each side believes what they believe',
      'The economic and political interests involved',
      'How the media is manipulating the story',
    ],
  },
  {
    id: 7,
    text: 'Do you have personal ties to any region outside the US/West?',
    multi: false,
    options: [
      'Yes — East Asia or China',
      'Yes — Russia or Eastern Europe',
      'Yes — Middle East or North Africa',
      'Yes — South Asia or India',
      'Yes — Africa or Latin America',
      'No personal ties / prefer not to say',
    ],
  },
  {
    id: 8,
    text: 'How long do you want GroundTruth reports to be?',
    multi: false,
    options: [
      'Concise — key points only',
      'Standard — thorough but readable',
      'Comprehensive — give me everything',
    ],
  },
  {
    id: 9,
    text: 'What\'s the main thing you want GroundTruth to help you with?',
    multi: false,
    options: [
      'Cut through propaganda and find the truth',
      'Understand perspectives I\'ve never been exposed to',
      'Challenge my own assumptions and biases',
      'Get research-quality analysis of current events',
    ],
  },
]

const REGION_MAP = {
  'China & East Asia': 'China',
  'Russia & Eastern Europe': 'Russia',
  'Middle East & North Africa': 'Middle East',
  'India & South Asia': 'India',
  'Global South (Africa, Latin America)': 'Global South',
}

const TIE_MAP = {
  'Yes — East Asia or China': 'China',
  'Yes — Russia or Eastern Europe': 'Russia',
  'Yes — Middle East or North Africa': 'Middle East',
  'Yes — South Asia or India': 'India',
  'Yes — Africa or Latin America': 'Global South',
}

function deriveProfile(answers) {
  const expertise_level = {
    'Beginner — I follow headlines but not deep background': 'beginner',
    'Intermediate — I follow international news regularly': 'intermediate',
    'Advanced — I have professional or academic background': 'advanced',
  }[answers[1]] ?? 'intermediate'

  const emphasized_blocs = (answers[2] || [])
    .filter((r) => REGION_MAP[r])
    .map((r) => REGION_MAP[r])

  const tieBloc = TIE_MAP[answers[7]]
  if (tieBloc && !emphasized_blocs.includes(tieBloc)) emphasized_blocs.push(tieBloc)

  const depth = {
    "Just what's happening now — keep it current": 'shallow',
    'Some background — help me understand why this matters': 'medium',
    'Deep context — I want the full historical picture': 'deep',
  }[answers[3]] ?? 'medium'

  const tone = {
    'Plain language — explain it to me simply': 'explanatory',
    'Analytical — give me the data and let me judge': 'analytical',
    'Comparative — show me how different sides see it': 'comparative',
    "Dense and detailed — don't simplify": 'analytical',
  }[answers[5]] ?? 'comparative'

  const goal = {
    'Cut through propaganda and find the truth': 'fact-check',
    "Understand perspectives I've never been exposed to": 'understand',
    'Challenge my own assumptions and biases': 'challenge-self',
    'Get research-quality analysis of current events': 'research',
  }[answers[9]] ?? 'understand'

  return {
    expertise_level,
    tone,
    depth,
    emphasized_blocs,
    goal,
    frustration: answers[4] || '',
  }
}

export default function Quiz() {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState({})
  const [multiSelected, setMultiSelected] = useState(new Set())
  const [building, setBuilding] = useState(false)
  const navigate = useNavigate()

  const total = QUESTIONS.length
  const progressPct = (currentQ / total) * 100

  function handleSingleSelect(value) {
    const newAnswers = { ...answers, [currentQ]: value }
    setAnswers(newAnswers)

    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1)
    } else {
      // Last question answered
      finishQuiz(newAnswers)
    }
  }

  function handleMultiToggle(option) {
    const next = new Set(multiSelected)
    if (next.has(option)) {
      next.delete(option)
    } else {
      next.add(option)
    }
    setMultiSelected(next)
  }

  function handleMultiContinue() {
    const newAnswers = { ...answers, [currentQ]: [...multiSelected] }
    setAnswers(newAnswers)
    setMultiSelected(new Set())
    setCurrentQ(currentQ + 1)
  }

  function finishQuiz(finalAnswers) {
    setBuilding(true)
    setTimeout(() => {
      const profile = deriveProfile(finalAnswers)
      localStorage.setItem('gt_user_profile', JSON.stringify(profile))
      navigate('/')
    }, 1500)
  }

  if (building) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: '#0a0a0a' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#ef4444' }}
          />
          <span
            className="text-sm"
            style={{ color: '#444', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Building your profile...
          </span>
        </div>
      </div>
    )
  }

  const question = QUESTIONS[currentQ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Progress bar */}
      <div className="w-full h-0.5" style={{ background: '#111' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, background: '#ef4444' }}
        />
      </div>

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
        <span className="text-xs ml-auto" style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}>
          {currentQ + 1} / {total}
        </span>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          <div
            className="text-xs tracking-widest uppercase mb-3"
            style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Question {currentQ + 1} of {total}
            {question.subtitle && (
              <span className="ml-2 normal-case tracking-normal" style={{ color: '#444' }}>
                — {question.subtitle}
              </span>
            )}
          </div>
          <h2
            className="text-2xl font-semibold mb-8"
            style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}
          >
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((option) => {
              const isSelected = question.multi
                ? multiSelected.has(option)
                : answers[currentQ] === option

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    question.multi ? handleMultiToggle(option) : handleSingleSelect(option)
                  }
                  className="w-full text-left rounded p-4 transition-all relative"
                  style={{
                    background: isSelected ? '#1a0a0a' : '#111111',
                    border: isSelected ? '1px solid #ef4444' : '1px solid #1a1a1a',
                    color: isSelected ? '#e5e5e5' : '#888',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#2a2a2a'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.borderColor = '#1a1a1a'
                  }}
                >
                  {option}
                  {question.multi && isSelected && (
                    <span
                      className="absolute top-3 right-4 text-xs font-bold"
                      style={{ color: '#ef4444' }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Multi-select Continue button */}
          {question.multi && (
            <button
              type="button"
              onClick={handleMultiContinue}
              disabled={multiSelected.size === 0}
              className="mt-6 px-6 py-2.5 rounded text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: '#ef4444',
                color: '#fff',
                fontFamily: 'Inter, sans-serif',
                border: 'none',
                cursor: multiSelected.size > 0 ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (multiSelected.size > 0) e.currentTarget.style.background = '#dc2626'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ef4444'
              }}
            >
              Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
