import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Loader } from './Brand.jsx'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: location.pathname + location.search } })
    }
  }, [isLoading, isAuthenticated, loginWithRedirect, location.pathname, location.search])

  if (isLoading || !isAuthenticated) {
    return <Loader fullScreen label="Checking your session" />
  }

  return children
}
