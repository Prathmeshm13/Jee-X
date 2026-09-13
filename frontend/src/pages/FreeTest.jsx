import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Clock, Check, X as XIcon, ArrowRight } from 'lucide-react'
import { freeTestQuestions, SECONDS_PER_QUESTION } from '../data/freeTestQuestions.js'
import { api } from '../lib/api.js'
import { savePendingFreeTest } from '../lib/pendingFreeTest.js'
import { useCrackJeeStyles } from '../crackjee/screens.jsx'
import { INK, PAPER, PAPER_LINE, SLATE, AMBER, GRAPHITE, WHITE, PHYSICS, CHEM, MATHS, GOOD, BAD, card, primaryBtn, inkBtn, fontDisplay, fontMono } from '../crackjee/ui.js'

const SUBJECT_COLOR = { Physics: PHYSICS, Chemistry: CHEM, Mathematics: MATHS }

function PichaiBadge() {
  // Line-art monogram standing in for a photo — see conversation note on why
  // we don't embed a real person's photo here.
  return (
    <svg viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="none" stroke={PAPER_LINE} strokeWidth="1" />
      <circle cx="60" cy="60" r="46" fill={INK} />
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * 2 * Math.PI
        const x1 = 60 + 50 * Math.cos(angle)
        const y1 = 60 + 50 * Math.sin(angle)
        const x2 = 60 + 56 * Math.cos(angle)
        const y2 = 60 + 56 * Math.sin(angle)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={AMBER} strokeWidth="1.5" opacity="0.6" />
      })}
      <text x="60" y="70" textAnchor="middle" fill={PAPER} fontSize="28" fontWeight="600" fontFamily={fontMono}>SP</text>
    </svg>
  )
}

function Timer({ seconds }) {
  const urgent = seconds <= 10
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: urgent ? '#fbeae6' : WHITE, border: `1px solid ${urgent ? '#e3b4a6' : PAPER_LINE}`, color: urgent ? BAD : GRAPHITE, fontWeight: 600, fontSize: 13 }}>
      <Clock size={15} />
      <span style={{ fontFamily: fontMono }}>00:{String(seconds).padStart(2, '0')}</span>
    </div>
  )
}

const chip = () => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: WHITE, border: `1px solid ${PAPER_LINE}`, fontSize: 12.5, fontWeight: 500, color: SLATE })
const dot = (color) => ({ width: 7, height: 7, borderRadius: '50%', background: color })

export default function FreeTest() {
  useCrackJeeStyles()
  const { loginWithRedirect, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const [phase, setPhase] = useState('story') // story | question | results
  const [index, setIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState([])
  const [saveState, setSaveState] = useState('idle')
  const intervalRef = useRef(null)
  const submittedRef = useRef(false)

  const question = freeTestQuestions[index]
  const total = freeTestQuestions.length

  useEffect(() => {
    if (phase !== 'question' || revealed) return
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(intervalRef.current); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [phase, index, revealed])

  useEffect(() => {
    if (phase === 'question' && timeLeft === 0 && !revealed) submitAnswer(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const submitAnswer = (optionIndex) => {
    if (revealed) return
    clearInterval(intervalRef.current)
    const correct = optionIndex === question.correctAnswer
    setAnswers((prev) => [
      ...prev,
      { questionId: question.id, selected: optionIndex, correct, timeTaken: SECONDS_PER_QUESTION - timeLeft },
    ])
    setRevealed(true)
  }

  const goToNext = () => {
    if (index === total - 1) { setPhase('results'); return }
    setIndex((i) => i + 1)
    setSelected(null)
    setRevealed(false)
    setTimeLeft(SECONDS_PER_QUESTION)
  }

  const beginTest = () => setPhase('question')

  const results = useMemo(() => {
    if (phase !== 'results') return null
    const score = answers.filter((a) => a.correct).length
    const accuracy = Math.round((score / total) * 100)
    const avgTime = Math.round(answers.reduce((s, a) => s + a.timeTaken, 0) / total)
    const bySubject = {}
    freeTestQuestions.forEach((q, i) => {
      bySubject[q.subject] = bySubject[q.subject] || { correct: 0, total: 0 }
      bySubject[q.subject].total += 1
      if (answers[i]?.correct) bySubject[q.subject].correct += 1
    })
    return { score, accuracy, avgTime, bySubject }
  }, [phase, answers, total])

  useEffect(() => {
    if (phase !== 'results' || !results || submittedRef.current) return
    submittedRef.current = true

    const payload = {
      test_type: 'free_diagnostic',
      score: results.score,
      total_questions: total,
      accuracy: results.accuracy,
      avg_time_seconds: results.avgTime,
      subject_breakdown: results.bySubject,
    }

    if (isAuthenticated) {
      setSaveState('saving')
      ;(async () => {
        try {
          const token = await getAccessTokenSilently()
          await api.submitTestAttempt(token, payload)
          setSaveState('saved')
        } catch {
          savePendingFreeTest(payload)
          setSaveState('error')
        }
      })()
    } else {
      savePendingFreeTest(payload)
      setSaveState('pending-signup')
    }
  }, [phase, results, isAuthenticated, getAccessTokenSilently, total])

  const goToSignup = () => loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } })

  return (
    <div className="crackjee-root">
      <div style={{ borderBottom: `1px solid ${PAPER_LINE}` }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', maxWidth: 720, margin: '0 auto' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: fontDisplay, fontWeight: 700, fontSize: 20, color: INK }}>Jee<span style={{ color: AMBER }}>X</span></button>
        </div>
      </div>

      {/* STORY */}
      {phase === 'story' && (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 60px', textAlign: 'center', animation: 'cj-fadeUp 0.5s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}><PichaiBadge /></div>
          <span style={{ fontFamily: fontMono, fontSize: 14, color: '#9a6a1c', fontWeight: 600 }}>1989.</span>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE, margin: '16px 0 0' }}>A young student from Chennai was preparing for one of India's toughest engineering entrance examinations.</p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE, margin: '12px 0 0' }}>His name was <strong style={{ color: INK }}>Sundar Pichai.</strong></p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE, margin: '12px 0 0' }}>He would go on to join IIT Kharagpur.</p>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: SLATE, margin: '12px 0 0' }}>Decades later, he would become the CEO of Google and Alphabet.</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: '#8a8578', margin: '12px 0 0' }}>But before all of that — before Google, before Silicon Valley —</p>
          <p style={{ fontSize: 18, lineHeight: 1.5, color: INK, fontWeight: 600, margin: '16px 0 0', fontFamily: fontDisplay }}>he was simply a student sitting in front of a question paper.</p>

          <div style={{ height: 1, background: PAPER_LINE, margin: '32px auto', width: 80 }} />

          <h2 style={{ fontSize: 26, fontWeight: 700, color: INK, letterSpacing: '0.02em', margin: '0 0 12px' }}>YOUR TURN.</h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: SLATE, margin: '0 0 6px' }}>The following 10 questions are inspired by the concepts and difficulty of the IIT entrance examinations of that era.</p>
          <p style={{ fontSize: 12.5, color: '#8a8578', fontStyle: 'italic', margin: '0 0 22px' }}>Inspired by the IIT entrance era of 1989 — not the actual paper he sat.</p>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 26 }}>
            <span style={chip()}><span style={dot(AMBER)} />10 questions</span>
            <span style={chip()}><span style={dot(AMBER)} />30 seconds each</span>
            <span style={chip()}><span style={dot(PHYSICS)} />Physics</span>
            <span style={chip()}><span style={dot(CHEM)} />Chemistry</span>
            <span style={chip()}><span style={dot(MATHS)} />Mathematics</span>
          </div>

          <button onClick={beginTest} style={{ ...primaryBtn, fontSize: 15 }}>Start question 1 <ArrowRight size={16} /></button>
        </div>
      )}

      {/* QUESTION */}
      {phase === 'question' && (
        <div key={question.id} style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 60px', animation: 'cj-slideLeft 0.3s ease' }}>
          <div style={{ height: 5, borderRadius: 3, background: PAPER_LINE, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ height: '100%', width: `${(index / total) * 100}%`, background: AMBER, transition: 'width 0.3s' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontFamily: fontMono, fontSize: 12.5, color: SLATE, fontWeight: 500 }}>Question {index + 1} of {total}</span>
            <Timer seconds={timeLeft} />
          </div>

          <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: SUBJECT_COLOR[question.subject] }}>{question.subject} · {question.topic}</span>
          <h2 style={{ fontSize: 21, lineHeight: 1.45, fontWeight: 600, color: INK, margin: '10px 0 22px' }}>{question.question}</h2>

          <div style={{ display: 'grid', gap: 10 }}>
            {question.options.map((opt, i) => {
              const isSelected = selected === i
              const isCorrect = i === question.correctAnswer
              let bg = WHITE, border = PAPER_LINE, textCol = GRAPHITE
              if (revealed) {
                if (isCorrect) { bg = 'rgba(46,125,79,0.08)'; border = GOOD; textCol = '#1F5C39' }
                else if (isSelected) { bg = 'rgba(180,64,42,0.08)'; border = BAD; textCol = '#92321E' }
              } else if (isSelected) { bg = 'rgba(232,163,61,0.1)'; border = AMBER }
              return (
                <button key={i} disabled={revealed} onClick={() => setSelected(i)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 6, background: bg, border: `1px solid ${border}`, cursor: revealed ? 'default' : 'pointer', transition: 'all 0.15s', textAlign: 'left', fontSize: 15, color: textCol, fontWeight: isSelected || (revealed && isCorrect) ? 600 : 400 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: PAPER, border: `1px solid ${revealed && isCorrect ? GOOD : revealed && isSelected ? BAD : isSelected ? AMBER : PAPER_LINE}`, color: SLATE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, fontFamily: fontMono }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex: 1 }}>{opt}</span>
                  {revealed && isCorrect && <Check size={17} color={GOOD} />}
                  {revealed && isSelected && !isCorrect && <XIcon size={17} color={BAD} />}
                </button>
              )
            })}
          </div>

          {!revealed ? (
            <button onClick={() => submitAnswer(selected)} disabled={selected === null}
              style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: 20, opacity: selected === null ? 0.5 : 1, cursor: selected === null ? 'default' : 'pointer' }}>
              Submit answer
            </button>
          ) : (
            <div style={{ marginTop: 18, padding: '18px', borderRadius: 6, background: WHITE, border: `1px solid ${PAPER_LINE}`, animation: 'cj-pop 0.3s ease' }}>
              {selected === null && <p style={{ fontSize: 13.5, color: BAD, fontWeight: 600, margin: '0 0 8px' }}>Time's up — this question was marked unanswered.</p>}
              <p style={{ fontSize: 11.5, fontWeight: 700, color: '#9a6a1c', letterSpacing: '0.05em', margin: '0 0 6px', fontFamily: fontMono }}>EXPLANATION</p>
              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: SLATE, margin: 0 }}>{question.explanation}</p>
              <button onClick={goToNext} style={{ ...inkBtn, marginTop: 16 }}>
                {index === total - 1 ? 'See your results' : 'Next question'} <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && results && (
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 60px', textAlign: 'center', animation: 'cj-fadeUp 0.5s ease' }}>
          <span style={{ fontFamily: fontMono, fontSize: 12.5, color: '#9a6a1c', fontWeight: 600, letterSpacing: '0.1em' }}>TEST COMPLETE</span>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '18px 0 20px' }}>
            {[
              { l: 'Score', v: `${results.score} / ${total}`, c: AMBER },
              { l: 'Accuracy', v: `${results.accuracy}%`, c: PHYSICS },
              { l: 'Avg. time / q', v: `${results.avgTime}s`, c: CHEM },
            ].map((s) => (
              <div key={s.l} style={{ ...card, padding: '18px 12px' }}>
                <div style={{ fontSize: 10.5, color: SLATE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.l}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.c, marginTop: 5, fontFamily: fontMono }}>{s.v}</div>
              </div>
            ))}
          </div>

          <div style={{ ...card, padding: '10px 20px', textAlign: 'left', marginBottom: 22 }}>
            {Object.entries(results.bySubject).map(([subject, s], i, arr) => (
              <div key={subject} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0ede2' : 'none' }}>
                <span style={dot(SUBJECT_COLOR[subject])} />
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500, color: GRAPHITE }}>{subject}</span>
                <span style={{ fontFamily: fontMono, fontSize: 14, fontWeight: 600, color: SLATE }}>{s.correct} / {s.total}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 14.5, lineHeight: 1.7, color: SLATE, marginBottom: 24 }}>
            <p style={{ margin: 0 }}>In 1989, Sundar Pichai was a student beginning his journey.</p>
            <p style={{ margin: '4px 0 0' }}>Today, you took the first step in yours.</p>
            <p style={{ margin: '10px 0 0', fontWeight: 600, color: INK, fontFamily: fontDisplay }}>Every question you solve brings you closer to the future you want to build.</p>
          </div>

          {isAuthenticated ? (
            <>
              {saveState === 'saving' && <p style={{ fontSize: 13, color: SLATE, marginBottom: 12 }}>Saving your result…</p>}
              {saveState === 'saved' && <p style={{ fontSize: 13, color: GOOD, fontWeight: 600, marginBottom: 12 }}>Saved to your dashboard.</p>}
              {saveState === 'error' && <p style={{ fontSize: 13, color: '#9a6a1c', fontWeight: 600, marginBottom: 12 }}>Couldn't save automatically — finish setting up your profile and it'll appear in your dashboard.</p>}
              <button onClick={() => navigate('/dashboard')} style={primaryBtn}>Go to your dashboard <ArrowRight size={16} /></button>
            </>
          ) : (
            <>
              <button onClick={goToSignup} style={primaryBtn}>Create your free account to save this result <ArrowRight size={16} /></button>
              <p style={{ fontSize: 12.5, color: '#8a8578', marginTop: 12 }}>Unlocks full mock tests, rank tracking, and topic-level analysis.</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
