import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import MockTest from './pages/MockTest.jsx'
import Analysis from './pages/Analysis.jsx'
import Buddy from './pages/Buddy.jsx'
import FreeTest from './pages/FreeTest.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/free-test" element={<FreeTest />} />
      <Route
        path="/test"
        element={
          <ProtectedRoute>
            <MockTest />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute>
            <Analysis />
          </ProtectedRoute>
        }
      />
      <Route
        path="/buddy"
        element={
          <ProtectedRoute>
            <Buddy />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
