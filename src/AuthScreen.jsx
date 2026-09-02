import { useState } from 'react'
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from './dataService'

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, error }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
          minLength={8}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
        />
        <button
          className="auth-password-toggle"
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
          title={visible ? 'Jelszó elrejtése' : 'Jelszó megjelenítése'}
        >
          {visible ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A10.9 10.9 0 0 1 12 4.9c5.2 0 8.5 4.1 9.8 6.1a1.8 1.8 0 0 1 0 .2 17.8 17.8 0 0 1-3.1 3.5" />
              <path d="M6.1 6.1A17.4 17.4 0 0 0 2.2 11a1.8 1.8 0 0 0 0 .2c1.3 2 4.6 6.1 9.8 6.1 1.1 0 2.1-.2 3-.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.2 11.2C3.5 9.2 6.8 5.1 12 5.1s8.5 4.1 9.8 6.1a1.8 1.8 0 0 1 0 .2c-1.3 2-4.6 6.1-9.8 6.1S3.5 13.4 2.2 11.4a1.8 1.8 0 0 1 0-.2Z" />
              <circle cx="12" cy="11.3" r="2.6" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function switchMode() {
    setMode((current) => current === 'login' ? 'signup' : 'login')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setMessage('')
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    const normalizedEmail = email.trim()

    if (mode === 'signup') {
      if (password.length < 8) {
        setError('A jelszónak legalább 8 karakterből kell állnia.')
        return
      }
      if (password !== confirmPassword) {
        setError('A két jelszó nem egyezik.')
        return
      }
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        await signInWithEmail(normalizedEmail, password)
      } else {
        await signUpWithEmail(normalizedEmail, password)
        setMessage('A regisztráció elkészült. Ha az email megerősítés be van kapcsolva, nézd meg a postafiókod.')
      }
    } catch (err) {
      setError(err.message || 'Sikertelen művelet.')
    } finally {
      setLoading(false)
    }
  }

  async function google() {
    setError('')
    setLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err.message || 'A Google bejelentkezés nem sikerült.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-logo"><span>✦</span></div>
          <div>
            <div className="brand-name">TACTI<span>KICK</span></div>
            <div className="brand-tagline">TRAIN SMARTER</div>
          </div>
        </div>

        <div className="auth-heading">
          <div className="eyebrow">TACTIKICK ACCOUNT</div>
          <h1>{mode === 'login' ? 'Üdv újra.' : 'Hozd létre a fiókod.'}</h1>
          <p>{mode === 'login' ? 'Jelentkezz be, hogy elérd a csapataidat és edzéseidet.' : 'Hozd létre a saját edzői fiókodat néhány lépésben.'}</p>
        </div>

        <button className="auth-google" type="button" onClick={google} disabled={loading}>
          <span className="google-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" role="presentation">
              <path fill="#4285F4" d="M21.35 12.27c0-.73-.06-1.43-.2-2.1H12v3.98h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.27Z"/>
              <path fill="#34A853" d="M12 21.7c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.7Z"/>
              <path fill="#FBBC05" d="M6.53 13.78a5.86 5.86 0 0 1 0-3.56V7.69H3.28a9.75 9.75 0 0 0 0 8.62l3.25-2.53Z"/>
              <path fill="#EA4335" d="M12 6.2c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.27 14.63 2.3 12 2.3a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 7.92 9.46 6.2 12 6.2Z"/>
            </svg>
          </span>
          <span>Folytatás Google-fiókkal</span>
        </button>

        <div className="auth-divider"><span>vagy</span></div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="auth-email">EMAIL</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="te@email.hu"
              autoComplete="email"
            />
          </div>

          <PasswordField
            id="auth-password"
            label="JELSZÓ"
            value={password}
            onChange={setPassword}
            placeholder={mode === 'signup' ? 'Legalább 8 karakter' : 'Jelszavad'}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            error={Boolean(error)}
          />

          {mode === 'signup' && (
            <PasswordField
              id="auth-confirm-password"
              label="JELSZÓ MEGERŐSÍTÉSE"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Írd be újra a jelszavad"
              autoComplete="new-password"
              error={Boolean(error)}
            />
          )}

          {error && <div className="auth-message error" role="alert">{error}</div>}
          {message && <div className="auth-message success" role="status">{message}</div>}

          <button className="neon-button auth-submit" type="submit" disabled={loading}>
            {loading ? 'Feldolgozás…' : mode === 'login' ? 'Bejelentkezés' : 'Regisztráció'}
          </button>
        </form>

        <button className="auth-switch" type="button" onClick={switchMode}>
          {mode === 'login' ? 'Még nincs fiókod? Regisztrálj' : 'Már van fiókod? Jelentkezz be'}
        </button>
      </div>
    </div>
  )
}
