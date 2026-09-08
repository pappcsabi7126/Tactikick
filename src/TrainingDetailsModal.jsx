import { useEffect, useRef, useState } from 'react'
import './training-details-modal.css'

const sectionNames = { 'Warm-up': 'Bemelegítés', 'Warm up': 'Bemelegítés', 'Main exercise': 'Fő gyakorlat', 'Cool-down': 'Levezetés', 'Cool down': 'Levezetés', 'Small-sided game': 'Kisjáték', 'Match play': 'Mérkőzésjáték', 'Goal 1': 'Cél 1', 'Goal 2': 'Cél 2' }

export default function TrainingDetailsModal({ training, team, players, onClose, onEdit, onAttendanceChange }) {
  const isMatch = training.calendarType === 'match'
  const dialogRef = useRef(null)
  const [view, setView] = useState('plan')
  useEffect(() => {
    const dialog = dialogRef.current
    const opener = document.activeElement
    const overflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [])
  const plan = Array.isArray(training.plan) ? training.plan.filter((exercise) => exercise && exercise.kind !== 'match-lineup') : []
  const date = training.date ? new Date(`${training.date}T12:00:00`) : null
  const dateLabel = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : 'Dátum nincs megadva'
  const duration = plan.reduce((sum, exercise) => sum + (Number(exercise.duration) || 0), 0)
  return <dialog ref={dialogRef} className="training-reader" aria-labelledby="training-reader-title" onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}>
    <header className="training-reader-header"><div><span className="eyebrow">{isMatch ? 'MECCS ADATAI' : 'EDZÉS ADATAI'}</span><h2 id="training-reader-title">{training.title || (isMatch ? 'Meccs' : 'Edzés')}</h2><p>{team?.name || 'Csapat nincs megadva'} · {dateLabel}</p></div><button type="button" className="training-reader-close" aria-label={isMatch ? 'Meccs bezárása' : 'Edzés bezárása'} onClick={onClose}>×</button></header>
    <div className="training-reader-toolbar"><button type="button" className="neon-button" onClick={() => onEdit(training)}>{isMatch ? '✎ Meccs szerkesztése' : '✎ Edzés szerkesztése'}</button><button type="button" className="secondary-button" aria-pressed={view === 'attendance'} onClick={() => setView(view === 'attendance' ? 'plan' : 'attendance')}>{view === 'attendance' ? (isMatch ? '← Meccs adatai' : '← Edzésterv') : '✓ Jelenléti ív'}</button></div>
    <div className="training-reader-meta"><div><span>Időpont</span><strong>{[training.startTime, training.endTime].filter(Boolean).join('–') || 'Nincs megadva'}</strong></div>{!isMatch && <div><span>Edzésterv hossza</span><strong>{duration ? `${duration} perc` : 'Nincs megadva'}</strong></div>}<div><span>Csapatlétszám</span><strong>{players.length} játékos</strong></div>{training.location && <div><span>Helyszín</span><strong>{training.location}</strong></div>}</div>
    {view === 'plan' && isMatch ? <section className="training-reader-content"><h3>Meccsterv</h3><p>A keretet, a kezdőcsapatot és a cseréket a Meccstervezőben állíthatod össze. A „Meccs szerkesztése” gomb ezt a mérkőzést nyitja meg.</p></section> : view === 'plan' ? <section className="training-reader-content"><h3>Edzésterv</h3>{plan.length ? <ol className="training-reader-plan">{plan.map((exercise, index) => <li key={exercise.id || index}><span className="training-reader-number">{String(index + 1).padStart(2, '0')}</span><div><div className="training-reader-exercise-title"><h4>{sectionNames[exercise.name] || exercise.name || 'Feladat'}</h4>{Number(exercise.duration) > 0 && <span>{exercise.duration} perc</span>}</div><div className={exercise.image ? 'training-reader-exercise-body has-image' : 'training-reader-exercise-body'}>{exercise.image && <img src={exercise.image} alt={exercise.name || 'Gyakorlat'} loading="lazy" />}<p>{exercise.description || 'Ehhez a feladathoz még nincs leírás.'}</p></div></div></li>)}</ol> : <p>Ehhez az edzéshez még nincs mentett edzésterv. Az „Edzés szerkesztése” gombbal adhatsz hozzá feladatokat.</p>}</section> : <section className="training-reader-content"><h3>Jelenléti ív</h3><p>A változtatásokat automatikusan mentjük.</p>{players.length ? <div className="training-reader-attendance">{players.map((player) => { const present = !training.attendance?.[player.id] || training.attendance[player.id] === 'present'; return <button type="button" className="training-reader-attendance-row" key={player.id} aria-label={`${player.name}: ${present ? 'Jelen' : 'Hiányzik'}, kattints a váltáshoz`} aria-pressed={present} onClick={() => onAttendanceChange(training.id, player.id, present ? 'absent' : 'present')}><span>{player.name}</span><span className={`training-reader-attendance-mark ${present ? 'present' : 'absent'}`} aria-hidden="true">{present ? '✓' : '×'}</span></button> })}</div> : <p>Ebben a csapatban még nincs játékos.</p>}</section>}
  </dialog>
}
