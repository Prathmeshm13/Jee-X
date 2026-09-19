import { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { dailyQuestionService } from '../lib/dailyQuestion.js'

const CALENDAR_DAYS = 182

// A GitHub/LeetCode-style contribution heatmap of daily-question activity, built
// from GET /api/daily-question/calendar. Weeks run left (oldest) to right
// (this week), Sunday at the top of each column.
function buildWeeks(activityDates, today) {
  const activeSet = new Set(activityDates)
  const start = new Date(today)
  start.setDate(start.getDate() - (CALENDAR_DAYS - 1))
  start.setDate(start.getDate() - start.getDay()) // back up to the preceding Sunday

  const weeks = []
  const cursor = new Date(start)
  while (cursor <= today) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const iso = cursor.toISOString().slice(0, 10)
      week.push({ date: iso, active: activeSet.has(iso), future: cursor > today })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export default function StreakCalendar() {
  const { getAccessTokenSilently } = useAuth0()
  const [state, setState] = useState('loading') // loading | ready | error
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const token = await getAccessTokenSilently()
        const res = await dailyQuestionService.getCalendar(token)
        if (!cancelled) {
          setData(res)
          setState('ready')
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setState('error')
        }
      }
    })()
    return () => { cancelled = true }
  }, [getAccessTokenSilently])

  if (state === 'loading') {
    return (
      <div className="panel">
        <h2 className="panel-title">Daily streak</h2>
        <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="spin" aria-hidden="true" />Loading your streak
        </p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="panel">
        <h2 className="panel-title">Daily streak</h2>
        <p className="alert" role="alert">{error || "Couldn't load your streak."}</p>
      </div>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weeks = buildWeeks(data.activity_dates, today)

  return (
    <div className="panel">
      <h2 className="panel-title">Daily streak</h2>

      <div className="stats" style={{ marginBottom: 18 }}>
        <div className="stat">
          <div className="stat-value">{data.current_streak}</div>
          <div className="stat-label">Current streak</div>
        </div>
        <div className="stat">
          <div className="stat-value">{data.longest_streak}</div>
          <div className="stat-label">Longest streak</div>
        </div>
      </div>

      <div className="streak-grid-scroll">
        <div className="streak-grid">
          {weeks.map((week, wi) => (
            <div key={wi} className="streak-col">
              {week.map((day) => (
                <span
                  key={day.date}
                  className="streak-cell"
                  data-active={day.active ? 'true' : undefined}
                  data-future={day.future ? 'true' : undefined}
                  title={day.future ? undefined : `${day.date}${day.active ? ' — solved' : ' — not solved'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="faint streak-legend">
        <span className="streak-cell" />
        <span>Less</span>
        <span className="streak-cell" data-active="true" />
        <span>Solved</span>
      </div>
    </div>
  )
}
