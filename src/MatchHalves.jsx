import { useState } from 'react'
import { formations, formationRows, quarterLineup, validateHalves, changeFormation } from './matchPlan'
import { downloadMatchPdf } from './matchPdf'

export default function MatchHalves({ match, plan, halves, update, teamName }) {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const warnings = validateHalves(halves)
  const roster = [...plan.squad].sort((a, b) => a.name.localeCompare(b.name, 'hu'))
  const saveHalf = (index, half) => update({ halves: halves.map((current, i) => i === index ? half : current) })
  const playerName = (id) => plan.squad.find((player) => String(player.id) === String(id))?.name || 'Üres poszt'
  return <>
    <section className="mp-card"><h2>2. Félidők és negyedek</h2>
      <label>Játékidő összesen (perc)<input type="number" min="4" max="180" value={plan.duration} onChange={(event) => { const duration = Number(event.target.value); if (Number.isInteger(duration) && duration >= 4 && duration <= 180) update({ duration }) }} /></label>
      <p>4 × {plan.duration / 4} perc. A kezdőjátékos alatt válaszd ki, ki álljon be a következő negyedre. Ha nincs csere, a kezdő marad a pályán.</p>
      {!formations[plan.formation] && !plan.halves && <p role="status">A korábbi felállás közös posztjait átvettük a 3–2–3-ba. A többi játékos a keretben maradt; oszd ki az új posztokat.</p>}
      {!plan.halves && plan.substitutions.length > 0 && <p role="status">A korábbi perces cserékből a negyedek kezdetén érvényes összeállításokat vettük át. Ellenőrizd a két félidőt.</p>}
    </section>
    {halves.map((half, index) => <section className="mp-card" key={index}>
      <h2>{index + 1}. félidő · {index * 2 + 1}–{index * 2 + 2}. negyed</h2>
      <div className="mp-grid"><label>Felállás<select aria-label={String(index + 1) + ". félidő felállása"} value={half.formation} onChange={(event) => saveHalf(index, changeFormation(half, event.target.value))}>{Object.keys(formations).map((name) => <option key={name}>{name}</option>)}</select></label></div>
      <p>Kezdés: {index * plan.duration / 2}. perc · Negyedközi csere: {(index * 2 + 1) * plan.duration / 4}. perc</p>
      <p>Felállásváltáskor a közös posztok megmaradnak, a többi játékos visszakerül a kispadra.</p>
      <div className="mp-pitch-scroll" tabIndex="0" aria-label={`${index + 1}. félidő pályája, kis képernyőn oldalra görgethető`}><div className="mp-pitch">{formationRows[half.formation].map((row, rowIndex) => <div className="mp-pitch-row" key={rowIndex}>{row.map((position) => <div className="mp-position" key={position}>
        <label>{position}<select aria-label={`${index + 1}. félidő ${position} kezdő`} value={half.starters[position] || ''} onChange={(event) => saveHalf(index, { ...half, starters: { ...half.starters, [position]: event.target.value }, replacements: { ...half.replacements, [position]: '' } })}><option value="">Üres poszt</option>{plan.squad.map((player) => <option key={player.id} value={String(player.id)} disabled={Object.entries(half.starters).some(([pos, id]) => pos !== position && id === String(player.id))}>{player.name}</option>)}</select></label>
        <label className="mp-replacement">↳ {index * 2 + 2}. negyed<select aria-label={`${index + 1}. félidő ${position} csere`} disabled={!half.starters[position]} value={half.replacements[position] || ''} onChange={(event) => saveHalf(index, { ...half, replacements: { ...half.replacements, [position]: event.target.value } })}><option value="">Marad a kezdő</option>{plan.squad.filter((player) => String(player.id) !== half.starters[position]).map((player) => <option key={player.id} value={String(player.id)} disabled={Object.entries(quarterLineup(half)).some(([pos, id]) => pos !== position && id === String(player.id))}>{player.name}</option>)}</select></label>
      </div>)}</div>)}</div></div>
      <p>K: kapus · V: védő · BK/KK/JK: középpályások · CS: csatár · SZ: szélső · B/J: bal/jobb</p>
      {[half.starters, quarterLineup(half)].map((lineup, quarter) => <div key={quarter}><h3>{index * 2 + quarter + 1}. negyed – kispad</h3><div className="mp-bench">{plan.squad.filter((player) => !Object.values(lineup).includes(String(player.id))).map((player) => <span key={player.id}>{player.name}</span>)}</div></div>)}
    </section>)}
    <section className="mp-card"><h2>3. Meccsösszegző</h2><p>A PDF mindkét félidő pályaképét, a nevek alatti negyedközi cseréket és a negyedenkénti kispadot tartalmazza. A még ki nem osztott posztokat is jelöli.</p>
      {warnings.map((warning) => <p role="alert" key={warning}>{warning}</p>)}
      {error && <p role="alert">{error}</p>}
      <button type="button" className="neon-button" disabled={exporting || warnings.length > 0} onClick={async () => { setExporting(true); setError(''); try { await downloadMatchPdf({ match, plan, halves, teamName }) } catch { setError('A PDF letöltése nem sikerült. Próbáld újra.') } finally { setExporting(false) } }}>{exporting ? 'PDF készítése…' : 'Összegző letöltése PDF-ben'}</button>
      <div className="mp-summary">{halves.map((half, index) => <div key={index}><h3>{index + 1}. félidő · {half.formation}</h3><div className="mp-pitch-scroll"><div className="mp-pitch mp-summary-pitch">{formationRows[half.formation].map((row, rowIndex) => <div className="mp-pitch-row" key={rowIndex}>{row.map((position) => <div className="mp-position" key={position}><span>{position}</span><strong>{playerName(half.starters[position])}</strong><small>{half.replacements[position] ? `↳ ${playerName(half.replacements[position])} · ${(index * 2 + 1) * plan.duration / 4}. perc` : 'Marad a következő negyedre'}</small></div>)}</div>)}</div></div></div>)}</div>
    </section>
    <section className="mp-card"><h2>Meccskeret névsora · {roster.length} játékos</h2>
      {roster.length ? <ol className="mp-roster">{roster.map((player) => <li key={player.id}>{player.name}</li>)}</ol> : <p>Még nincs játékos a keretben.</p>}
    </section>
  </>
}
