import { useNavigate, useLocation } from 'react-router-dom'
import { AIBuddy, useCrackJeeStyles } from '../crackjee/screens.jsx'

// AI study buddy. If reached from the analysis screen, it receives the latest
// mock result so it can answer "how did I do?" / "weak chapters" with real data.
export default function Buddy() {
  useCrackJeeStyles()
  const navigate = useNavigate()
  const { state } = useLocation()

  return (
    <div className="crackjee-root">
      <AIBuddy result={state?.result} onHome={() => navigate('/dashboard')} />
    </div>
  )
}
