import { useEffect, useState } from 'react'

function fsElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

// Call this synchronously inside the "start test" click handler — browsers
// only grant full-screen from a direct user gesture, so it can't be deferred
// into an effect or fired after an `await`.
export function requestFullscreen(el = document.documentElement) {
  const fn = el.requestFullscreen || el.webkitRequestFullscreen
  if (!fn) return Promise.resolve()
  return fn.call(el).catch(() => {}) // denied/unsupported — the test still works, just not locked
}

export function exitFullscreen() {
  if (!fsElement()) return Promise.resolve()
  const fn = document.exitFullscreen || document.webkitExitFullscreen
  return fn ? fn.call(document).catch(() => {}) : Promise.resolve()
}

// Best-effort full-screen "lock" for test-taking screens. A browser will
// always let the student press Esc — there's no way for JS to block that —
// so this can't be a true lock. It detects an exit while `active` and hands
// back `exited` so the caller can block interaction with a resume prompt,
// and it exits full-screen automatically the moment `active` turns off
// (e.g. right when the test is submitted).
export function useFullscreenLock(active) {
  const [exited, setExited] = useState(false)

  useEffect(() => {
    if (!active) return
    const onChange = () => setExited(!fsElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [active])

  useEffect(() => {
    if (active) return
    setExited(false)
    exitFullscreen()
  }, [active])

  return { exited, resume: () => requestFullscreen().then(() => setExited(false)) }
}
