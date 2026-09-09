import { useState } from 'react'
import { readMatchPlan, getHalves, removePlayerFromHalf } from './matchPlan'
import MatchHalves from './MatchHalves'
import './match-planner.css'

export default function MatchPlanner({ teams, players, trainings, setTrainings, initialMatchId = '', initialEdit = false }) {
  const matches = trainings.filter((item) => item.calendarType === 'match').sort((a, b) => b.date.localeCompare(a.date))
  const [selectedId, setSelectedId] = useState(initialMatchId)
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(initialEdit ? initialMatchId : null)
  const selected = matches.find((match) => String(match.id) === String(selectedId)) || matches[0]
  function saveMatchDetails(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const team = teams.find((item) => String(item.id) === data.get('team'))
    const title = data.get('title').trim()
    if (!team || !title || !data.get('date') || !data.get('time')) return
    setTrainings((current) => current.map((match) => match.id === editingId
      ? { ...match, title, teamId: team.id, color: team.color, date: data.get('date'), startTime: data.get('time') }
      : match))
    setSelectedId(String(editingId))
    setEditingId(null)
  }
  function createMatch(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const team = teams.find((item) => String(item.id) === data.get('team'))
    if (!team || !data.get('title').trim()) return
    const match = { id: Date.now(), teamId: team.id, title: data.get('title').trim(), date: data.get('date'), startTime: data.get('time'), color: team.color, calendarType: 'match', plan: [], attendance: {} }
    setTrainings((current) => [...current, match])
    setSelectedId(String(match.id))
    event.currentTarget.reset()
    setShowCreate(false)
  }
  return <div className="page match-planner">
    <div className="hero-header"><div><div className="eyebrow">TACTIKICK · MÉRKŐZÉSEK</div><h1>Meccstervező</h1><p>A kerettől a kezdő sípszóig.</p></div><button type="button" className="neon-button" aria-expanded={showCreate || !matches.length} onClick={() => setShowCreate(!showCreate)}>+ Új mérkőzés</button></div>
    {(showCreate || !matches.length) && <section className="mp-card"><div className="mp-section-heading"><h2>Új mérkőzés</h2>{matches.length > 0 && <button type="button" onClick={() => setShowCreate(false)}>Mégse</button>}</div>
      {!teams.length ? <p>Először hozz létre egy csapatot a Csapatok menüben.</p> : <form className="mp-grid" onSubmit={createMatch}>
        <label>Csapat<select name="team">{teams.map((team) => <option key={team.id} value={team.id}>{team.name} {team.age}</option>)}</select></label>
        <label>Mérkőzés / ellenfél<input name="title" required placeholder="Pl. U13 – Diósd" /></label>
        <label>Dátum<input name="date" type="date" required /></label><label>Kezdés<input name="time" type="time" required defaultValue="10:00" /></label>
        <button className="neon-button" type="submit">Meccs létrehozása</button>
      </form>}
    </section>}
    {!matches.length && <div className="mp-empty"><span aria-hidden="true">◎</span><h2>Innen indul a meccsterved</h2><p>Hozz létre egy mérkőzést, válaszd ki a keretet, majd állítsd össze a két félidőt.</p></div>}
    {matches.length > 0 && <div className="mp-workspace">
      <aside className="mp-match-list"><div className="mp-section-heading"><h2>Mérkőzések</h2><span>{matches.length}</span></div><nav aria-label="Mérkőzés kiválasztása">{matches.map((match) => <button type="button" className={`mp-match-option ${selected?.id === match.id ? 'is-selected' : ''}`} key={match.id} aria-current={selected?.id === match.id ? 'true' : undefined} onClick={() => { setSelectedId(String(match.id)); setEditingId(null) }}><small>{match.date} · {match.startTime || '–'}</small><strong>{match.title}</strong><span>{teams.find((team) => team.id === match.teamId)?.name}</span></button>)}</nav></aside>
      <div className="mp-workspace-main">{selected && <><div className="mp-match-heading"><div><div className="eyebrow">{teams.find((team) => team.id === selected.teamId)?.name || 'MÉRKŐZÉS'}</div><h2>{selected.title}</h2><p>{selected.date} <span>·</span> {selected.startTime || 'Kezdés nincs megadva'}</p></div><button type="button" aria-expanded={editingId === selected.id} onClick={() => setEditingId(editingId === selected.id ? null : selected.id)}>✎ Meccs szerkesztése</button></div>
      {editingId === selected.id && <section className="mp-card" aria-label="Meccs szerkesztése"><h2>Meccs adatai</h2><form key={selected.id} className="mp-grid" onSubmit={saveMatchDetails}>
        <label>Csapat<select name="team" required defaultValue={String(selected.teamId)}>{!teams.some((team) => team.id === selected.teamId) && <option value="">Válassz csapatot</option>}{teams.map((team) => <option key={team.id} value={String(team.id)}>{team.name} {team.age}</option>)}</select></label>
        <label>Mérkőzés / ellenfél<input name="title" required pattern=".*\S.*" defaultValue={selected.title || ''} autoFocus /></label>
        <label>Dátum<input name="date" type="date" required defaultValue={selected.date || ''} /></label>
        <label>Kezdés<input name="time" type="time" required defaultValue={selected.startTime || ''} /></label>
        <button type="submit" className="neon-button">Mentés</button><button type="button" onClick={() => setEditingId(null)}>Mégse</button>
      </form></section>}
      <MatchEditor key={selected.id} match={selected} teams={teams} players={players} matches={matches} onSave={(plan) => setTrainings((current) => current.map((item) => item.id === selected.id ? { ...item, plan: [...(item.plan || []).filter((entry) => entry.kind !== 'match-lineup'), plan] } : item))} /></>}</div>
    </div>}
  </div>
}

function MatchEditor({ match, teams, players, matches, onSave }) {
  const plan = readMatchPlan(match)
  const [source, setSource] = useState('all')
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('squad')
  const halves = getHalves(plan)
  const guests = matches.flatMap((item) => readMatchPlan(item).squad).filter((player) => player.guest)
  const available = [...new Map([...guests, ...players].map((player) => [String(player.id), player])).values()]
  const candidates = available.filter((player) => (source === 'all' || (source === 'guest' ? player.guest || !player.teamId : String(player.teamId) === source)) && player.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')))
  const update = (changes) => { onSave({ ...plan, halves, ...changes }) }
  function toggle(player) {
    const id = String(player.id)
    if (plan.squad.some((item) => String(item.id) === id)) {
      update({ roles: Object.fromEntries(Object.entries(plan.roles || {}).filter(([, value]) => String(value) !== id)), halves: halves.map((half) => removePlayerFromHalf(half, id)), squad: plan.squad.filter((item) => String(item.id) !== id), starters: Object.fromEntries(Object.entries(plan.starters).filter(([, value]) => value !== id)), substitutions: plan.substitutions.filter((item) => item.in !== id && item.out !== id) })
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
    <div className="mp-stage-nav" role="group" aria-label="Meccsterv nézete">{[['squad', '01', 'Meccskeret'], ['lineup', '02', 'Felállás és cserék'], ['summary', '03', 'Összegzés']].map(([id, number, label]) => <button type="button" key={id} aria-pressed={stage === id} className={stage === id ? 'is-selected' : ''} onClick={() => setStage(id)}><span>{number}</span>{label}</button>)}</div>
    {stage === 'squad' && <section className="mp-card"><div className="mp-section-heading"><div><h2>Állítsd össze a keretet</h2><p>Válassz játékosokat a csapataidból, vagy adj hozzá vendéget.</p></div><span className="mp-count">{plan.squad.length} játékos</span></div>
      {plan.squad.length > 0 && <div className="mp-squad-chips" aria-label="Kiválasztott játékosok">{plan.squad.map((player) => <button type="button" key={player.id} onClick={() => toggle(player)} aria-label={`${player.name} eltávolítása a keretből`}>{player.name} <span aria-hidden="true">×</span></button>)}</div>}
      <div className="mp-grid"><label>Játékosok innen<select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Minden csapat és vendégjátékos</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} {team.age}</option>)}<option value="guest">Csapat nélküli / vendégjátékosok</option></select></label><label>Keresés<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Játékos neve" /></label></div>
      <div className="mp-players">{candidates.map((player) => <label className="mp-player" key={player.id}><input type="checkbox" checked={plan.squad.some((item) => String(item.id) === String(player.id))} onChange={() => toggle(player)} /><span><strong>{player.name}</strong><small>{player.guest ? `Vendég · ${player.age || 'Korosztály nélkül'}` : teams.find((team) => team.id === player.teamId)?.name || 'Csapat nélkül'}</small></span></label>)}</div>
      {!candidates.length && <p>Nincs találat. Új vendégjátékost alább vehetsz fel.</p>}
      <details className="mp-guest"><summary>+ Vendégjátékos hozzáadása</summary><form className="mp-grid" onSubmit={addGuest}><label>Vendégjátékos neve<input name="name" required /></label><label>Korosztály<input name="age" placeholder="Pl. U11" required /></label><button type="submit">Felvétel a keretbe</button></form></details>
      <div className="mp-footer"><span>{plan.squad.length} játékos a meccskeretben</span><button type="button" className="neon-button" onClick={() => setStage('lineup')}>Tovább a felálláshoz →</button></div>
    </section>}
    {stage !== 'squad' && <MatchHalves teamAge={teams.find((team) => team.id === match.teamId)?.age} mode={stage} match={match} plan={plan} halves={halves} update={update} teamName={teams.find((team) => team.id === match.teamId)?.name || ""} />}
  </>
}
