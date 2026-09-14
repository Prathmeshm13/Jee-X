import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { Loader } from './Brand.jsx'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect()
    }
  }, [isLoading, isAuthenticated, loginWithRedirect])

  if (isLoading || !isAuthenticated) {
    return <Loader fullScreen label="Checking your session" />
  }

  return children
}
