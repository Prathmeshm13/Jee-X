import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Pencil, Check, X } from 'lucide-react'
import { api } from '../lib/api.js'
import { useCrackJeeStyles } from '../crackjee/screens.jsx'
import { card, label, input, primaryBtn, ghostBtn, hintOk, hintErr, hint, AMBER, INK, BAD } from '../crackjee/ui.js'

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

export default function Profile() {
  useCrackJeeStyles()
  const { getAccessTokenSilently, user, logout } = useAuth0()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(null)
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessTokenSilently()
        const me = await api.me(token)
        if (!me.onboarded) {
          navigate('/onboarding', { replace: true })
          return
        }
        setProfile(me.profile)
        setForm(me.profile)
      } catch {
        navigate('/onboarding', { replace: true })
      } finally {
        setLoading(false)
      }
    })()
  }, [getAccessTokenSilently, navigate])

  const handleUsernameChange = (value) => {
    const clean = value.replace(/\s/g, '').toLowerCase()
    setForm((f) => ({ ...f, username: clean }))
    setSaved(false)

    if (clean === profile.username) {
      setUsernameStatus('unchanged')
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (clean.length < 3 || !/^[a-z0-9_]{3,20}$/.test(clean)) {
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

  const startEditing = () => {
    setForm(profile)
    setUsernameStatus('unchanged')
    setError('')
    setSaved(false)
    setEditing(true)
  }

  const cancelEditing = () => {
    setForm(profile)
    setEditing(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setError('Please fix the username before saving.')
      return
    }
    setSaving(true)
    try {
      const token = await getAccessTokenSilently()
      const updated = await api.updateProfile(token, form)
      setProfile(updated)
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !profile) return <div className="centered-screen">Loading your profile…</div>

  const readField = (l, v) => (
    <div>
      <div style={{ fontSize: 11, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginTop: 4 }}>{v}</div>
    </div>
  )

  return (
    <div className="crackjee-root" style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: '#9a6a1c', fontWeight: 600, letterSpacing: '0.14em', fontFamily: "'JetBrains Mono', monospace" }}>PROFILE</div>
          <h2 style={{ margin: '6px 0 0', fontSize: 22, fontWeight: 700, color: INK }}>Your profile</h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => navigate('/dashboard')} style={{ ...ghostBtn, padding: '8px 16px', fontSize: 12.5 }}>Dashboard</button>
          <button onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            style={{ ...ghostBtn, padding: '8px 16px', fontSize: 12.5, color: BAD, border: `1px solid ${BAD}55` }}>Log out</button>
        </div>
      </div>

      <div style={card}>
        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: 8, background: AMBER, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK, fontWeight: 700, fontSize: 22, fontFamily: "'JetBrains Mono', monospace" }}>
            {initials(profile.name)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: INK }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: '#888' }}>@{profile.username}</div>
          </div>
          {!editing && (
            <button onClick={startEditing} style={{ ...ghostBtn, padding: '8px 16px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Pencil size={14} /> Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 18 }}>
            {readField('Email', user?.email || '—')}
            {readField('Date of birth', profile.dob)}
            {readField('Class', profile.class_level === 'dropper' ? 'Dropper' : `Class ${profile.class_level}`)}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="p-name">Full name</label>
              <input id="p-name" type="text" style={input} value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setSaved(false) }} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="p-username">Username</label>
              <input id="p-username" type="text" style={input} value={form.username}
                onChange={(e) => handleUsernameChange(e.target.value)} required />
              {usernameStatus === 'checking' && <p style={hint}>Checking availability…</p>}
              {usernameStatus === 'available' && <p style={hintOk}>@{form.username} is available.</p>}
              {usernameStatus === 'taken' && <p style={hintErr}>That username is already taken.</p>}
              {usernameStatus === 'invalid' && <p style={hintErr}>3-20 characters: letters, numbers, underscore only.</p>}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={label} htmlFor="p-dob">Date of birth</label>
              <input id="p-dob" type="date" style={input} value={form.dob}
                onChange={(e) => { setForm((f) => ({ ...f, dob: e.target.value })); setSaved(false) }} required />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={label} htmlFor="p-class">Class</label>
              <select id="p-class" style={input} value={form.class_level}
                onChange={(e) => { setForm((f) => ({ ...f, class_level: e.target.value })); setSaved(false) }}>
                <option value="11">Class 11</option>
                <option value="12">Class 12</option>
                <option value="dropper">Dropper</option>
              </select>
            </div>

            {error && <p style={{ ...hintErr, marginBottom: 14 }}>{error}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" style={{ ...primaryBtn, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                <Check size={15} /> {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={cancelEditing} disabled={saving}>
                <X size={15} /> Cancel
              </button>
            </div>
          </form>
        )}

        {saved && !editing && <p style={{ ...hintOk, marginTop: 18 }}>Profile updated.</p>}
      </div>
    </div>
  )
}
