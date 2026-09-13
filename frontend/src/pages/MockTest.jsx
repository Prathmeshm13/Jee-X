import { useNavigate } from 'react-router-dom'
import { TestInterface, useCrackJeeStyles } from '../crackjee/screens.jsx'

// Full 75-question NTA-pattern mock. On submit, the computed result is handed
// to /analysis via router state, where it's rendered and POSTed to the backend.
export default function MockTest() {
  useCrackJeeStyles()
  const navigate = useNavigate()

  return (
    <div className="crackjee-root">
      <TestInterface
        onBack={() => navigate('/')}
        onFinish={(result) => navigate('/analysis', { state: { result } })}
      />
    </div>
  )
}
