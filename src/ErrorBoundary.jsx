import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    document.documentElement.setAttribute('data-coachapp-ready', 'true')
    console.error('TactiKick application error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="fatal-error" role="alert">
        <div className="fatal-error-card">
          <span className="fatal-error-mark" aria-hidden="true">!</span>
          <p className="eyebrow">TACTIKICK</p>
          <h1>Valami váratlan hiba történt.</h1>
          <p>Az adataid nem törlődtek. Töltsd újra az oldalt, és próbáld meg ismét.</p>
          <button type="button" className="neon-button" onClick={() => window.location.reload()}>
            Oldal újratöltése
          </button>
        </div>
      </main>
    )
  }
}
