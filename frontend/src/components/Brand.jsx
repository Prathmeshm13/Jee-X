import { Link } from 'react-router-dom'

// The JeeX mark: four squares from the exam's question palette
// (answered, marked for review, not visited, not answered).
export function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  )
}

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo" aria-label="JeeX home">
      <LogoMark />
      <span>JeeX</span>
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
