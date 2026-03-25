import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SCORE_MESSAGES = {
  6: 'Perfect — you know this topic cold.',
  5: 'Strong — a few gaps, but solid understanding.',
  4: 'Strong — a few gaps, but solid understanding.',
  3: 'Getting there — consider running a GroundTruth analysis.',
  2: 'Getting there — consider running a GroundTruth analysis.',
  1: 'Good starting point — GroundTruth can fill in the gaps.',
  0: 'Good starting point — GroundTruth can fill in the gaps.',
}

export default function QuizRunner({ quiz, onReset }) {
  const navigate = useNavigate()
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  const total = quiz.questions.length
  const question = quiz.questions[currentQ]
  const isLast = currentQ === total - 1

  function handleSelect(idx) {
    if (revealed) return
    setSelected(idx)
    setRevealed(true)
    if (idx === question.correct_index) {
      setScore((s) => s + 1)
    }
  }

  function handleNext() {
    if (isLast) {
      setFinished(true)
    } else {
      setCurrentQ((q) => q + 1)
      setSelected(null)
      setRevealed(false)
    }
  }

  function getOptionStyle(idx) {
    if (!revealed) {
      return {
        background: '#111111',
        border: '1px solid #1a1a1a',
        color: '#888',
        cursor: 'pointer',
      }
    }
    if (idx === question.correct_index) {
      return {
        background: '#0a1a0a',
        border: '1px solid #22c55e',
        color: '#e5e5e5',
        cursor: 'default',
      }
    }
    if (idx === selected) {
      return {
        background: '#1a0a0a',
        border: '1px solid #ef4444',
        color: '#e5e5e5',
        cursor: 'default',
      }
    }
    return {
      background: '#111111',
      border: '1px solid #1a1a1a',
      color: '#333',
      cursor: 'default',
    }
  }

  if (finished) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div
          className="text-5xl font-bold mb-4"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: '#e5e5e5' }}
        >
          {score} <span style={{ color: '#444' }}>/ {total}</span>
        </div>
        <p className="text-sm mb-8 italic" style={{ color: '#666' }}>
          {SCORE_MESSAGES[score] ?? SCORE_MESSAGES[0]}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 rounded text-sm transition-colors"
            style={{
              background: '#111111',
              border: '1px solid #222',
              color: '#999',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#333')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#222')}
          >
            Try another topic
          </button>
          <button
            onClick={() => navigate('/analyze?topic=' + encodeURIComponent(quiz.topic))}
            className="px-4 py-2 rounded text-sm font-medium transition-colors"
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
          >
            Analyze {quiz.topic} →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      {/* Source badge */}
      <div className="mb-4">
        {quiz.source === 'report' ? (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ background: '#1a1500', color: '#a16207', fontFamily: 'Inter, sans-serif' }}
          >
            Based on your report
          </span>
        ) : (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{ background: '#0a0f1a', color: '#4a7fa5', fontFamily: 'Inter, sans-serif' }}
          >
            General knowledge
          </span>
        )}
      </div>

      {/* Progress */}
      <div
        className="text-xs mb-4"
        style={{ color: '#333', fontFamily: 'JetBrains Mono, monospace' }}
      >
        Question {currentQ + 1} of {total}
      </div>

      {/* Question */}
      <h3
        className="text-xl font-semibold mb-6"
        style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}
      >
        {question.question}
      </h3>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {question.options.map((option, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(idx)}
            className="w-full text-left rounded p-4 transition-all text-sm"
            style={{
              ...getOptionStyle(idx),
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={(e) => {
              if (!revealed) e.currentTarget.style.borderColor = '#2a2a2a'
            }}
            onMouseLeave={(e) => {
              if (!revealed) e.currentTarget.style.borderColor = '#1a1a1a'
            }}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {revealed && (
        <p className="text-sm italic mb-6" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>
          {question.explanation}
        </p>
      )}

      {/* Next button */}
      {revealed && (
        <button
          type="button"
          onClick={handleNext}
          className="px-5 py-2.5 rounded text-sm font-medium transition-colors"
          style={{
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
        >
          {isLast ? 'See Results →' : 'Next →'}
        </button>
      )}
    </div>
  )
}
