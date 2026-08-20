import { useEffect, useState } from 'react'

import TrainingEditorModal from './TrainingEditorModal'
import TrainingCreationChooser from './TrainingCreationChooser'

import {
  createDefaultTrainingPlan,
  normalizeTrainingPlan,
} from './TrainingPlanBuilder'

import {
  getCurrentSession,
  loadTrainingTemplates,
  createTrainingTemplate,
  deleteTrainingTemplate,
  generateAITrainingWithCloud,
} from './dataService'
import { generateSmartTraining } from './aiPlannerEngine'

import './training-details-image.css'
import './training-details-polish.css'
import './training-pdf.css'
import './training-library.css'
import { downloadTrainingPdf } from './trainingPdf'

export default function TeamPage({
  t,
  team,
  players: sharedPlayers,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  trainings: sharedTrainings,
  setTrainings: setSharedTrainings,
  onBack,
  openTrainingChooser = false,
  openTrainingMode = null,
  openAttendanceTrainingId = null,
  language = 'hu',
}) {
  const [activeTab, setActiveTab] = useState('players')
  const [selectedPlayer, setSelectedPlayer] = useState(null)

  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showAddTraining, setShowAddTraining] = useState(false)
  const [showNewTrainingChoice, setShowNewTrainingChoice] = useState(false)
  const [showAddCalendarEvent, setShowAddCalendarEvent] = useState(false)
  const [editingTraining, setEditingTraining] = useState(null)
  const [trainingToDelete, setTrainingToDelete] = useState(null)

  useEffect(() => {
    if (!openTrainingChooser && !openTrainingMode) return

    setActiveTab('trainings')

    if (openTrainingMode === 'plan') {
      openAddTraining()
      return
    }

    if (openTrainingMode === 'library') {
      openTrainingLibrary()
      return
    }

    if (openTrainingMode === 'ai') {
      openAIPlanner()
      return
    }

    setShowNewTrainingChoice(true)
  }, [openTrainingChooser, openTrainingMode])

  const [showTrainingLibrary, setShowTrainingLibrary] = useState(false)
  const [trainingTemplates, setTrainingTemplates] = useState([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateToDelete, setTemplateToDelete] = useState(null)

  const [showAIPlanner, setShowAIPlanner] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiGenerating, setAiGenerating] = useState(false)

  const [localPlayers, setLocalPlayers] = useState([
    {
      id: 1,
      name: 'Kovács Ádám',
      position: 'Középpályás',
      birthYear: 2013,
      number: 8,
      attendance: 94,
      trainings: 18,
      present: 17,
      absent: 1,
    },
    {
      id: 2,
      name: 'Nagy Bence',
      position: 'Védő',
      birthYear: 2013,
      number: 4,
      attendance: 88,
      trainings: 18,
      present: 16,
      absent: 2,
    },
    {
      id: 3,
      name: 'Szabó Marci',
      position: 'Támadó',
      birthYear: 2013,
      number: 9,
      attendance: 100,
      trainings: 18,
      present: 18,
      absent: 0,
    },
    {
      id: 4,
      name: 'Tóth Dávid',
      position: 'Kapus',
      birthYear: 2012,
      number: 1,
      attendance: 91,
      trainings: 18,
      present: 17,
      absent: 1,
    },
    {
      id: 5,
      name: 'Horváth Máté',
      position: 'Középpályás',
      birthYear: 2013,
      number: 6,
      attendance: 86,
      trainings: 18,
      present: 15,
      absent: 3,
    },
  ])

  const players = [...(sharedPlayers || localPlayers)].sort((a, b) =>
    String(a?.name || '').localeCompare(String(b?.name || ''), 'hu-HU', { sensitivity: 'base', numeric: true })
  )

  const [localTrainings, setLocalTrainings] = useState([
    {
      id: 1,
      date: '2026-08-14',
      startTime: '17:00',
      endTime: '18:30',
      title: 'Labdakihozatal',
      plan: [
        { name: 'Bemelegítés labdával', duration: 15, description: 'Dinamikus labdás koordináció és technikai ráhangolás.' },
        { name: 'Labdakihozatal 4v3', duration: 25, description: 'Kontrollált felépítés hátulról, középpályás támogatással.' },
        { name: 'Kisjáték 5v5', duration: 30, description: 'A labdakihozatal elveinek alkalmazása játékhelyzetben.' },
        { name: 'Levezetés', duration: 10, description: 'Könnyű mozgás és mobilizáció.' },
      ],
      attendance: {
        1: 'present',
        2: 'present',
        3: 'present',
        4: 'absent',
        5: 'absent',
      },
    },
    {
      id: 2,
      date: '2026-08-12',
      startTime: '17:00',
      endTime: '18:30',
      title: 'Technikai edzés',
      plan: [
        { name: 'Bemelegítés', duration: 15, description: 'Labdás koordinációs és technikai feladatok.' },
        { name: 'Passz és labdaátvétel', duration: 25, description: 'Első érintés, passzpontosság és orientáció.' },
        { name: 'Technikai kisjáték', duration: 30, description: 'Technikai elemek alkalmazása nyomás alatt.' },
        { name: 'Levezetés', duration: 10, description: 'Könnyű mozgás és nyújtás.' },
      ],
      attendance: {
        1: 'absent',
        2: 'present',
        3: 'present',
        4: 'present',
        5: 'present',
      },
    },
    {
      id: 3,
      date: '2026-08-10',
      startTime: '17:00',
      endTime: '18:30',
      title: 'Kisjátékok',
      plan: [
        { name: 'Bemelegítés', duration: 15, description: 'Dinamikus mozgás és labdás játékok.' },
        { name: 'Rondo', duration: 20, description: 'Gyors döntéshozatal és labdabirtoklás.' },
        { name: 'Kisjáték 5v5', duration: 35, description: 'Játékhelyzetek folyamatos döntési kényszerrel.' },
        { name: 'Levezetés', duration: 10, description: 'Könnyű mozgás és mobilizáció.' },
      ],
      attendance: {
        1: 'present',
        2: 'absent',
        3: 'present',
        4: 'present',
        5: 'absent',
      },
    },
  ])

  const allTrainings = sharedTrainings || localTrainings
  const trainings = (sharedTrainings
    ? allTrainings.filter((training) => training.teamId === team.id)
    : allTrainings).slice().sort((a, b) => `${b.date || ''}T${b.startTime || ''}`.localeCompare(`${a.date || ''}T${a.startTime || ''}`))
  const setTrainings = setSharedTrainings || setLocalTrainings

  const [selectedTrainingId, setSelectedTrainingId] =
    useState(null)

  useEffect(() => {
    if (!openAttendanceTrainingId) return
    const target = trainings.find((training) => String(training.id) === String(openAttendanceTrainingId))
    if (!target) return
    setSelectedTrainingId(target.id)
    setActiveTab('attendance')
  }, [openAttendanceTrainingId, trainings])

  const [selectedTrainingDetails, setSelectedTrainingDetails] =
    useState(null)
  const [expandedExerciseImage, setExpandedExerciseImage] = useState(null)

  useEffect(() => {
    if (!trainings.length) {
      setSelectedTrainingId(null)
      return
    }

    if (!trainings.some((training) => training.id === selectedTrainingId)) {
      setSelectedTrainingId(trainings[0].id)
    }
  }, [trainings, selectedTrainingId])

  useEffect(() => {
    if (!expandedExerciseImage) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setExpandedExerciseImage(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [expandedExerciseImage])

  useEffect(() => {
    document.body.style.overflow = expandedExerciseImage ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [expandedExerciseImage])

  useEffect(() => {
    let cancelled = false

    async function loadLibrary() {
      try {
        setTemplatesLoading(true)
        const session = await getCurrentSession()
        if (!session?.user?.id) return

        const templates = await loadTrainingTemplates(session.user.id)
        if (!cancelled) {
          setTrainingTemplates(templates)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false)
        }
      }
    }

    loadLibrary()

    return () => {
      cancelled = true
    }
  }, [])

  const [newPlayer, setNewPlayer] = useState({
    name: '',
    birthYear: '',
    position: 'Középpályás',
    number: '',
  })

  const [newTraining, setNewTraining] = useState({
    date: '',
    startTime: '17:00',
    endTime: '18:30',
    title: '',
    plan: createDefaultTrainingPlan(),
  })

  const [newCalendarEvent, setNewCalendarEvent] = useState({
    type: 'match',
    title: '',
    date: '',
    startTime: '17:00',
    endTime: '18:30',
  })

  const [aiSettings, setAiSettings] = useState({
    duration: '90',
    objective: 'Labdakihozatal',
    intensity: 'Közepes',
    extraRequest: '',
  })

  const [attendanceSaved, setAttendanceSaved] =
    useState(false)

  const selectedTraining =
    trainings.find(
      (training) => training.id === selectedTrainingId,
    ) || trainings[0]

  function formatDate(dateString) {
    if (!dateString) return ''

    const date = new Date(`${dateString}T12:00:00`)

    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatShortDate(dateString) {
    if (!dateString) return ''

    const date = new Date(`${dateString}T12:00:00`)

    return date.toLocaleDateString(language === 'en' ? 'en-US' : 'hu-HU', {
      month: 'short',
      day: 'numeric',
    })
  }

  function getInitials(name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
  }

  /* =====================================================
     PLAYER
  ===================================================== */

  function updateNewPlayer(field, value) {
    setNewPlayer((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetPlayerForm() {
    setNewPlayer({
      name: '',
      birthYear: '',
      position: 'Kozep-palyas',
      number: '',
    })
    setEditingPlayer(null)
  }

  function closePlayerForm() {
    setShowAddPlayer(false)
    resetPlayerForm()
  }

  function openEditPlayer(player) {
    setNewPlayer({
      name: player.name,
      birthYear: player.birthYear || '',
      position: player.position || 'Kozep-palyas',
      number: player.number || '',
    })
    setEditingPlayer(player)
    setSelectedPlayer(null)
    setShowAddPlayer(true)
  }

  function handleDeletePlayer(player) {
    if (!window.confirm(`${player.name} ${t('deletePlayerConfirm')}`)) return

    if (onDeletePlayer) {
      onDeletePlayer(player.id)
    } else {
      setLocalPlayers((currentPlayers) =>
        currentPlayers.filter((item) => item.id !== player.id),
      )
    }

    setTrainings((currentTrainings) =>
      currentTrainings.map((training) => {
        if (sharedTrainings && training.teamId !== team.id) {
          return training
        }
        const attendance = { ...training.attendance }
        delete attendance[player.id]
        return { ...training, attendance }
      }),
    )
    setSelectedPlayer(null)
  }

  function handleAddPlayer(event) {
    event.preventDefault()

    if (!newPlayer.name.trim()) return

    const player = {
      ...editingPlayer,
      id: editingPlayer?.id || Date.now(),
      name: newPlayer.name.trim(),
      position: newPlayer.position,
      birthYear: newPlayer.birthYear,
      number: newPlayer.number,
      attendance: 0,
      trainings: 0,
      present: 0,
      absent: 0,
    }

    if (editingPlayer) {
      if (onUpdatePlayer) {
        onUpdatePlayer({ ...player, teamId: team.id })
      } else {
        setLocalPlayers((currentPlayers) =>
          currentPlayers.map((currentPlayer) =>
            currentPlayer.id === player.id ? player : currentPlayer,
          ),
        )
      }

      closePlayerForm()
      return
    }

    if (onAddPlayer) {
      onAddPlayer({ ...player, teamId: team.id })
    } else {
      setLocalPlayers((currentPlayers) => [
        ...currentPlayers,
        player,
      ])
    }

    setTrainings((currentTrainings) =>
      currentTrainings.map((training) => {
        if (sharedTrainings && training.teamId !== team.id) {
          return training
        }

        return {
          ...training,
          attendance: {
            ...training.attendance,
            [player.id]: 'present',
          },
        }
      }),
    )

    setNewPlayer({
      name: '',
      birthYear: '',
      position: 'Középpályás',
      number: '',
    })

    setShowAddPlayer(false)
  }

  /* =====================================================
     CALENDAR EVENTS
  ===================================================== */

  function updateCalendarEvent(field, value) {
    setNewCalendarEvent((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openAddCalendarEvent(date = '') {
    setNewCalendarEvent({
      type: 'match',
      title: '',
      date,
      startTime: '17:00',
      endTime: '18:30',
    })

    setShowAddCalendarEvent(true)
  }

  function closeCalendarEventModal() {
    setShowAddCalendarEvent(false)

    setNewCalendarEvent({
      type: 'match',
      title: '',
      date: '',
      startTime: '17:00',
      endTime: '18:30',
    })
  }

  function handleSaveCalendarEvent(event) {
    event.preventDefault()

    if (!newCalendarEvent.date || !newCalendarEvent.title.trim()) {
      return
    }

    const prefix = {
      training: '⚽',
      match: '🏆',
      other: '📋',
    }[newCalendarEvent.type]

    const calendarTraining = {
      id: Date.now(),
      teamId: team.id,
      date: newCalendarEvent.date,
      startTime: newCalendarEvent.startTime,
      endTime: newCalendarEvent.endTime,
      title: `${prefix} ${newCalendarEvent.title.trim()}`,
      calendarType: newCalendarEvent.type,
      attendance: Object.fromEntries(
        players.map((player) => [
          player.id,
          'present',
        ]),
      ),
    }

    setTrainings((currentTrainings) => [
      calendarTraining,
      ...currentTrainings,
    ])

    setSelectedTrainingId(calendarTraining.id)
    closeCalendarEventModal()
    setActiveTab('trainings')
  }

  /* =====================================================
     TRAININGS
  ===================================================== */

  function updateNewTraining(field, value) {
    setNewTraining((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openNewTrainingChoice() {
    setShowNewTrainingChoice(true)
  }

  function openAddTraining() {
    setShowNewTrainingChoice(false)
    setNewTraining({
      date: '',
      startTime: '17:00',
      endTime: '18:30',
      title: '',
      plan: createDefaultTrainingPlan(),
    })

    setEditingTraining(null)
    setShowAddTraining(true)
  }

  function openEditTraining(training) {
    setNewTraining({
      date: training.date,
      startTime: training.startTime,
      endTime: training.endTime,
      title: training.title,
      plan: normalizeTrainingPlan(training.plan),
    })

    setEditingTraining(training)
    setShowAddTraining(false)
  }

  function closeTrainingModal() {
    setShowAddTraining(false)
    setEditingTraining(null)

    setNewTraining({
      date: '',
      startTime: '17:00',
      endTime: '18:30',
      title: '',
      plan: createDefaultTrainingPlan(),
    })
  }

  function handleSaveTraining(event) {
    event.preventDefault()

    if (
      !newTraining.date ||
      !newTraining.title.trim()
    ) {
      return
    }

    if (editingTraining) {
      setTrainings((currentTrainings) =>
        currentTrainings.map((training) => {
          if (training.id !== editingTraining.id) {
            return training
          }

          return {
            ...training,
            date: newTraining.date,
            startTime: newTraining.startTime,
            endTime: newTraining.endTime,
            title: newTraining.title.trim(),
            plan: normalizeTrainingPlan(newTraining.plan),
          }
        }),
      )

      closeTrainingModal()
      return
    }

    const training = {
      id: Date.now(),
      teamId: team.id,
      date: newTraining.date,
      startTime: newTraining.startTime,
      endTime: newTraining.endTime,
      title: newTraining.title.trim(),
      plan: normalizeTrainingPlan(newTraining.plan),
      attendance: Object.fromEntries(
        players.map((player) => [
          player.id,
          'present',
        ]),
      ),
    }

    setTrainings((currentTrainings) => [
      training,
      ...currentTrainings,
    ])

    setSelectedTrainingId(training.id)
    setActiveTab('trainings')

    closeTrainingModal()
  }

  function handleDeleteTraining(trainingId) {
    const training = trainings.find(
      (item) => item.id === trainingId,
    )

    if (!training) return

    setTrainingToDelete(training)
  }

  function confirmDeleteTraining() {
    if (!trainingToDelete) return

    const trainingId = trainingToDelete.id

    const remainingTrainings = trainings.filter(
      (item) => item.id !== trainingId,
    )

    setTrainings((currentTrainings) =>
      currentTrainings.filter((item) => item.id !== trainingId),
    )

    if (selectedTrainingId === trainingId) {
      if (remainingTrainings.length > 0) {
        setSelectedTrainingId(
          remainingTrainings[0].id,
        )
      } else {
        setSelectedTrainingId(null)
      }

      setActiveTab('trainings')
    }

    setTrainingToDelete(null)
  }

  /* =====================================================
     TRAINING LIBRARY
  ===================================================== */

  async function openTrainingLibrary() {
    setShowTrainingLibrary(true)

    try {
      setTemplatesLoading(true)
      const session = await getCurrentSession()
      if (!session?.user?.id) return

      const templates = await loadTrainingTemplates(session.user.id)
      setTrainingTemplates(templates)
    } catch (error) {
      console.error(error)
      window.alert(error.message || t('libraryLoadError'))
    } finally {
      setTemplatesLoading(false)
    }
  }

  function startTrainingFromTemplate(template) {
    setNewTraining({
      date: '',
      startTime: '17:00',
      endTime: '18:30',
      title: template.name,
      plan: normalizeTrainingPlan(
        (template.plan || []).map((exercise) => ({ ...exercise })),
      ),
    })

    setEditingTraining(null)
    setShowTrainingLibrary(false)
    setShowAddTraining(true)
  }

  async function saveTrainingAsTemplate(training) {
    if (!training) return

    try {
      setTemplateSaving(true)
      const session = await getCurrentSession()

      if (!session?.user?.id) {
        throw new Error('Nincs aktív bejelentkezés.')
      }

      const created = await createTrainingTemplate(session.user.id, {
        teamId: team.id,
        name: templateName.trim() || training.title || 'Mentett edzés',
        duration: getTrainingPlan(training).reduce(
          (sum, exercise) => sum + (Number(exercise.duration) || 0),
          0,
        ),
        plan: normalizeTrainingPlan(
          (getTrainingPlan(training) || []).map((exercise) => ({ ...exercise })),
        ),
      })

      setTrainingTemplates((current) => [created, ...current])
      setTemplateName('')
      window.alert(t('trainingSavedToLibrary'))
    } catch (error) {
      console.error(error)
      window.alert(error.message || t('trainingSaveError'))
    } finally {
      setTemplateSaving(false)
    }
  }

  async function handleDeleteTemplate(template) {
    if (!template) return

    const confirmed = window.confirm(
      `${t('deleteTemplateConfirm')} "${template.name}"?`,
    )
    if (!confirmed) return

    try {
      const session = await getCurrentSession()
      if (!session?.user?.id) {
        throw new Error('Nincs aktív bejelentkezés.')
      }

      await deleteTrainingTemplate(session.user.id, template.id)
      setTrainingTemplates((current) =>
        current.filter((item) => item.id !== template.id),
      )
      setTemplateToDelete(null)
    } catch (error) {
      console.error(error)
      window.alert(error.message || t('templateDeleteError'))
    }
  }

  /* =====================================================
     AI
  ===================================================== */

  function updateAISetting(field, value) {
    setAiSettings((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openAIPlanner() {
    setAiResult(null)
    setAiGenerating(false)

    setAiSettings({
      duration: '90',
      objective: 'Labdakihozatal',
      intensity: 'Közepes',
      extraRequest: '',
    })

    setShowAIPlanner(true)
  }

  function closeAIPlanner() {
    setShowAIPlanner(false)
    setAiResult(null)
    setAiGenerating(false)
  }

  async function generateAITraining() {
    setAiGenerating(true)
    setAiResult(null)

    const payload = {
      team: {
        ...team,
        players: players.length,
      },
      duration: Number(aiSettings.duration),
      objective: aiSettings.objective,
      intensity: aiSettings.intensity,
      extraRequest: aiSettings.extraRequest,
    }

    try {
      const cloudResult = await generateAITrainingWithCloud(payload)
      const result = cloudResult?.exercises?.length
        ? cloudResult
        : generateSmartTraining(payload)

      setAiResult(result)
    } catch (error) {
      console.warn(error)
      setAiResult(generateSmartTraining(payload))
    } finally {
      setAiGenerating(false)
    }
  }

  function saveAITraining() {
    if (!aiResult) return

    const today = new Date()

    const dateString = today
      .toISOString()
      .slice(0, 10)

    const training = {
      id: Date.now(),
      teamId: team.id,
      date: dateString,
      startTime: '17:00',
      endTime: '18:30',
      title: aiResult.title,
      aiGenerated: true,
      plan: normalizeTrainingPlan(
        aiResult.exercises.map((exercise) => ({
          name: exercise.name,
          duration: exercise.duration,
          description: exercise.description,
          image: exercise.image || '',
        })),
      ),
      attendance: Object.fromEntries(
        players.map((player) => [
          player.id,
          'present',
        ]),
      ),
    }

    setTrainings((currentTrainings) => [
      training,
      ...currentTrainings,
    ])

    setSelectedTrainingId(training.id)
    setShowAIPlanner(false)
    setAiResult(null)
    setActiveTab('trainings')
  }

  function getTrainingPlan(training) {
    if (training?.plan?.length) {
      return training.plan
    }

    return [
      {
        name: 'Bemelegítés',
        duration: 15,
        description:
          'Dinamikus mozgás és labdás technikai feladatok fokozatos intenzitással.',
      },
      {
        name: training?.title || 'Fő gyakorlat',
        duration: 25,
        description:
          'A mai edzés fő céljához kapcsolódó technikai és taktikai gyakorlatok.',
      },
      {
        name: 'Kisjáték',
        duration: 30,
        description:
          'Játékhelyzetekben alkalmazzuk az edzés során gyakorolt elemeket.',
      },
      {
        name: 'Levezetés',
        duration: 10,
        description:
          'Könnyű mozgás, mobilizáció és rövid levezetés.',
      },
    ]
  }

  function getTrainingAttendance(training) {
    const present = players.filter(
      (player) => training?.attendance?.[player.id] === 'present',
    ).length
    const absent = players.filter(
      (player) => training?.attendance?.[player.id] === 'absent',
    ).length
    const excused = players.filter(
      (player) => training?.attendance?.[player.id] === 'excused',
    ).length

    return {
      present,
      absent,
      excused,
      total: players.length,
    }
  }

  function getPlayerOverallAttendance(playerId) {
    const relevantTrainings = trainings.filter((training) => {
      const type = training.calendarType || 'training'
      return type === 'training' && training.attendance
    })

    let present = 0
    let absent = 0
    let excused = 0

    relevantTrainings.forEach((training) => {
      const status = training.attendance?.[playerId] || 'present'
      if (status === 'present') present += 1
      else if (status === 'absent') absent += 1
      else if (status === 'excused') excused += 1
    })

    const counted = present + absent

    return {
      trainings: relevantTrainings.length,
      present,
      absent,
      excused,
      attendance: counted ? Math.round((present / counted) * 100) : 0,
    }
  }

  /* =====================================================
     ATTENDANCE
  ===================================================== */

  function getAttendanceStatus(playerId) {
    return (
      selectedTraining?.attendance?.[playerId] ||
      'present'
    )
  }

  function changeAttendance(playerId) {
    setAttendanceSaved(false)

    setTrainings((currentTrainings) =>
      currentTrainings.map((training) => {
      if (training.id !== selectedTrainingId) {
        return training
      }

      const currentStatus =
        training.attendance?.[playerId] || 'present'

      const nextStatus =
        currentStatus === 'present'
          ? 'absent'
          : currentStatus === 'absent'
            ? 'excused'
            : 'present'

      return {
        ...training,
        attendance: {
          ...(training.attendance || {}),
          [playerId]: nextStatus,
        },
      }
      }),
    )
  }

  function saveAttendance() {
    setAttendanceSaved(true)

    setTimeout(() => {
      setAttendanceSaved(false)
    }, 2500)
  }

  const attendanceStats = players.reduce(
    (stats, player) => {
      const status = getAttendanceStatus(player.id)

      if (status === 'present') {
        stats.present += 1
      }

      if (status === 'absent') {
        stats.absent += 1
      }

      return stats
    },
    {
      present: 0,
      absent: 0,
    },
  )

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="team-page">

      {/* BACK */}

      <button
        className="team-back-button"
        onClick={onBack}
      >
        ← {t('backToTeams')}
      </button>

      {/* HEADER */}

      <div className="team-page-header">

        <div>

          <div className="eyebrow">
            {t('teamLabel')}
          </div>

          <h1>
            {team?.name || 'U13'}
          </h1>

          <p>
            {team?.age || 'U12–U13'} ·{' '}
            {players.length} {t('players').toLowerCase()} · {team?.attendance ?? 0}% {t('averageAttendanceLabel')}
          </p>

        </div>

        <div className="team-header-actions">
          <button
            className="neon-button"
            onClick={openNewTrainingChoice}
          >
            + {t('newTraining')}
          </button>
        </div>

      </div>

      {/* TABS */}

      <div className="team-tabs">

        <button
          className={
            activeTab === 'players'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('players')
          }
        >
          {t('players')}
        </button>

        <button
          className={
            activeTab === 'trainings'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('trainings')
          }
        >
          {t('trainings')}
        </button>

        <button
          className={
            activeTab === 'attendance'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab('attendance')
          }
        >
          {t('attendance')}
        </button>

      </div>

      {/* =================================================
          PLAYERS
      ================================================= */}

      {activeTab === 'players' && (
        <div className="team-content">

          <div className="content-header">

            <div>

              <span className="card-label">
                {t('squad')}
              </span>

              <h2>
                {t('players')}
              </h2>

            </div>

            <button
              className="secondary-button"
              onClick={() =>
                setShowAddPlayer(true)
              }
            >
              + {t('addPlayer')}
            </button>

          </div>

          <div className="players-list">

            {players.map((player) => (

              <button
                key={player.id}
                className="player-card"
                onClick={() =>
                  setSelectedPlayer(player)
                }
              >

                <div className="player-avatar">
                  {getInitials(player.name)}
                </div>

                <div className="player-info">

                  <strong>
                    {player.name}
                  </strong>

                  <span>
                    {player.position}
                  </span>

                </div>

                <div className="player-arrow">
                  →
                </div>

              </button>

            ))}

          </div>

        </div>
      )}

      {/* =================================================
          TRAININGS
      ================================================= */}

      {activeTab === 'trainings' && (
        <div className="team-content">

          {/* NINCS ITT TÖBB GOMB */}

          <div className="content-header">

            <div>

              <span className="card-label">
                {t('trainingCalendar')}
              </span>

              <h2>
                {t('trainings')}
              </h2>

            </div>

            <div className="team-training-header-actions">
              <button
                className="neon-button training-inline-new-button"
                onClick={openNewTrainingChoice}
              >
                + {t('newTraining')}
              </button>

              <button
                className="secondary-button"
                onClick={openTrainingLibrary}
              >
                📚 {t('trainingLibrary')}
              </button>

              <button
                className="secondary-button"
                onClick={() => openAddCalendarEvent()}
              >
                + {t('calendarEvent')}
              </button>
            </div>

          </div>

          <div className="training-list">

            {trainings.length === 0 && (
              <div className="empty-team-tab">

                <div className="placeholder-icon">
                  ⚽
                </div>

                <h2>
                  {t('noTrainings')}
                </h2>

                <p>
                  {t('createFirstTraining')}
                </p>

                <button
                  className="neon-button"
                  onClick={openNewTrainingChoice}
                >
                  + {t('newTraining')}
                </button>

              </div>
            )}

            {trainings.map((training) => (

              <div
                key={training.id}
                className="training-card-wrapper"
              >

                <button
                  className="training-card"
                  onClick={() => {
                    setSelectedTrainingDetails(training)
                  }}
                >

                  <div className="training-date">

                    <span>
                      {formatShortDate(
                        training.date,
                      )}
                    </span>

                    <strong>
                      {training.date.slice(-2)}
                    </strong>

                  </div>

                  <div className="training-info">

                    <div className="training-title-row">

                      <strong>
                        {training.title}
                      </strong>

                      {training.aiGenerated && (
                        <span className="ai-training-badge">
                          AI
                        </span>
                      )}

                    </div>

                    <span>
                      {formatDate(
                        training.date,
                      )}{' '}
                      · {training.startTime}–
                      {training.endTime}
                    </span>

                  </div>

                  <div className="training-arrow">
                    →
                  </div>

                </button>

                <div className="training-actions">

                  <button
                    className="training-action-button"
                    title={t('edit')}
                    onClick={() =>
                      openEditTraining(training)
                    }
                  >
                    ✎
                  </button>

                  <button
                    className="training-action-button danger"
                    title={t('delete')}
                    onClick={() =>
                      handleDeleteTraining(
                        training.id,
                      )
                    }
                  >
                    ×
                  </button>

                </div>

              </div>

            ))}

          </div>

        </div>
      )}

      {/* =================================================
          ATTENDANCE
      ================================================= */}

      {activeTab === 'attendance' &&
        selectedTraining && (
          <div className="attendance-page">

            <div className="attendance-top">

              <div>

                <span className="card-label">
                  {t('attendanceSheet')}
                </span>

                <h2>
                  {selectedTraining.title}
                </h2>

                <p>
                  {formatDate(
                    selectedTraining.date,
                  )}{' '}
                  · {selectedTraining.startTime}–
                  {selectedTraining.endTime}
                </p>

              </div>

              <select
                className="attendance-select"
                value={selectedTrainingId}
                onChange={(event) => {
                  setSelectedTrainingId(
                    Number(event.target.value),
                  )

                  setAttendanceSaved(false)
                }}
              >

                {trainings.map((training) => (

                  <option
                    key={training.id}
                    value={training.id}
                  >
                    {formatDate(
                      training.date,
                    )}{' '}
                    · {training.startTime}
                  </option>

                ))}

              </select>

            </div>

            <div className="attendance-summary">

              <div className="attendance-summary-card">

                <span>
                  {t('present').toUpperCase()}
                </span>

                <strong>
                  {attendanceStats.present}
                </strong>

              </div>

              <div className="attendance-summary-card">

                <span>
                  {t('absent').toUpperCase()}
                </span>

                <strong>
                  {attendanceStats.absent}
                </strong>

              </div>

              <div className="attendance-summary-card">

                <span>
                  {t('total').toUpperCase()}
                </span>

                <strong>
                  {players.length}
                </strong>

              </div>

            </div>

            <div className="attendance-list">

              {players.map((player) => {

                const status =
                  getAttendanceStatus(
                    player.id,
                  )

                return (
                  <button
                    key={player.id}
                    className={`attendance-player ${status}`}
                    onClick={() =>
                      changeAttendance(
                        player.id,
                      )
                    }
                  >

                    <div className="player-avatar">
                      {getInitials(
                        player.name,
                      )}
                    </div>

                    <div className="attendance-player-info">

                      <strong>
                        {player.name}
                      </strong>

                      <span>
                        {player.position}
                      </span>

                    </div>

                    <div
                      className={`attendance-status-icon-only ${status}`}
                      aria-label={
                        status === 'present'
                          ? t('present')
                          : status === 'absent'
                            ? t('absent')
                            : t('excused')
                      }
                    >
                      {status === 'present'
                        ? '✓'
                        : status === 'absent'
                          ? '×'
                          : '◷'}
                    </div>

                  </button>
                )
              })}

            </div>

            <div className="attendance-footer">

              <span>
                {t('attendanceHint')}
              </span>

              <span className="attendance-auto-save">
                {attendanceSaved ? `✓ ${t('saved')}` : `● ${t('autoSaved')}`}
              </span>

            </div>

          </div>
        )}

      {/* =================================================
          TRAINING DETAILS
      ================================================= */}

      {selectedTrainingDetails && (
        <div
          className="player-modal-backdrop"
          onClick={() =>
            setSelectedTrainingDetails(null)
          }
        >
          <div
            className="player-modal training-details-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="player-modal-close"
              onClick={() =>
                setSelectedTrainingDetails(null)
              }
            >
              ×
            </button>

            <div className="player-modal-eyebrow">
              {t('trainingDetails')}
            </div>

            <h2>
              {selectedTrainingDetails.title}
            </h2>

            <p className="player-modal-position">
              {formatDate(selectedTrainingDetails.date)}
              {' · '}
              {selectedTrainingDetails.startTime}–
              {selectedTrainingDetails.endTime}
            </p>

            <div className="training-detail-summary">
              {(() => {
                const stats =
                  getTrainingAttendance(
                    selectedTrainingDetails,
                  )

                return (
                  <>
                    <div className="training-detail-stat">
                      <span>{t('present').toUpperCase()}</span>
                      <strong>{stats.present}</strong>
                    </div>

                    <div className="training-detail-stat">
                      <span>{t('absent').toUpperCase()}</span>
                      <strong>{stats.absent}</strong>
                    </div>

                    <div className="training-detail-stat">
                      <span>{t('excused').toUpperCase()}</span>
                      <strong>{stats.excused}</strong>
                    </div>

                    <div className="training-detail-stat">
                      <span>{t('total').toUpperCase()}</span>
                      <strong>{stats.total}</strong>
                    </div>
                  </>
                )
              })()}
            </div>

            <div className="training-plan-header">
              <div>
                <span className="card-label">
                  {t('trainingPlan').toUpperCase()}
                </span>
                <h3>{t('todayProgram')}</h3>
              </div>
            </div>

            <div className="training-plan-list">
              {getTrainingPlan(
                selectedTrainingDetails,
              ).map((exercise, index) => (
                <div
                  className="training-plan-item"
                  key={`${exercise.name}-${index}`}
                >
                  <div className="training-plan-number">
                    {String(index + 1).padStart(2, '0')}
                  </div>

                  <div className="training-plan-content">
                    <div>
                      <strong>
                        {exercise.name}
                      </strong>

                      <span>
                        {exercise.duration} {t('minutes')}
                      </span>
                    </div>

                    <p>
                      {exercise.description}
                    </p>

                    {exercise.image && (
                      <button
                        type="button"
                        className="training-detail-exercise-image-button"
                        onClick={() =>
                          setExpandedExerciseImage({
                            src: exercise.image,
                            alt: exercise.name,
                          })
                        }
                        aria-label={`${exercise.name} - ${t('viewImage')}`}
                      >
                        <img
                          className="training-detail-exercise-image"
                          src={exercise.image}
                          alt={exercise.name}
                        />
                        <span className="training-detail-image-hint">
                          {t('viewImage')}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="training-template-save-row">
              <input
                type="text"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder={t('templateNameOptional')}
                aria-label={t('templateName')}
              />

              <button
                type="button"
                className="secondary-button"
                disabled={templateSaving}
                onClick={() => saveTrainingAsTemplate(selectedTrainingDetails)}
              >
                {templateSaving ? t('saving') : `📚 ${t('saveToLibrary')}`}
              </button>
            </div>

            <div className="training-details-actions">
              <button
                type="button"
                className="secondary-button training-pdf-button"
                onClick={() =>
                  downloadTrainingPdf({
                    team,
                    training: selectedTrainingDetails,
                    plan: getTrainingPlan(
                      selectedTrainingDetails,
                    ),
                    attendance:
                      getTrainingAttendance(
                        selectedTrainingDetails,
                      ),
                  })
                }
              >
                ↓ PDF
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setSelectedTrainingId(
                    selectedTrainingDetails.id,
                  )
                  setSelectedTrainingDetails(null)
                  setActiveTab('attendance')
                }}
              >
                ✓ {t('attendanceSheet')}
              </button>

              <button
                className="neon-button"
                onClick={() => {
                  const training =
                    selectedTrainingDetails

                  setSelectedTrainingDetails(null)
                  openEditTraining(training)
                }}
              >
                ✎ {t('editTraining')}
              </button>
            </div>
          </div>
        </div>
      )}

      {expandedExerciseImage && (
        <div
          className="exercise-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={expandedExerciseImage.alt}
          onClick={() => setExpandedExerciseImage(null)}
        >
          <button
            type="button"
            className="exercise-image-lightbox-close"
            onClick={() => setExpandedExerciseImage(null)}
            aria-label={t('close')}
          >
            ×
          </button>
          <img
            src={expandedExerciseImage.src}
            alt={expandedExerciseImage.alt}
            className="exercise-image-lightbox-image"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {/* =================================================
          TRAINING LIBRARY
      ================================================= */}

      {showTrainingLibrary && (
        <div
          className="player-modal-backdrop"
          onClick={() => setShowTrainingLibrary(false)}
        >
          <div
            className="player-modal training-library-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="player-modal-close"
              onClick={() => setShowTrainingLibrary(false)}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">
              {t('trainingLibrary').toUpperCase()}
            </div>

            <h2>{t('savedTrainings')}</h2>

            <p className="player-modal-position">
              {t('libraryTrainingDescription')}
            </p>

            {templatesLoading ? (
              <div className="training-library-empty">
                {t('loadingTrainings')}
              </div>
            ) : trainingTemplates.length === 0 ? (
              <div className="training-library-empty">
                <div className="placeholder-icon">📚</div>
                <strong>{t('noSavedTrainings')}</strong>
                <span>
                  {t('saveToLibraryHint')}
                </span>
              </div>
            ) : (
              <div className="training-library-list">
                {trainingTemplates.map((template) => (
                  <div className="training-library-item" key={template.id}>
                    <div className="training-library-item-info">
                      <strong>{template.name}</strong>
                      <span>
                        {template.duration || 0} {t('minutesShort')} · {(template.plan || []).length} {t('exercises')}
                      </span>
                    </div>

                    <div className="training-library-item-actions">
                      <button
                        type="button"
                        className="training-action-button danger"
                        title={t('deleteTemplate')}
                        onClick={() => handleDeleteTemplate(template)}
                      >
                        ×
                      </button>

                      <button
                        type="button"
                        className="neon-button"
                        onClick={() => startTrainingFromTemplate(template)}
                      >
                        {t('useTemplate')} →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="player-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowTrainingLibrary(false)}
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          PLAYER DETAILS
      ================================================= */}

      {selectedPlayer && (
        <div
          className="player-modal-backdrop"
          onClick={() =>
            setSelectedPlayer(null)
          }
        >

          <div
            className="player-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="player-modal-close"
              onClick={() =>
                setSelectedPlayer(null)
              }
            >
              ×
            </button>

            <div className="player-modal-avatar">
              {getInitials(
                selectedPlayer.name,
              )}
            </div>

            <div className="player-modal-eyebrow">
              {t('player').toUpperCase()}
            </div>

            <h2>
              {selectedPlayer.name}
            </h2>

            <p className="player-modal-position">
              {selectedPlayer.position}
            </p>

            {(() => {
              const stats = getPlayerOverallAttendance(selectedPlayer.id)

              return (
                <div className="player-detail-grid">

                  <div className="player-detail-card">
                    <span>{t('attendance').toUpperCase()}</span>
                    <strong>{stats.attendance}%</strong>
                  </div>

                  <div className="player-detail-card">
                    <span>{t('trainings').toUpperCase()}</span>
                    <strong>{stats.trainings}</strong>
                  </div>

                  <div className="player-detail-card">
                    <span>{t('wasPresent')}</span>
                    <strong>{stats.present}</strong>
                  </div>

                  <div className="player-detail-card">
                    <span>{t('wasAbsent')}</span>
                    <strong>{stats.absent}</strong>
                  </div>

                </div>
              )
            })()}

            <div className="player-extra-info">

              <div>
                <span>{t('birthYear')}</span>

                <strong>
                  {selectedPlayer.birthYear ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>{t('shirtNumber')}</span>

                <strong>
                  {selectedPlayer.number ||
                    '—'}
                </strong>
              </div>

            </div>

            <div className="player-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => openEditPlayer(selectedPlayer)}
              >
                {t('edit')}
              </button>
              <button
                type="button"
                className="delete-confirm-button"
                onClick={() => handleDeletePlayer(selectedPlayer)}
              >
                {t('delete')}
              </button>
            </div>

            <button
              className="player-modal-button"
              onClick={() =>
                setSelectedPlayer(null)
              }
            >
              {t('close')}
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          ADD PLAYER
      ================================================= */}

      {showAddPlayer && (
        <div
          className="player-modal-backdrop"
          onClick={closePlayerForm}
        >

          <form
            className="player-modal add-player-modal"
            onSubmit={handleAddPlayer}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="player-modal-close"
              onClick={closePlayerForm}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">
              ÚJ {t('player').toUpperCase()}
            </div>

            <h2>
              {t('addPlayer')}
            </h2>

            <p className="player-modal-position">
              {t('playerFormDescription')}
            </p>

            <div className="player-form">

              <div className="form-group">

                <label>{t('name').toUpperCase()}</label>

                <input
                  type="text"
                  value={newPlayer.name}
                  onChange={(event) =>
                    updateNewPlayer(
                      'name',
                      event.target.value,
                    )
                  }
                  placeholder={t('playerNamePlaceholder')}
                  autoFocus
                  required
                />

              </div>

              <div className="player-form-row">

                <div className="form-group">

                  <label>{t('birthYear')}</label>

                  <input
                    type="number"
                    value={newPlayer.birthYear}
                    onChange={(event) =>
                      updateNewPlayer(
                        'birthYear',
                        event.target.value,
                      )
                    }
                    placeholder="2013"
                  />

                </div>

                <div className="form-group">

                  <label>{t('shirtNumber')}</label>

                  <input
                    type="number"
                    value={newPlayer.number}
                    onChange={(event) =>
                      updateNewPlayer(
                        'number',
                        event.target.value,
                      )
                    }
                    placeholder="8"
                    min="1"
                    max="99"
                  />

                </div>

              </div>

              <div className="form-group">

                <label>{t('position').toUpperCase()}</label>

                <select
                  value={newPlayer.position}
                  onChange={(event) =>
                    updateNewPlayer(
                      'position',
                      event.target.value,
                    )
                  }
                >
                  <option value="Kapus">{t('goalkeeper')}</option>
                  <option value="Védő">{t('defender')}</option>
                  <option value="Szélső védő">{t('fullBack')}</option>
                  <option value="Középpályás">{t('midfielder')}</option>
                  <option value="Szélső">{t('winger')}</option>
                  <option value="Támadó">{t('forward')}</option>
                </select>

              </div>

            </div>

            <div className="player-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={closePlayerForm}
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="neon-button"
              >
                {t('addPlayer')}
              </button>

            </div>

          </form>

        </div>
      )}

      {showNewTrainingChoice && (
        <TrainingCreationChooser
          t={t}
          onClose={() => setShowNewTrainingChoice(false)}
          onPlan={openAddTraining}
          onLibrary={() => {
            setShowNewTrainingChoice(false)
            openTrainingLibrary()
          }}
          onAI={() => {
            setShowNewTrainingChoice(false)
            openAIPlanner()
          }}
        />
      )}

      {/* =================================================
          ADD / EDIT TRAINING
      ================================================= */}

      {(showAddTraining || editingTraining) && (
        <TrainingEditorModal
          t={t}
          open
          editingTraining={editingTraining}
          value={newTraining}
          onChange={setNewTraining}
          onClose={closeTrainingModal}
          onSave={handleSaveTraining}
        />
      )}

      {/* =================================================
          CALENDAR EVENT MODAL
      ================================================= */}

      {showAddCalendarEvent && (
        <div
          className="player-modal-backdrop"
          onClick={closeCalendarEventModal}
        >
          <form
            className="player-modal add-player-modal"
            onSubmit={handleSaveCalendarEvent}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="player-modal-close"
              onClick={closeCalendarEventModal}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">
              {t('calendar').toUpperCase()}
            </div>

            <h2>
              {t('addEvent')}
            </h2>

            <p className="player-modal-position">
              {t('addEventDescription')}
            </p>

            <div className="player-form">

              <div className="form-group">
                <label>{t('eventType').toUpperCase()}</label>

                <select
                  value={newCalendarEvent.type}
                  onChange={(event) =>
                    updateCalendarEvent(
                      'type',
                      event.target.value,
                    )
                  }
                >
                  <option value="training">⚽ {t('training')}</option>
                  <option value="match">🏆 {t('match')}</option>
                  <option value="other">📋 {t('other')}</option>
                </select>
              </div>

              <div className="form-group">
                <label>{t('eventName').toUpperCase()}</label>

                <input
                  type="text"
                  value={newCalendarEvent.title}
                  onChange={(event) =>
                    updateCalendarEvent(
                      'title',
                      event.target.value,
                    )
                  }
                  placeholder={t('eventTitlePlaceholder')}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label>{t('date').toUpperCase()}</label>

                <input
                  className="date-input"
                  type="date"
                  value={newCalendarEvent.date}
                  onChange={(event) =>
                    updateCalendarEvent(
                      'date',
                      event.target.value,
                    )
                  }
                  required
                />
              </div>

              <div className="player-form-row">

                <div className="form-group">
                  <label>{t('start').toUpperCase()}</label>

                  <input
                    type="time"
                    value={newCalendarEvent.startTime}
                    onChange={(event) =>
                      updateCalendarEvent(
                        'startTime',
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t('end').toUpperCase()}</label>

                  <input
                    type="time"
                    value={newCalendarEvent.endTime}
                    onChange={(event) =>
                      updateCalendarEvent(
                        'endTime',
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>

              </div>

            </div>

            <div className="player-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={closeCalendarEventModal}
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="neon-button"
              >
                {t('saveEvent')}
              </button>

            </div>
          </form>
        </div>
      )}

      {/* =================================================
          AI PLANNER MODAL
      ================================================= */}

      {showAIPlanner && (
        <div
          className="ai-modal-backdrop"
          onClick={closeAIPlanner}
        >

          <div
            className={`ai-modal ${
              aiResult
                ? 'ai-modal-result'
                : ''
            }`}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              className="ai-modal-close"
              onClick={closeAIPlanner}
            >
              ×
            </button>

            {!aiResult && (
              <>
                <div className="ai-modal-icon">
                  ✨
                </div>

                <div className="ai-modal-eyebrow">
                  {t('aiPlanner')}
                </div>

                <h2>
                  {t('planYourTraining')}
                </h2>

                <p className="ai-modal-description">
                  {t('aiPlannerDescription')}
                </p>

                <div className="ai-form">

                  <div className="ai-form-info">

                    <span>
                      {t('teamLabel')}
                    </span>

                    <strong>
                      {team?.name || 'U13'}
                    </strong>

                    <small>
                      {team?.age || 'U12–U13'} · {players.length} {t('players').toLowerCase()}
                    </small>

                  </div>

                  <div className="ai-form-row">

                    <div className="form-group">

                      <label>
                        {t('duration').toUpperCase()}
                      </label>

                      <select
                        value={
                          aiSettings.duration
                        }
                        onChange={(event) =>
                          updateAISetting(
                            'duration',
                            event.target.value,
                          )
                        }
                      >
                        <option value="60">
                          60 {t('minutes')}
                        </option>

                        <option value="75">
                          75 {t('minutes')}
                        </option>

                        <option value="90">
                          90 {t('minutes')}
                        </option>

                        <option value="120">
                          120 {t('minutes')}
                        </option>
                      </select>

                    </div>

                    <div className="form-group">

                      <label>
                        {t('intensity').toUpperCase()}
                      </label>

                      <select
                        value={
                          aiSettings.intensity
                        }
                        onChange={(event) =>
                          updateAISetting(
                            'intensity',
                            event.target.value,
                          )
                        }
                      >
                        <option value="Alacsony">{t('easy')}</option>

                        <option value="Közepes">{t('medium')}</option>

                        <option value="Magas">{t('high')}</option>
                      </select>

                    </div>

                  </div>

                  <div className="form-group">

                    <label>
                      {t('mainObjective').toUpperCase()}
                    </label>

                    <select
                      value={
                        aiSettings.objective
                      }
                      onChange={(event) =>
                        updateAISetting(
                          'objective',
                          event.target.value,
                        )
                      }
                    >
                      <option value="Labdakihozatal">{t('buildUp')}</option>

                      <option value="Labdabirtoklás">{t('possession')}</option>

                      <option value="Befejezés">{t('finishing')}</option>

                      <option value="Védekezés">{t('defending')}</option>

                      <option value="Átmenetek">{t('transitions')}</option>

                      <option value="Technikai képzés">{t('technical')}</option>

                      <option value="Koordináció">{t('coordination')}</option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      {t('extraRequest').toUpperCase()}{' '}
                      <span>
                        {t('optional')}
                      </span>
                    </label>

                    <textarea
                      value={
                        aiSettings.extraRequest
                      }
                      onChange={(event) =>
                        updateAISetting(
                          'extraRequest',
                          event.target.value,
                        )
                      }
                      placeholder={t('aiExtraRequestPlaceholder')}
                      rows="4"
                    />

                  </div>

                </div>

                <div className="ai-modal-footer">

                  <span className="ai-limit-info">
                    ✨ {t('aiGeneration')}
                  </span>

                  <button
                    className="ai-generate-button"
                    onClick={
                      generateAITraining
                    }
                    disabled={aiGenerating}
                  >
                    {aiGenerating ? (
                      <>
                        <span className="ai-spinner" />
                        {t('creatingTraining')}...
                      </>
                    ) : (
                      <>
                        ✨ {t('generateTraining')}
                      </>
                    )}
                  </button>

                </div>
              </>
            )}

            {aiResult && (
              <>
                <div className="ai-result-header">

                  <div>

                    <div className="ai-modal-eyebrow">
                      AI {t('trainingPlan').toUpperCase()}
                    </div>

                    <h2>
                      {aiResult.title}
                    </h2>

                    <p>
                      {aiResult.duration} {t('minutes')} ·{' '}
                      {aiResult.players} {t('players')} ·{' '}
                      {(aiResult.intensity === 'Magas' ? t('high') : aiResult.intensity === 'Alacsony' ? t('easy') : t('medium')).toLowerCase()} {t('intensity').toLowerCase()}
                    </p>

                  </div>

                  <div className="ai-result-badge">
                    AI
                  </div>

                </div>

                <div className="ai-result-objective">

                  <span>
                    {t('mainObjective').toUpperCase()}
                  </span>

                  <strong>
                    {aiResult.objective}
                  </strong>

                </div>

                <div className="ai-exercise-list">

                  {aiResult.exercises.map(
                    (exercise, index) => (

                      <div
                        key={index}
                        className="ai-exercise-card"
                      >

                        <div className="ai-exercise-number">
                          {String(index + 1).padStart(
                            2,
                            '0',
                          )}
                        </div>

                        <div className="ai-exercise-content">

                          <div className="ai-exercise-top">

                            <strong>
                              {exercise.name}
                            </strong>

                            <span>
                              {exercise.duration}{' '}
                              perc
                            </span>

                          </div>

                          <small>
                            {exercise.type}
                          </small>

                          <p>
                            {exercise.description}
                          </p>

                        </div>

                      </div>
                    ),
                  )}

                </div>

                <div className="ai-result-actions">

                  <button
                    className="secondary-button"
                    onClick={() =>
                      setAiResult(null)
                    }
                  >
                    ← {t('regenerate')}
                  </button>

                  <button
                    className="ai-generate-button"
                    onClick={saveAITraining}
                  >
                    ✓ {t('saveAsTraining')}
                  </button>

                </div>
              </>
            )}

          </div>

        </div>
      )}

      {/* =================================================
          DELETE TRAINING
      ================================================= */}

      {trainingToDelete && (
        <div
          className="delete-modal-backdrop"
          onClick={() =>
            setTrainingToDelete(null)
          }
        >

          <div
            className="delete-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="delete-modal-icon">
              !
            </div>

            <div className="delete-modal-eyebrow">
              {t('deleteTraining').toUpperCase()}
            </div>

            <h2>
              {t('deleteConfirm')}
            </h2>

            <p className="delete-modal-description">
              {t('deleteTrainingDescription')}
            </p>

            <div className="delete-modal-training">

              <strong>
                {trainingToDelete.title}
              </strong>

              <span>
                {formatDate(
                  trainingToDelete.date,
                )}
                {' · '}
                {trainingToDelete.startTime}–
                {trainingToDelete.endTime}
              </span>

            </div>

            <div className="delete-modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setTrainingToDelete(null)
                }
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDeleteTraining}
              >
                {t('delete')}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}