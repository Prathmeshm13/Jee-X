import { useLocation } from 'react-router-dom'
import { AIBuddy } from '../crackjee/screens.jsx'
import AppHeader from '../components/AppHeader.jsx'

// AI study buddy. If reached from the analysis screen, it receives the latest
// mock result so it can answer "how did I do?" / "weak chapters" with real data.
export default function Buddy() {
  const { state } = useLocation()

  return (
    <div className="crackjee-root app-fill">
      <AppHeader />
      <AIBuddy result={state?.result} />
    </div>
  )
}
