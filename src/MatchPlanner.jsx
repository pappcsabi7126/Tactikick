import { useState } from 'react'
import { readMatchPlan, getHalves, removePlayerFromHalf } from './matchPlan'
import MatchHalves from './MatchHalves'
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
  const halves = getHalves(plan)
  const guests = matches.flatMap((item) => readMatchPlan(item).squad).filter((player) => player.guest)
  const available = [...new Map([...guests, ...players].map((player) => [String(player.id), player])).values()]
  const candidates = available.filter((player) => (source === 'all' || (source === 'guest' ? player.guest || !player.teamId : String(player.teamId) === source)) && player.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')))
  const update = (changes) => { onSave({ ...plan, halves, ...changes }) }
  function toggle(player) {
    const id = String(player.id)
    if (plan.squad.some((item) => String(item.id) === id)) {
      update({ halves: halves.map((half) => removePlayerFromHalf(half, id)), squad: plan.squad.filter((item) => String(item.id) !== id), starters: Object.fromEntries(Object.entries(plan.starters).filter(([, value]) => value !== id)), substitutions: plan.substitutions.filter((item) => item.in !== id && item.out !== id) })
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
  return <>
    <section className="mp-card"><h2>1. Meccskeret · {plan.squad.length} játékos</h2><p>A kiválasztás csak erre a mérkőzésre vonatkozik, a játékos csapata megmarad. A változtatások automatikusan a meccshez kerülnek.</p>
      <div className="mp-grid"><label>Játékosok innen<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Minden csapat és vendégjátékos</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} {team.age}</option>)}<option value="guest">Csapat nélküli / vendégjátékosok</option></select></label><label>Keresés<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Játékos neve" /></label></div>
      <div className="mp-players">{candidates.map((player) => <label className="mp-player" key={player.id}><input type="checkbox" checked={plan.squad.some((item) => String(item.id) === String(player.id))} onChange={() => toggle(player)} /><span><strong>{player.name}</strong><small>{player.guest ? `Vendég · ${player.age || 'Korosztály nélkül'}` : teams.find((team) => team.id === player.teamId)?.name || 'Csapat nélkül'}</small></span></label>)}</div>
      {!candidates.length && <p>Nincs találat. Új vendégjátékost alább vehetsz fel.</p>}
      <form className="mp-grid" onSubmit={addGuest}><label>Új vendégjátékos neve<input name="name" required /></label><label>Korosztály<input name="age" placeholder="Pl. U11" required /></label><button type="submit">Felvétel a keretbe</button></form>
    </section>
    <MatchHalves match={match} plan={plan} halves={halves} update={update} teamName={teams.find((team) => team.id === match.teamId)?.name || ""} />
  </>
}
