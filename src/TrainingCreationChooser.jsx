export default function TrainingCreationChooser({
  t,
  onClose,
  onPlan,
  onLibrary,
  onAI,
}) {
  return (
    <div
      className="player-modal-backdrop new-training-choice-backdrop"
      onClick={onClose}
    >
      <div
        className="player-modal new-training-choice-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="player-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="player-modal-eyebrow">{t('newTraining').toUpperCase()}</div>
        <h2>{t('howCreateTraining')}</h2>
        <p className="player-modal-position">
          {t('newTrainingDescription')}
        </p>

        <div className="new-training-choice-grid">
          <button
            type="button"
            className="new-training-choice-card"
            onClick={onPlan}
          >
            <span className="new-training-choice-icon">⚽</span>
            <span className="new-training-choice-title">{t('planTraining')}</span>
            <span className="new-training-choice-description">
              {t('planTrainingDescription')}
            </span>
            <span className="new-training-choice-arrow">→</span>
          </button>

          <button
            type="button"
            className="new-training-choice-card library"
            onClick={onLibrary}
          >
            <span className="new-training-choice-icon">📚</span>
            <span className="new-training-choice-title">{t('trainingLibrary')}</span>
            <span className="new-training-choice-description">
              {t('libraryTrainingDescription')}
            </span>
            <span className="new-training-choice-arrow">→</span>
          </button>

          <button
            type="button"
            className="new-training-choice-card ai"
            onClick={onAI}
          >
            <span className="new-training-choice-icon">✦</span>
            <span className="new-training-choice-title">{t('aiTraining')}</span>
            <span className="new-training-choice-description">
              {t('aiTrainingDescription')}
            </span>
            <span className="new-training-choice-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
