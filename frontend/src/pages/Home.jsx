import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { HomePage, useCrackJeeStyles } from '../crackjee/screens.jsx'

// Public landing. Nav/CTA buttons route into the app; protected routes
// (/test, /dashboard, /buddy) bounce to Auth0 login if not signed in.
export default function Home() {
  useCrackJeeStyles()
  const navigate = useNavigate()
  const { isAuthenticated, loginWithRedirect, logout } = useAuth0()
  const [streak, setStreak] = useState(0)
  const [totalSolved, setTotalSolved] = useState(0)

  return (
    <div className="crackjee-root">
      <HomePage
        isAuthenticated={isAuthenticated}
        onStart={() => navigate('/test')}
        onDashboard={() => navigate('/dashboard')}
        onBuddy={() => navigate('/buddy')}
        onFreeTest={() => navigate('/free-test')}
        onLogin={() => loginWithRedirect()}
        onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        streak={streak}
        setStreak={setStreak}
        totalSolved={totalSolved}
        setTotalSolved={setTotalSolved}
      />
    </div>
  )
}
