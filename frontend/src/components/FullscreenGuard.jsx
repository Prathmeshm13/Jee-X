// Blocking prompt shown when a student leaves full-screen mid-test (Esc,
// alt-tab, etc). Browsers won't let JS re-enter full-screen without a fresh
// click, so this can't auto-resume — it asks for one.
export default function FullscreenGuard({ exited, onResume }) {
  if (!exited) return null
  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="fs-guard-title">
      <div className="modal">
        <h2 id="fs-guard-title">You've left full-screen</h2>
        <p>This test runs in full-screen. Resume to keep going — your answers and the timer are unaffected.</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onResume}>Resume test</button>
        </div>
      </div>
    </div>
  )
}
