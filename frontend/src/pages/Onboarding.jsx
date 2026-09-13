import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { api } from '../lib/api.js'
import { readPendingFreeTest, clearPendingFreeTest } from '../lib/pendingFreeTest.js'
import { useCrackJeeStyles } from '../crackjee/screens.jsx'
import { card, label, input, primaryBtn, hintOk, hintErr, hint, AMBER, INK, PAPER_LINE, SLATE, fontDisplay } from '../crackjee/ui.js'

export default function Onboarding() {
  useCrackJeeStyles()
  const { getAccessTokenSilently, user } = useAuth0()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    username: '',
    dob: '',
    class_level: '11',
  })
  const [usernameStatus, setUsernameStatus] = useState(null) // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const debounceRef = useRef(null)

  // Redirect straight to the dashboard if this account already has a profile.
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessTokenSilently()
        const me = await api.me(token)
        if (me.onboarded) navigate('/dashboard', { replace: true })
      } catch {
        // ignore — user can still fill the form
      }
    })()
  }, [getAccessTokenSilently, navigate])

  const handleUsernameChange = (value) => {
    const clean = value.replace(/\s/g, '').toLowerCase()
    setForm((f) => ({ ...f, username: clean }))

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (clean.length < 3) {
      setUsernameStatus(clean.length === 0 ? null : 'invalid')
      return
    }
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.checkUsername(clean)
        setUsernameStatus(res.available ? 'available' : 'taken')
      } catch {
        setUsernameStatus(null)
      }
    }, 400)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (usernameStatus !== 'available') {
      setError('Please choose an available username before continuing.')
      return
    }

    setSubmitting(true)
    try {
      const token = await getAccessTokenSilently()
      await api.onboard(token, form)

      const pending = readPendingFreeTest()
      if (pending) {
        const { savedAt, ...payload } = pending
        try {
          await api.submitTestAttempt(token, payload)
        } catch {
          // Non-fatal — don't block getting into the app over this.
        } finally {
          clearPendingFreeTest()
        }
      }

      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="crackjee-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ ...card, maxWidth: 460, width: '100%', padding: '32px 30px' }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{ fontFamily: fontDisplay, fontWeight: 700, fontSize: 20, color: INK }}>Jee<span style={{ color: AMBER }}>X</span></span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 6px', color: INK }}>Set up your profile</h1>
        <p style={{ fontSize: 14.5, color: SLATE, lineHeight: 1.6, margin: '0 0 22px' }}>This takes under a minute — it's how we personalise your mocks and rank you against other aspirants.</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={label} htmlFor="name">Full name</label>
            <input id="name" type="text" style={input} value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Rahul Sharma" required />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label} htmlFor="username">Username</label>
            <input id="username" type="text" style={input} value={form.username}
              onChange={(e) => handleUsernameChange(e.target.value)} placeholder="rahul_23" required />
            {usernameStatus === 'checking' && <p style={hint}>Checking availability…</p>}
            {usernameStatus === 'available' && <p style={hintOk}>@{form.username} is available.</p>}
            {usernameStatus === 'taken' && <p style={hintErr}>That username is already taken.</p>}
            {usernameStatus === 'invalid' && <p style={hintErr}>3-20 characters: letters, numbers, underscore only.</p>}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label} htmlFor="dob">Date of birth</label>
            <input id="dob" type="date" style={input} value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))} required />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={label} htmlFor="class_level">Class</label>
            <select id="class_level" style={input} value={form.class_level}
              onChange={(e) => setForm((f) => ({ ...f, class_level: e.target.value }))}>
              <option value="11">Class 11</option>
              <option value="12">Class 12</option>
              <option value="dropper">Dropper</option>
            </select>
          </div>

          {error && <p style={{ ...hintErr, marginBottom: 14 }}>{error}</p>}

          <button type="submit" style={{ ...primaryBtn, width: '100%', opacity: submitting ? 0.7 : 1 }} disabled={submitting}>
            {submitting ? 'Saving…' : 'Continue to dashboard'}
          </button>
        </form>
      </div>
    </div>
  )
}
