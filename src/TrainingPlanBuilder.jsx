import { useState } from 'react'
import './training-plan-builder.css'

const SECTION_NAMES = [
  'Bemelegítés',
  'Cél 1',
  'Cél 2',
  'Mérkőzésjáték',
]

const SECTION_ICONS = {
  'Bemelegítés': '✦',
  'Cél 1': '◎',
  'Cél 2': '◎',
  'Mérkőzésjáték': '▦',
  'Saját feladat': '+',
}

function createId() {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`
}

function createExercise(name) {
  return {
    id: createId(),
    name,
    duration:
      name === 'Bemelegítés'
        ? 15
        : name === 'Mérkőzésjáték'
          ? 25
          : 20,
    description: '',
    image: '',
  }
}

export function createDefaultTrainingPlan() {
  return SECTION_NAMES.map(createExercise)
}

export function normalizeTrainingPlan(plan) {
  if (!Array.isArray(plan) || !plan.length) {
    return createDefaultTrainingPlan()
  }

  return plan.map((exercise, index) => ({
    id: exercise?.id || createId(),
    name:
      exercise?.name ||
      SECTION_NAMES[index] ||
      'Saját feladat',
    duration:
      Number(exercise?.duration) ||
      (SECTION_NAMES[index] === 'Bemelegítés'
        ? 15
        : SECTION_NAMES[index] === 'Mérkőzésjáték'
          ? 25
          : 20),
    description: exercise?.description || '',
    image: exercise?.image || '',
  }))
}

export default function TrainingPlanBuilder({
  t,
  value,
  onChange,
}) {
  const plan =
    Array.isArray(value) && value.length
      ? value
      : createDefaultTrainingPlan()

  const [uploadingId, setUploadingId] = useState(null)

  function update(id, field, nextValue) {
    const nextPlan = plan.map((item) => {
      if (item.id !== id) {
        return item
      }

      return {
        ...item,
        [field]: nextValue,
      }
    })

    onChange(nextPlan)
  }

  function add() {
    onChange([
      ...plan,
      createExercise('Saját feladat'),
    ])
  }

  function remove(id) {
    onChange(
      plan.filter((item) => item.id !== id),
    )
  }

  function move(id, direction) {
    const index = plan.findIndex(
      (item) => item.id === id,
    )

    const nextIndex = index + direction

    if (
      index < 0 ||
      nextIndex < 0 ||
      nextIndex >= plan.length
    ) {
      return
    }

    const next = [...plan]
    const [item] = next.splice(index, 1)

    next.splice(nextIndex, 0, item)

    onChange(next)
  }

  function uploadImage(event, id) {
    const input = event.currentTarget
    const file = input.files?.[0]

    if (!file || !file.type.startsWith('image/')) {
      input.value = ''
      return
    }

    setUploadingId(id)

    const reader = new FileReader()

    reader.onload = () => {
      const imageData = String(
        reader.result || '',
      )

      /*
       * FONTOS:
       * kizárólag az adott exercise.id-hez adjuk
       * hozzá a képet. Nem a többi feladat objektumához.
       */
      onChange(
        plan.map((item) =>
          item.id === id
            ? {
                ...item,
                image: imageData,
              }
            : item,
        ),
      )

      setUploadingId(null)
      input.value = ''
    }

    reader.onerror = () => {
      setUploadingId(null)
      input.value = ''
    }

    reader.readAsDataURL(file)
  }

  return (
    <div className="training-plan-builder">

      <div className="training-plan-builder-heading">
        <div>
          <span className="training-plan-eyebrow">
            {t('trainingPlan').toUpperCase()}
          </span>

          <h3>{t('trainingStructure')}</h3>

          <p>
            {t('trainingStructureDescription')}
          </p>
        </div>

        <div className="training-plan-total">
          <strong>{plan.length}</strong>
          <span>{t('tasks')}</span>
        </div>
      </div>

      <div className="training-plan-flow">

        <div className="training-plan-line" />

        {plan.map((exercise, index) => {
          const label =
            index < SECTION_NAMES.length
              ? SECTION_NAMES[index]
              : 'Saját feladat'

          return (
            <article
              className="training-plan-card"
              key={exercise.id}
            >
              <div className="training-plan-node">
                <span>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="training-plan-card-body">

                <div className="training-plan-card-header">

                  <div className="training-plan-card-heading">

                    <div
                      className={`training-plan-type-icon training-plan-type-${index % 4}`}
                    >
                      {SECTION_ICONS[label] || '+'}
                    </div>

                    <div>
                      <strong>{label}</strong>

                      <span>
                        {exercise.image
                          ? t('exerciseWithImage')
                          : t('exercise')}
                      </span>
                    </div>

                  </div>

                  <div className="training-plan-actions">

                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() =>
                        move(exercise.id, -1)
                      }
                      aria-label={t('moveUp')}
                    >
                      ↑
                    </button>

                    <button
                      type="button"
                      disabled={
                        index === plan.length - 1
                      }
                      onClick={() =>
                        move(exercise.id, 1)
                      }
                      aria-label={t('moveDown')}
                    >
                      ↓
                    </button>

                    <button
                      type="button"
                      className="training-plan-delete"
                      onClick={() =>
                        remove(exercise.id)
                      }
                      aria-label={t('delete')}
                    >
                      ×
                    </button>

                  </div>
                </div>

                <div className="training-plan-card-content">

                  <div className="training-plan-card-fields">

                    <div className="training-plan-field">
                      <label>{t('taskName').toUpperCase()}</label>

                      <input
                        value={exercise.name || ''}
                        onChange={(event) =>
                          update(
                            exercise.id,
                            'name',
                            event.target.value,
                          )
                        }
                        placeholder={t('taskNamePlaceholder')}
                      />
                    </div>

                    <div className="training-plan-field training-plan-duration-field">
                      <label>{t('duration').toUpperCase()}</label>

                      <div className="training-plan-duration">

                        <input
                          type="number"
                          min="1"
                          max="180"
                          value={
                            exercise.duration ?? 1
                          }
                          onChange={(event) =>
                            update(
                              exercise.id,
                              'duration',
                              Math.min(
                                180,
                                Math.max(
                                  1,
                                  Number(
                                    event.target.value,
                                  ) || 1,
                                ),
                              ),
                            )
                          }
                        />

                        <span>{t('minutes')}</span>

                      </div>
                    </div>

                  </div>

                  <div className="training-plan-field">
                    <label>{t('description').toUpperCase()}</label>

                    <textarea
                      rows="3"
                      value={
                        exercise.description || ''
                      }
                      onChange={(event) =>
                        update(
                          exercise.id,
                          'description',
                          event.target.value,
                        )
                      }
                      placeholder={t('descriptionPlaceholder')}
                    />
                  </div>

                  <div className="training-plan-card-footer">

                    <label className="training-plan-upload">

                      <input
                        key={`image-input-${exercise.id}-${exercise.image ? 'has-image' : 'empty'}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(event) =>
                          uploadImage(
                            event,
                            exercise.id,
                          )
                        }
                      />

                      <span className="training-plan-upload-plus">
                        {uploadingId === exercise.id
                          ? '…'
                          : exercise.image
                            ? '↻'
                            : '+'}
                      </span>

                      <span>
                        <strong>
                          {uploadingId === exercise.id
                            ? t('loadingImage')
                            : exercise.image
                              ? t('replaceExerciseImage')
                              : t('addExerciseImage')}
                        </strong>

                        <small>
                          {t('imageFormats')}
                        </small>
                      </span>

                    </label>

                    {exercise.image && (
                      <button
                        type="button"
                        className="training-plan-remove-image"
                        onClick={() =>
                          update(
                            exercise.id,
                            'image',
                            '',
                          )
                        }
                      >
                        {t('removeImage')}
                      </button>
                    )}

                  </div>

                  {exercise.image && (
                    <div className="training-plan-image">
                      <img
                        src={exercise.image}
                        alt={
                          exercise.name ||
                          label
                        }
                      />
                    </div>
                  )}

                </div>
              </div>
            </article>
          )
        })}

      </div>

      <button
        type="button"
        className="training-plan-add"
        onClick={add}
      >
        <span className="training-plan-add-icon">
          +
        </span>

        <span>
          <strong>
            Saját feladat hozzáadása
          </strong>

          <small>
            Új gyakorlat hozzáadása az edzéstervhez
          </small>
        </span>

        <b>→</b>
      </button>

    </div>
  )
}