import { useState } from 'react'

export default function CalendarPage({ trainings, teams, onOpenTeam }) {
  const [cursor, setCursor] = useState(() => { const today = new Date(); return new Date(today.getFullYear(), today.getMonth(), 1) })
  const [selectedDate, setSelectedDate] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7

  const monthName = cursor.toLocaleDateString('hu-HU', {
    month: 'long',
    year: 'numeric',
  })

  const eventsForDay = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return trainings.filter((training) => training.date === key)
  }

  const selectedEvents = selectedDate ? eventsForDay(selectedDate) : []

  function moveMonth(offset) {
    setCursor(new Date(year, month + offset, 1))
    setSelectedDate(null)
  }

  return (
    <div className="page">
      <div className="hero-header">
        <div>
          <div className="eyebrow">SCHEDULE</div>
          <h1>Naptár</h1>
          <p>Tekintsd át az összes edzésedet egy helyen.</p>
        </div>
        <button className="neon-button" onClick={() => { const today = new Date(); setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelectedDate(null) }}>Ma</button>
      </div>

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-toolbar">
            <button className="calendar-nav-button" onClick={() => moveMonth(-1)}>‹</button>
            <h2>{monthName}</h2>
            <button className="calendar-nav-button" onClick={() => moveMonth(1)}>›</button>
          </div>

          <div className="calendar-weekdays">
            {['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'].map((day) => <span key={day}>{day}</span>)}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: firstDay }).map((_, index) => (
              <div className="calendar-day muted" key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1
              const events = eventsForDay(day)
              const selected = selectedDate === day

              return (
                <button
                  key={day}
                  className={`calendar-day ${selected ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <span className="calendar-day-number">{day}</span>
                  <div className="calendar-events">
                    {events.slice(0, 2).map((event) => (
                      <span key={event.id} className={`calendar-event ${event.color}`}>
                        {event.startTime} · {event.title}
                      </span>
                    ))}
                    {events.length > 2 && <small>+{events.length - 2} további</small>}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        <section className="calendar-side-card">
          <div className="card-label">
            {selectedDate ? `${selectedDate}. NAP` : 'KIVÁLASZTOTT NAP'}
          </div>
          <h2>{selectedDate ? 'Napi program' : 'Válassz egy napot'}</h2>

          {!selectedDate && (
            <p className="calendar-empty">
              Kattints egy napra a naptárban, hogy lásd az edzéseket.
            </p>
          )}

          {selectedDate && selectedEvents.length === 0 && (
            <p className="calendar-empty">Erre a napra nincs tervezett edzés.</p>
          )}

          {selectedEvents.map((event) => {
            const team = teams.find((item) => item.id === event.teamId)

            return (
              <button
                className="calendar-event-detail"
                key={event.id}
                onClick={() => team && onOpenTeam(team)}
              >
                <div className={`calendar-event-dot ${event.color}`} />
                <div>
                  <strong>{event.title}</strong>
                  <span>{team?.name || 'Csapat'} · {event.startTime}–{event.endTime}</span>
                </div>
                <span>→</span>
              </button>
            )
          })}
        </section>
      </div>
    </div>
  )
}
