import { Link } from 'react-router-dom'

// The Jee Edge mark.
export function LogoMark() {
  return (
    <span className="logo-monogram" aria-hidden="true">JE</span>
  )
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="Jee Edge home">
      <LogoMark />
      <span>Jee Edge</span>
    </Link>
  )
}

export function Loader({ label, fullScreen = false }) {
  return (
    <div className={fullScreen ? 'centered-screen' : 'loader'} role="status">
      <span className="loader-mark" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      <span>{label}</span>
    </div>
  )
}
