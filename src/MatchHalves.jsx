import { useState } from 'react'
import { formations, formationRows, quarterLineup, validateHalves, changeFormation } from './matchPlan'
import { downloadMatchPdf } from './matchPdf'

export default function MatchHalves({ match, plan, halves, update, teamName, teamAge, mode = 'lineup' }) {
  const [halfIndex, setHalfIndex] = useState(0)
  const [position, setPosition] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const half = halves[halfIndex]
  const selectedPosition = formations[half.formation].includes(position) ? position : formations[half.formation][0]
  const warnings = validateHalves(halves)
  const roster = [...plan.squad].sort((a, b) => a.name.localeCompare(b.name, 'hu'))
  const playerName = (id) => plan.squad.find((player) => String(player.id) === String(id))?.name || 'Játékos választása'
  const saveHalf = (next) => update({ halves: halves.map((current, index) => index === halfIndex ? next : current) })

  function pitch(current, interactive = false) {
    return <div className="mp-pitch"><div className="mp-pitch-center" aria-hidden="true" />{formationRows[current.formation].map((row, rowIndex) => <div className="mp-pitch-row" key={rowIndex}>{row.map((pos) => {
      const id = current.starters[pos]
      const content = <><span className="mp-shirt">{pos}</span><strong>{id ? playerName(id) : 'Üres poszt'}</strong>{current.replacements[pos] && <small>↳ {playerName(current.replacements[pos])}</small>}</>
      return interactive ? <button type="button" className={`mp-position ${selectedPosition === pos ? 'is-selected' : ''}`} key={pos} aria-pressed={selectedPosition === pos} aria-label={`${pos}: ${playerName(id)}`} onClick={() => setPosition(pos)}>{content}</button> : <div className="mp-position" key={pos}>{content}</div>
    })}</div>)}</div>
  }

  if (mode === 'summary') return <>
    <section className="mp-card"><div className="mp-section-heading"><div><h2>Készen a mérkőzésre</h2><p>{roster.length} játékos · 4 × {plan.duration / 4} perc · {teamName}</p></div><button type="button" className="neon-button" disabled={exporting || warnings.length > 0} onClick={async () => { setExporting(true); setError(''); try { await downloadMatchPdf({ match, plan, halves, teamName, teamAge }) } catch { setError('A PDF letöltése nem sikerült. Próbáld újra.') } finally { setExporting(false) } }}>{exporting ? 'PDF készítése…' : '↓ Meccsterv PDF'}</button></div>
      {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}{error && <p role="alert">{error}</p>}
      <div className="mp-summary">{halves.map((current, index) => <div key={index}><h3>{index + 1}. félidő · {current.formation}</h3>{pitch(current)}<p>Csere a {(index * 2 + 1) * plan.duration / 4}. percben.</p></div>)}</div>
    </section><section className="mp-card"><h2>Meccskeret · {roster.length}</h2>{roster.length ? <ol className="mp-roster">{roster.map((player) => <li key={player.id}>{player.name}</li>)}</ol> : <p>A Meccskeret nézetben válassz játékosokat.</p>}</section>
  </>

  return <section className="mp-card">
    <div className="mp-section-heading"><div><h2>Felállás és cserék</h2><p>Válassz posztot a pályán, majd rendelj hozzá játékost.</p></div><label className="mp-duration">Játékidő (perc)<input type="number" min="4" max="180" value={plan.duration} onChange={(event) => { const duration = Number(event.target.value); if (Number.isInteger(duration) && duration >= 4 && duration <= 180) update({ duration }) }} /></label></div>
    <div className="mp-half-toolbar"><div className="mp-half-switch" role="group" aria-label="Félidő">{halves.map((_, index) => <button type="button" key={index} aria-pressed={halfIndex === index} className={halfIndex === index ? 'is-selected' : ''} onClick={() => setHalfIndex(index)}>{index + 1}. félidő <small>{index * plan.duration / 2}–{(index + 1) * plan.duration / 2}′</small></button>)}</div><label>Felállás<select value={half.formation} onChange={(event) => saveHalf(changeFormation(half, event.target.value))}>{Object.keys(formations).map((name) => <option key={name}>{name}</option>)}</select></label></div>
    {!plan.squad.length && <p>Először a Meccskeret nézetben add hozzá a játékosokat.</p>}
    {!formations[plan.formation] && !plan.halves && <p role="status">A korábbi felállás közös posztjai megmaradtak. Ellenőrizd az új posztokat.</p>}
    {!plan.halves && plan.substitutions.length > 0 && <p role="status">A korábbi cserékből a negyedek kezdetén érvényes összeállításokat vettük át. Ellenőrizd a két félidőt.</p>}
    <div className="mp-tactics-layout"><div><div className="mp-pitch-caption"><span>{half.formation}</span><span>{Object.values(half.starters).filter(Boolean).length} / 9 poszt kiosztva</span></div>{pitch(half, true)}<p className="mp-legend">K: kapus · V: védő · BK/KK/JK: középpályás · CS: csatár · SZ: szélső · B/J: bal/jobb</p></div>
      <div className="mp-assignment"><span className="eyebrow">KIVÁLASZTOTT POSZT</span><h3>{selectedPosition}</h3><label>{halfIndex * 2 + 1}. negyed · kezdő<select value={half.starters[selectedPosition] || ''} onChange={(event) => saveHalf({ ...half, starters: { ...half.starters, [selectedPosition]: event.target.value }, replacements: { ...half.replacements, [selectedPosition]: '' } })}><option value="">Üres poszt</option>{roster.map((player) => <option key={player.id} value={String(player.id)} disabled={Object.entries(half.starters).some(([pos, id]) => pos !== selectedPosition && id === String(player.id))}>{player.name}</option>)}</select></label>
      <label>{halfIndex * 2 + 2}. negyed · csere<select disabled={!half.starters[selectedPosition]} value={half.replacements[selectedPosition] || ''} onChange={(event) => saveHalf({ ...half, replacements: { ...half.replacements, [selectedPosition]: event.target.value } })}><option value="">Marad a kezdő</option>{roster.filter((player) => String(player.id) !== half.starters[selectedPosition]).map((player) => <option key={player.id} value={String(player.id)} disabled={Object.entries(quarterLineup(half)).some(([pos, id]) => pos !== selectedPosition && id === String(player.id))}>{player.name}</option>)}</select></label><p>Csere a {(halfIndex * 2 + 1) * plan.duration / 4}. percben. Üres csere esetén a kezdő marad.</p><p>A két félidő összeállítását külön tervezheted meg.</p></div>
    </div>
    <div className="mp-benches">{[half.starters, quarterLineup(half)].map((lineup, quarter) => { const bench = roster.filter((player) => !Object.values(lineup).includes(String(player.id))); return <div key={quarter}><h3>{halfIndex * 2 + quarter + 1}. negyed · Kispad ({bench.length})</h3><div className="mp-bench">{bench.map((player) => <span key={player.id}>{player.name}</span>)}{!bench.length && <p>Nincs cserejátékos.</p>}</div></div> })}</div>
    {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}
  </section>
}
