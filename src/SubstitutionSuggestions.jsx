import { useState } from 'react'
import { playerPositions, suggestSubstitutions } from './substitutionSuggestions.js'

export default function SubstitutionSuggestions({ plan, halves, halfIndex, position, history, update }) {
  const [open, setOpen] = useState(false)
  const [goal, setGoal] = useState('balanced')
  const suggestions = open ? suggestSubstitutions(plan, halves, halfIndex, position, history, goal) : []
  const setPosition = (id, field, value) => update({ squad: plan.squad.map(player => String(player.id) === String(id) ? { ...player, [field]: value } : player) })
  function accept(suggestion) {
    const entry = { id: crypto.randomUUID(), half: halfIndex, position, in: String(suggestion.player.id), out: String(suggestion.outgoing.id) }
    const accepted = [...(plan.acceptedSuggestions || []).filter(item => item.half !== halfIndex || item.position !== position), entry]
    update({ halves: halves.map((half, index) => index === halfIndex ? { ...half, replacements: { ...half.replacements, [position]: entry.in } } : half), acceptedSuggestions: accepted })
    setOpen(false)
  }
  return <div className="mp-suggestions">
    <button type="button" className="secondary-button" disabled={!halves[halfIndex].starters[position]} aria-expanded={open} onClick={() => setOpen(!open)}>✦ Cserejavaslat · {position}</button>
    {open && <><label>Ajánlás célja<select value={goal} onChange={event => setGoal(event.target.value)}><option value="balanced">Egyenletes játékidő</option><option value="position">Elsődleges poszt előnyben</option></select></label><p>A félidő közepére ajánlunk cserét. Csak megfelelő posztú kispados kerülhet a helyére.</p>{suggestions.length ? suggestions.map(suggestion => <div className="mp-suggestion" key={suggestion.player.id}><strong>{suggestion.outgoing.name} → {suggestion.player.name}</strong><p>{suggestion.reason}</p><button type="button" className="secondary-button" onClick={() => accept(suggestion)}>Javaslat elfogadása</button></div>) : <p role="status">Nincs megfelelő posztú cserejátékos. Ellenőrizd a játékosok posztjait alább.</p>}</>}
    <details className="mp-minutes"><summary>Játékosok posztjai a meccstervben</summary><p>Az elsődleges posztot a csapatból vesszük át. Itt pontosíthatod, és másodlagos posztot is megadhatsz. A beállítások az új meccsre másolt tervvel is átkerülnek.</p>{plan.squad.map(player => <div className="mp-grid" key={player.id}><strong>{player.name}</strong>{[['position', 'Elsődleges poszt'], ['secondaryPosition', 'Másodlagos poszt']].map(([field, label]) => <label key={field}>{label}<select value={player[field] || ''} onChange={event => setPosition(player.id, field, event.target.value)}><option value="">Nincs megadva</option>{player[field] && !playerPositions.includes(player[field]) && <option value={player[field]}>{player[field]}</option>}{playerPositions.map(name => <option key={name}>{name}</option>)}</select></label>)}</div>)}</details>
  </div>
}
