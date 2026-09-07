import { useState } from 'react'
import { formations, readMatchPlan, validateSubstitutions } from './matchPlan'
import './match-planner.css'

export default function MatchPlanner({ teams, players, trainings, setTrainings, initialMatchId = '' }) {
  const matches = trainings.filter((item) => item.calendarType === 'match').sort((a, b) => b.date.localeCompare(a.date))
  const [selectedId, setSelectedId] = useState(initialMatchId)
  const selected = matches.find((match) => String(match.id) === selectedId)
  function createMatch(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const team = teams.find((item) => String(item.id) === data.get('team'))
    if (!team || !data.get('title').trim()) return
    const match = { id: Date.now(), teamId: team.id, title: data.get('title').trim(), date: data.get('date'), startTime: data.get('time'), color: team.color, calendarType: 'match', plan: [], attendance: {} }
    setTrainings((current) => [...current, match])
    setSelectedId(String(match.id))
    event.currentTarget.reset()
  }
  return <div className="page match-planner">
    <div className="hero-header"><div><div className="eyebrow">MÉRKŐZÉS</div><h1>Meccstervező</h1><p>Kezdőcsapat, kispad és cserék — minden korosztályból.</p></div></div>
    <section className="mp-card"><h2>Új mérkőzés</h2>
      {!teams.length ? <p>Először hozz létre egy csapatot a Csapatok menüben.</p> : <form className="mp-grid" onSubmit={createMatch}>
        <label>Csapat<select name="team">{teams.map((team) => <option key={team.id} value={team.id}>{team.name} {team.age}</option>)}</select></label>
        <label>Mérkőzés / ellenfél<input name="title" required placeholder="Pl. U13 – Diósd" /></label>
        <label>Dátum<input name="date" type="date" required /></label><label>Kezdés<input name="time" type="time" required defaultValue="10:00" /></label>
        <button className="neon-button" type="submit">Meccs létrehozása</button>
      </form>}
    </section>
    <section className="mp-card"><label>Mérkőzés kiválasztása<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Válassz mérkőzést…</option>{matches.map((match) => <option key={match.id} value={match.id}>{match.date} · {match.title} · {teams.find((team) => team.id === match.teamId)?.name}</option>)}</select></label>{!matches.length && <p>Még nincs mérkőzés. A naptárban felvett meccsek is itt jelennek meg.</p>}</section>
    {selected && <MatchEditor key={selected.id} match={selected} teams={teams} players={players} matches={matches} onSave={(plan) => setTrainings((current) => current.map((item) => item.id === selected.id ? { ...item, plan: [...(item.plan || []).filter((entry) => entry.kind !== 'match-lineup'), plan] } : item))} />}
  </div>
}

function MatchEditor({ match, teams, players, matches, onSave }) {
  const plan = readMatchPlan(match)
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const [sub, setSub] = useState({ minute: '', out: '', in: '' })
  const [error, setError] = useState('')
  const guests = matches.flatMap((item) => readMatchPlan(item).squad).filter((player) => player.guest)
  const available = [...new Map([...guests, ...players].map((player) => [String(player.id), player])).values()]
  const candidates = available.filter((player) => (source === 'all' || (source === 'guest' ? player.guest || !player.teamId : String(player.teamId) === source)) && player.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')))
  const update = (changes) => { onSave({ ...plan, ...changes }); setError('') }
  function toggle(player) {
    const id = String(player.id)
    if (plan.squad.some((item) => String(item.id) === id)) {
      update({ squad: plan.squad.filter((item) => String(item.id) !== id), starters: Object.fromEntries(Object.entries(plan.starters).filter(([, value]) => value !== id)), substitutions: plan.substitutions.filter((item) => item.in !== id && item.out !== id) })
    } else update({ squad: [...plan.squad, { ...player, id }] })
  }
  function addGuest(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = data.get('name').trim()
    if (!name) return
    toggle({ id: `guest-${crypto.randomUUID()}`, name, age: data.get('age').trim(), guest: true })
    event.currentTarget.reset()
  }
  const playerOptions = plan.squad.map((player) => <option key={player.id} value={String(player.id)}>{player.name}</option>)
  const warnings = validateSubstitutions(plan)
  return <>
    <section className="mp-card"><h2>1. Meccskeret · {plan.squad.length} játékos</h2><p>A kiválasztás csak erre a mérkőzésre vonatkozik, a játékos csapata megmarad. A változtatások automatikusan a meccshez kerülnek.</p>
      <div className="mp-grid"><label>Játékosok innen<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Minden csapat és vendégjátékos</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} {team.age}</option>)}<option value="guest">Csapat nélküli / vendégjátékosok</option></select></label><label>Keresés<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Játékos neve" /></label></div>
      <div className="mp-players">{candidates.map((player) => <label className="mp-player" key={player.id}><input type="checkbox" checked={plan.squad.some((item) => String(item.id) === String(player.id))} onChange={() => toggle(player)} /><span><strong>{player.name}</strong><small>{player.guest ? `Vendég · ${player.age || 'Korosztály nélkül'}` : teams.find((team) => team.id === player.teamId)?.name || 'Csapat nélkül'}</small></span></label>)}</div>
      {!candidates.length && <p>Nincs találat. Új vendégjátékost alább vehetsz fel.</p>}
      <form className="mp-grid" onSubmit={addGuest}><label>Új vendégjátékos neve<input name="name" required /></label><label>Korosztály<input name="age" placeholder="Pl. U11" required /></label><button type="submit">Felvétel a keretbe</button></form>
    </section>
    <section className="mp-card"><h2>2. Kezdőcsapat és kispad</h2><div className="mp-grid"><label>Felállás<select value={plan.formation} onChange={(event) => update({ formation: event.target.value, starters: {}, substitutions: [] })}>{Object.keys(formations).map((name) => <option key={name}>{name}</option>)}</select></label><label>Játékidő (perc)<input type="number" min="1" max="180" value={plan.duration} onChange={(event) => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= 180) update({ duration: value }) }} /></label></div><p>Felállásváltáskor a posztok és cseretervek kiürülnek, a keret megmarad.</p>
      <div className="mp-pitch">{[...formations[plan.formation]].reverse().map((position) => <label key={position}>{position}<select aria-label={`${position} poszt`} value={plan.starters[position] || ''} onChange={(event) => { const id = event.target.value; update({ starters: { ...Object.fromEntries(Object.entries(plan.starters).filter(([, value]) => !id || value !== id)), [position]: id } }) }}><option value="">Üres poszt</option>{playerOptions}</select></label>)}</div>
      <p>K: kapus · V: védő · K a mezőnyben: középpályás · CS: csatár · SZ: szélső · B/J: bal/jobb</p>
      <h3>Kispad</h3><div className="mp-bench">{plan.squad.filter((player) => !Object.values(plan.starters).includes(String(player.id))).map((player) => <span key={player.id}>{player.name}</span>)}</div>
    </section>
    <section className="mp-card"><h2>3. Tervezett cserék</h2><form className="mp-grid" onSubmit={(event) => { event.preventDefault(); const next = { ...plan, substitutions: [...plan.substitutions, { ...sub, id: crypto.randomUUID() }] }; const errors = validateSubstitutions(next); if (errors.length) { setError(errors[0]); return } update({ substitutions: next.substitutions }); setSub({ minute: '', out: '', in: '' }) }}>
      <label>Perc<input type="number" min="1" max={plan.duration} required value={sub.minute} onChange={(event) => setSub({ ...sub, minute: event.target.value })} /></label>
      <label>Lemegy<select required value={sub.out} onChange={(event) => setSub({ ...sub, out: event.target.value })}><option value="">Válassz…</option>{playerOptions}</select></label>
      <label>Beáll<select required value={sub.in} onChange={(event) => setSub({ ...sub, in: event.target.value })}><option value="">Válassz…</option>{playerOptions}</select></label><button type="submit">Csere hozzáadása</button>
    </form>{error && <p role="alert">{error}</p>}{warnings.map((warning, index) => <p role="alert" key={index}>{warning}</p>)}
      {[...plan.substitutions].sort((a, b) => a.minute - b.minute).map((item) => <div className="mp-sub" key={item.id}><strong>{item.minute}′</strong><span>{plan.squad.find((player) => String(player.id) === item.out)?.name} → {plan.squad.find((player) => String(player.id) === item.in)?.name}</span><button type="button" onClick={() => update({ substitutions: plan.substitutions.filter((entry) => entry.id !== item.id) })}>Törlés</button></div>)}
      {!plan.substitutions.length && <p>Még nincs tervezett csere.</p>}
    </section>
  </>
}
