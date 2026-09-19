import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import App from './App.jsx'
import './index.css'
import './refinement.css'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

function AuthProvider({ children }) {
  const navigate = useNavigate()
  return <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{ redirect_uri: window.location.origin, audience }}
    onRedirectCallback={(appState) => {
      const destination = appState?.returnTo
      navigate(typeof destination === 'string' && destination.startsWith('/') && !destination.startsWith('//') ? destination : '/dashboard', { replace: true })
    }}
    cacheLocation="localstorage"
  >{children}</Auth0Provider>
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider><App /></AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
