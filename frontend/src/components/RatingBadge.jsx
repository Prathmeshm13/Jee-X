import { Flame, Compass, Swords, Medal, GraduationCap, Shield, Star, Award, Crown, Gem } from 'lucide-react'
import '../ranking.css'

const ICONS = [Flame, Compass, Swords, Medal, GraduationCap, Shield, Star, Award, Crown, Gem]

// One hexagonal tier badge (0 = Aspirant ... 9 = Legend). Shared between the
// Ranking page's hero/history/grid and the Profile page's rating summary card.
export default function RatingBadge({ index, size = 28 }) {
  const Icon = ICONS[index] || Shield
  return <span className={`rating-badge badge-${index}`}><Icon size={size} strokeWidth={1.6} /></span>
}
