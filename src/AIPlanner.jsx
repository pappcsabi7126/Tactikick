import { useEffect, useMemo, useState } from 'react'
import { generateAITrainingWithCloud } from './dataService'
import { generateSmartTraining } from './aiPlannerEngine'
import { createTranslator, getInitialLanguage } from './i18n'

const objectives = [
  'Labdakihozatal',
  'Labdabirtoklás',
  'Presszing',
  'Támadásépítés',
  'Védekezés',
  'Átmenetek',
  'Technikai képzés',
]

const durations = ['60','75','90','120']

const intensities = ['Alacsony', 'Közepes', 'Magas']

export default function AIPlanner({ teams = [], selectedTeam = null, onCreateTraining }) {
  const t = useMemo(() => createTranslator(getInitialLanguage()), [])
  const objectiveLabels = {
    Labdakihozatal: t('objectiveBuildUp'),
    Labdabirtoklás: t('objectivePossession'),
    Presszing: t('objectivePressing'),
    Támadásépítés: t('objectiveAttack'),
    Védekezés: t('objectiveDefending'),
    Átmenetek: t('objectiveTransitions'),
    'Technikai képzés': t('objectiveTechnical'),
  }
  const intensityLabels = {
    Alacsony: t('intensityLow'),
    Közepes: t('intensityMedium'),
    Magas: t('intensityHigh'),
  }
  const initialTeamId = selectedTeam?.id ?? teams[0]?.id ?? ''

  const [teamId, setTeamId] = useState(String(initialTeamId))
  const [duration, setDuration] = useState('90')
  const [objective, setObjective] = useState('Labdakihozatal')
  const [intensity, setIntensity] = useState('Közepes')
  const [extraRequest, setExtraRequest] = useState('')
  const [generated, setGenerated] = useState(false)
  const [result, setResult] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [saved, setSaved] = useState(false)

  const [customObjectives, setCustomObjectives] = useState([])
  const [showCustomObjective, setShowCustomObjective] = useState(false)
  const [customObjective, setCustomObjective] = useState('')

  useEffect(() => {
    if (selectedTeam?.id != null) {
      setTeamId(String(selectedTeam.id))
    } else if (!teamId && teams[0]?.id != null) {
      setTeamId(String(teams[0].id))
    }
  }, [selectedTeam, teams])

  const team = useMemo(
    () => teams.find((item) => String(item.id) === String(teamId)),
    [teams, teamId],
  )

  const playerCount = team?.players ?? 0

  function addCustomObjective() {
    const value = customObjective.trim()

    if (!value) return

    if (!customObjectives.includes(value)) {
      setCustomObjectives((current) => [...current, value])
    }

    setObjective(value)
    setCustomObjective('')
    setShowCustomObjective(false)
    setGenerated(false)
  }

  function cancelCustomObjective() {
    setCustomObjective('')
    setShowCustomObjective(false)
  }

  async function handleGenerate(event) {
    event.preventDefault()

    if (!team) return

    setGenerating(true)
    setGenerated(false)
    setResult(null)
    setSaved(false)

    const payload = {
      team,
      duration: Number(duration),
      objective,
      intensity,
      extraRequest,
    }

    try {
      const cloudResult = await generateAITrainingWithCloud(payload)
      if (cloudResult?.exercises?.length) {
        setResult(cloudResult)
      } else {
        setResult(generateSmartTraining(payload))
      }
    } catch (error) {
      console.warn(error)
      setResult(generateSmartTraining(payload))
    } finally {
      setGenerating(false)
      setGenerated(true)
    }
  }

  function saveGeneratedTraining() {
    if (!result || !team || !onCreateTraining) return

    const today = new Date()
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    onCreateTraining({
      id: Date.now(),
      teamId: team.id,
      date,
      startTime: '17:00',
      endTime: '18:30',
      title: result.title,
      color: team.color || 'purple',
      aiGenerated: true,
      plan: result.exercises.map((exercise, index) => ({
        id: exercise.id || `ai-${Date.now()}-${index}`,
        name: exercise.name,
        duration: Number(exercise.duration) || 10,
        description: exercise.description || '',
        image: exercise.image || '',
      })),
      attendance: {},
      notes: result.extraRequest || '',
    })

    setSaved(true)
  }

  return (
    <div className="page">
      <div className="ai-page">

        <div className="ai-hero">
          <div className="ai-page-icon">✦</div>

          <div>
            <div className="eyebrow">TACTIKICK AI</div>
            <h1>{t('aiTrainingTitle')}</h1>
            <p>
              Állítsd be az edzés fő paramétereit, az AI pedig ezek alapján
              készíti el a teljes edzéstervet.
            </p>
          </div>

          <div className="ai-hero-badge">
            <span>✦</span>
            SMART COACH
          </div>
        </div>

        {teams.length === 0 ? (
          <div className="ai-empty-state">
            <div className="ai-empty-icon">✦</div>
            <h2>{t('noTeamsYet')}</h2>
            <p>
              {t('createTeamFirstAI')}
            </p>
          </div>
        ) : (
          <form className="ai-builder" onSubmit={handleGenerate}>

            <div className="ai-builder-main">

              <section className="ai-panel ai-panel-team">
                <div className="ai-panel-heading">
                  <div className="ai-step">01</div>

                  <div>
                    <span>{t('teamStep')}</span>
                    <h2>{t('whichTeam')}</h2>
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('selectTeam')}</label>

                  <select
                    value={teamId}
                    onChange={(event) => {
                      setTeamId(event.target.value)
                      setGenerated(false)
                    }}
                  >
                    {teams.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} · {item.age}
                      </option>
                    ))}
                  </select>
                </div>

                {team && (
                  <div className="ai-team-summary">
                    <div className={`ai-team-avatar ${team.color || ''}`}>
                      {team.name.replace(/\D/g, '') || 'T'}
                    </div>

                    <div className="ai-team-summary-name">
                      <strong>{team.name}</strong>
                      <span>{team.age}</span>
                    </div>

                    <div className="ai-team-summary-stat">
                      <strong>{playerCount}</strong>
                      <span>{t('playersCount')}</span>
                    </div>

                    <div className="ai-team-summary-stat">
                      <strong>{team.attendance ?? 0}%</strong>
                      <span>{t('attendanceShort')}</span>
                    </div>
                  </div>
                )}
              </section>


              <section className="ai-panel">
                <div className="ai-panel-heading">
                  <div className="ai-step">02</div>

                  <div>
                    <span>{t('trainingStep')}</span>
                    <h2>{t('trainingGoal')}</h2>
                  </div>
                </div>

                <div className="ai-objective-grid">

                  {objectives.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        objective === item
                          ? 'ai-objective active'
                          : 'ai-objective'
                      }
                      onClick={() => {
                        setObjective(item)
                        setGenerated(false)
                      }}
                    >
                      {objectiveLabels[item] || item}
                    </button>
                  ))}

                  {customObjectives.map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={
                        objective === item
                          ? 'ai-objective custom active'
                          : 'ai-objective custom'
                      }
                      onClick={() => {
                        setObjective(item)
                        setGenerated(false)
                      }}
                    >
                      {item}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="ai-objective ai-add-objective"
                    onClick={() => setShowCustomObjective(true)}
                  >
                    <strong>+</strong>
                    Saját cél
                  </button>

                </div>

                {showCustomObjective && (
                  <div className="ai-custom-objective">

                    <div className="form-group">
                      <label>{t('customTrainingGoal')}</label>

                      <input
                        type="text"
                        value={customObjective}
                        onChange={(event) =>
                          setCustomObjective(event.target.value)
                        }
                        placeholder={t('customGoalPlaceholder')}
                        autoFocus
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            addCustomObjective()
                          }

                          if (event.key === 'Escape') {
                            cancelCustomObjective()
                          }
                        }}
                      />
                    </div>

                    <div className="ai-custom-objective-actions">

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={cancelCustomObjective}
                      >
                        Mégse
                      </button>

                      <button
                        type="button"
                        className="neon-button"
                        onClick={addCustomObjective}
                        disabled={!customObjective.trim()}
                      >
                        Hozzáadás
                      </button>

                    </div>

                  </div>
                )}

              </section>


              <section className="ai-panel">
                <div className="ai-panel-heading">
                  <div className="ai-step">03</div>

                  <div>
                    <span>{t('parametersStep')}</span>
                    <h2>{t('fineTune')}</h2>
                  </div>
                </div>

                <div className="ai-parameter-grid">

                  <div className="form-group">
                    <label>{t('duration').toUpperCase()}</label>

                    <select
                      value={duration}
                      onChange={(event) => {
                        setDuration(event.target.value)
                        setGenerated(false)
                      }}
                    >
                      {durations.map((value) => (
                        <option key={value} value={value}>
                          {value} {t('minutes')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('intensity').toUpperCase()}</label>

                    <select
                      value={intensity}
                      onChange={(event) => {
                        setIntensity(event.target.value)
                        setGenerated(false)
                      }}
                    >
                      {intensities.map((item) => (
                        <option key={item} value={item}>
                          {intensityLabels[item] || item}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="form-group ai-extra-field">
                  <label>
                    {t('extraRequest').toUpperCase()} <span>{t('optional').toUpperCase()}</span>
                  </label>

                  <textarea
                    value={extraRequest}
                    onChange={(event) => {
                      setExtraRequest(event.target.value)
                      setGenerated(false)
                    }}
                    placeholder={t('extraRequestPlaceholder')}
                    rows="4"
                  />
                </div>

              </section>

            </div>


            <aside className="ai-builder-side">

              <div className="ai-summary-card">

                <div className="ai-summary-top">
                  <span>{t('aiPlan')}</span>
                  <div>✦</div>
                </div>

                <h3>
                  {team?.name || t('chooseTeam')}
                </h3>

                <p>
                  {objective} · {duration} {t('minutes')}
                </p>

                <div className="ai-summary-lines">

                  <div>
                    <span>{t('ageGroup')}</span>
                    <strong>{team?.age || '—'}</strong>
                  </div>

                  <div>
                    <span>{t('playersCount')}</span>
                    <strong>{playerCount || '—'}</strong>
                  </div>

                  <div>
                    <span>{t('intensity')}</span>
                    <strong>{intensityLabels[intensity] || intensity}</strong>
                  </div>

                </div>

                <div className="ai-summary-divider" />

                <div className="ai-summary-features">
                  <span>✓ {t('warmup')}</span>
                  <span>✓ {t('mainExercises')}</span>
                  <span>✓ {t('smallSidedGame')}</span>
                  <span>✓ {t('cooldown')}</span>
                </div>

                <button
                  className="ai-generate-button ai-generate-full"
                  type="submit"
                  disabled={!team}
                >
                  <span>✦</span>
                  {generating ? t('trainingGenerating') : t('generateTraining')}
                  <strong>→</strong>
                </button>

              </div>


              <div className="ai-side-note">
                <span>✦</span>

                <div>
                  <strong>{t('aiCoach')}</strong>

                  <p>
                    {t('aiCoachDescription')}
                  </p>
                </div>
              </div>

            </aside>

          </form>
        )}


        {generated && result && (
          <div className="ai-demo-result ai-result-preview">
            <div className="ai-result-preview-main">
              <span className="eyebrow">{t('preview')}</span>
              <h2>{result.title}</h2>
              <p>{result.duration} {t('minutes')} · {result.players || playerCount} {t('players')} · {intensityLabels[result.intensity] || result.intensity}</p>

              <div className="ai-generated-list">
                {result.exercises.map((exercise, index) => (
                  <div className="ai-generated-item" key={`${exercise.name}-${index}`}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{exercise.name}</strong>
                      <small>{exercise.duration} {t('minutes')}</small>
                      <p>{exercise.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-result-preview-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setGenerated(false)
                  setResult(null)
                }}
              >
                Bezárás
              </button>
              {onCreateTraining && (
                <button
                  className="neon-button"
                  type="button"
                  onClick={saveGeneratedTraining}
                  disabled={saved}
                >
                  {saved ? `✓ ${t('saved')}` : `✓ ${t('saveAsTraining')}`}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
