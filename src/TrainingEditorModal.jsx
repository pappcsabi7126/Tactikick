import TrainingPlanBuilder from './TrainingPlanBuilder'
import './training-editor-shell.css'

export default function TrainingEditorModal({
  open,
  editingTraining,
  value,
  onChange,
  onClose,
  onSave,
  t,
}) {
  if (!open) return null

  const training = {
    date: '',
    startTime: '17:00',
    endTime: '18:30',
    title: '',
    plan: [],
    ...(value || {}),
  }

  const update = (field, nextValue) => {
    onChange({
      ...training,
      [field]: nextValue,
    })
  }

  return (
    <div
      className="training-editor-backdrop"
      onClick={onClose}
    >
      <form
        className="training-editor-modal"
        onSubmit={onSave}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="training-editor-header">
          <div>
            <span className="training-editor-eyebrow">
              {editingTraining ? t('editTraining').toUpperCase() : t('newTraining').toUpperCase()}
            </span>
            <h2>
              {editingTraining
                ? t('editTraining')
                : t('createTraining')}
            </h2>
            <p>{t('trainingEditorDescription')}</p>
          </div>

          <button
            type="button"
            className="training-editor-close"
            onClick={onClose}
            aria-label={t('close')}
          >
            ×
          </button>
        </header>

        <div className="training-editor-scroll">
          <section className="training-editor-basic">
            <div className="training-editor-field">
              <label>{t('trainingTopic').toUpperCase()}</label>
              <input
                value={training.title}
                onChange={(event) =>
                  update('title', event.target.value)
                }
                placeholder={t('trainingTopicPlaceholder')}
                required
                autoFocus
              />
            </div>

            <div className="training-editor-basic-row">
              <div className="training-editor-field">
                <label>{t('date').toUpperCase()}</label>
                <input
                  type="date"
                  value={training.date}
                  onChange={(event) =>
                    update('date', event.target.value)
                  }
                  required
                />
              </div>

              <div className="training-editor-field">
                <label>{t('start').toUpperCase()}</label>
                <input
                  type="time"
                  value={training.startTime}
                  onChange={(event) =>
                    update('startTime', event.target.value)
                  }
                  required
                />
              </div>

              <div className="training-editor-field">
                <label>{t('end').toUpperCase()}</label>
                <input
                  type="time"
                  value={training.endTime}
                  onChange={(event) =>
                    update('endTime', event.target.value)
                  }
                  required
                />
              </div>
            </div>
          </section>

          <TrainingPlanBuilder
            t={t}
            value={training.plan}
            onChange={(plan) => update('plan', plan)}
          />
        </div>

        <footer className="training-editor-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            {t('cancel')}
          </button>

          <button type="submit" className="neon-button">
            {editingTraining
              ? t('saveChanges')
              : t('createTraining')}
          </button>
        </footer>
      </form>
    </div>
  )
}
