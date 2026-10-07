import { playingMinutes } from './matchPlan'

export default function MatchMinutes({ plan, halves }) {
  const minutes = playingMinutes(plan, halves)
  return <details className="mp-minutes">
    <summary>Tervezett játékpercek</summary>
    <div className="mp-table-scroll"><table className="mp-minutes-table"><thead><tr><th>Játékos</th><th>Pályán</th><th>Kispadon</th></tr></thead><tbody>{plan.squad.map(player => <tr key={player.id}><td>{player.name}</td><td>{minutes[String(player.id)] || 0} perc</td><td>{plan.duration - (minutes[String(player.id)] || 0)} perc</td></tr>)}</tbody></table></div>
  </details>
}
