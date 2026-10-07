import { attendanceStatus } from './attendance'

export default function TrainingAttendanceEditor({ training, players, onChange }) {
  return <section className="training-reader-content"><h3>Jelenléti ív</h3><p>Kattints a játékosra a jelenlét váltásához: ✓ jelen · × hiányzik · — nincs rögzítve. A változtatásokat automatikusan mentjük.</p>
    {players.length ? <div className="training-reader-attendance">{players.map(player => {
      const status = attendanceStatus(training, player.id)
      const label = { present: 'Jelen', absent: 'Hiányzik', excused: 'Igazolt hiányzás', unrecorded: 'Nincs rögzítve' }[status]
      return <button type="button" className="training-reader-attendance-row" key={player.id} aria-label={`${player.name}: ${label}, kattints a váltáshoz`} aria-pressed={status === 'present'} onClick={() => onChange(training.id, player.id, status === 'present' ? 'absent' : 'present')}><span>{player.name}</span><span className={`training-reader-attendance-mark ${status}`} aria-hidden="true">{status === 'present' ? '✓' : status === 'absent' ? '×' : status === 'excused' ? '◷' : '—'}</span></button>
    })}</div> : <p>Ebben a csapatban még nincs játékos.</p>}
  </section>
}
