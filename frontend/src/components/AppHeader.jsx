import { NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { Logo } from './Brand.jsx'

const LINKS = [
  ['/dashboard', 'Dashboard'],
  ['/subject-test', 'Subject tests'],
  ['/buddy', 'Assistant'],
  ['/profile', 'Profile'],
]

// Top bar for signed-in pages.
export default function AppHeader() {
  const { logout } = useAuth0()
  return (
    <header className="appbar">
      <div className="wrap appbar-row">
        <Logo to="/dashboard" />
        <nav className="appnav" aria-label="Main">
          {LINKS.map(([to, text]) => (
            <NavLink key={to} to={to} className={({ isActive }) => 'navlink' + (isActive ? ' active' : '')}>
              {text}
            </NavLink>
          ))}
        </nav>
        <button type="button" className="btn btn-quiet btn-sm"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
          Log out
        </button>
      </div>
    </header>
  )
}
