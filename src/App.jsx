import { useEffect, useMemo, useState } from 'react'
import TeamPage from './TeamPage'
import TrainingCreationChooser from './TrainingCreationChooser'
import TrainingEditorModal from './TrainingEditorModal'
import ClubPage from './ClubPage'
import {
  createTranslator,
  getInitialLanguage,
  saveLanguage,
} from './i18n'
import AuthScreen from './AuthScreen'
import './App.css'
import './attendance.css'
import { cloudEnabled, getCurrentSession, loadCoachData, saveProfile, signOut, subscribeToAuth, syncCoachData, deleteCoachTeam, deleteCoachPlayer, deleteCoachTraining } from './dataService'

function readLegacyBusinessData() {
  try {
    const readArray = (keys) => {
      for (const key of keys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed) && parsed.length) return parsed
        } catch {
          // Ignore a malformed legacy key and continue with the next namespace.
        }
      }
      return []
    }

    const readObject = (keys) => {
      for (const key of keys) {
        const raw = localStorage.getItem(key)
        if (!raw) continue
        try {
          const parsed = JSON.parse(raw)
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
        } catch {
          // Ignore malformed legacy data.
        }
      }
      return null
    }

    const teams = readArray(['tactikick-teams', 'coachapp-teams'])
    const players = readArray(['tactikick-players', 'coachapp-players'])
    const trainings = readArray(['tactikick-trainings', 'coachapp-trainings'])
    const profile = readObject(['coachapp-profile', 'tactikick-profile'])
    const owner = localStorage.getItem('coachapp-local-owner') || ''

    return {
      teams,
      players,
      trainings,
      profile,
      owner,
      hasBusinessData: teams.length > 0 || players.length > 0 || trainings.length > 0,
    }
  } catch {
    return { teams: [], players: [], trainings: [], profile: null, owner: '', hasBusinessData: false }
  }
}

function mergeById(cloudRows, localRows, key = 'id') {
  const result = []
  const seen = new Set()
  const add = (row) => {
    if (!row) return
    const value = row[key]
    const id = value == null ? null : String(value)
    if (id && seen.has(id)) return
    if (id) seen.add(id)
    result.push(row)
  }
  ;(cloudRows || []).forEach(add)
  ;(localRows || []).forEach(add)
  return result
}

function mergeCoachData(cloud, legacy) {
  const cloudTeams = Array.isArray(cloud?.teams) ? cloud.teams : []
  const cloudPlayers = Array.isArray(cloud?.players) ? cloud.players : []
  const cloudTrainings = Array.isArray(cloud?.trainings) ? cloud.trainings : []
  const localTeams = Array.isArray(legacy?.teams) ? legacy.teams : []
  const localPlayers = Array.isArray(legacy?.players) ? legacy.players : []
  const localTrainings = Array.isArray(legacy?.trainings) ? legacy.trainings : []

  // Cloud wins on identical IDs; local-only rows are recovered so an older
  // browser backup can complete a partially migrated account.
  const teams = mergeById(cloudTeams, localTeams)
  const teamIds = new Set(teams.map((team) => String(team.id)))
  const players = mergeById(cloudPlayers, localPlayers).filter((player) => teamIds.has(String(player.teamId)))
  const trainings = mergeById(cloudTrainings, localTrainings).filter((training) => teamIds.has(String(training.teamId)))

  return { teams, players, trainings }
}

function getAttendanceSessions(trainings, teamId) {
  return (trainings || []).filter((training) => {
    if (training.teamId !== teamId) return false
    const type = training.calendarType || 'training'
    return type === 'training' && training.attendance && Object.keys(training.attendance).length
  })
}

function getPlayerAttendanceStats(playerId, trainings, teamId) {
  const sessions = getAttendanceSessions(trainings, teamId)
  if (!sessions.length) {
    return { trainings: 0, present: 0, absent: 0, excused: 0, attendance: 0 }
  }

  let present = 0
  let absent = 0
  let excused = 0

  sessions.forEach((training) => {
    const status = training.attendance?.[playerId] || 'present'
    if (status === 'present') present += 1
    else if (status === 'absent') absent += 1
    else if (status === 'excused') excused += 1
  })

  const counted = present + absent
  return {
    trainings: sessions.length,
    present,
    absent,
    excused,
    attendance: counted ? Math.round((present / counted) * 100) : 0,
  }
}


const validPages = new Set(['dashboard','teams','trainings','attendance','calendar','club','statistics','settings','profile'])
function getRouteFromLocation() {
  const parts = window.location.pathname.split('/').filter(Boolean)
  if (parts[0] === 'team' && parts[1]) return { page: 'team', teamId: parts[1] }
  const page = parts[0] || 'dashboard'
  return { page: validPages.has(page) ? page : 'dashboard', teamId: null }
}

function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(cloudEnabled)
  const [cloudReady, setCloudReady] = useState(!cloudEnabled)
  const [cloudError, setCloudError] = useState('')
  const [localRecoveryMode, setLocalRecoveryMode] = useState(false)
  const [dataLoading, setDataLoading] = useState(cloudEnabled)
  const [language, setLanguage] = useState(() => getInitialLanguage())
  const t = useMemo(() => createTranslator(language), [language])
  function handleLanguageChange(nextLanguage) {
    setLanguage(nextLanguage)
    saveLanguage(nextLanguage)
  }



  const initialRoute = getRouteFromLocation()
  const [activePage, setActivePage] = useState(initialRoute.page)
  const [selectedTeam, setSelectedTeam] = useState(() => initialRoute.teamId ? { id: initialRoute.teamId } : null)
  const [openTrainingChooserOnTeam, setOpenTrainingChooserOnTeam] = useState(false)
  const [openTrainingModeOnTeam, setOpenTrainingModeOnTeam] = useState(null)
  const [showTrainingCreationChooser, setShowTrainingCreationChooser] = useState(false)
  const [trainingCreationTeam, setTrainingCreationTeam] = useState(null)

  useEffect(() => {
    function handlePopState() {
      const route = getRouteFromLocation()
      setActivePage(route.page)
      setOpenTrainingChooserOnTeam(false)
      setOpenTrainingModeOnTeam(null)
      setShowTrainingCreationChooser(false)
      setTrainingCreationTeam(null)
      if (route.page !== 'team') setSelectedTeam(null)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [teamToDelete, setTeamToDelete] = useState(null)
  const [teamToEdit, setTeamToEdit] = useState(null)
  const [globalEditingTraining, setGlobalEditingTraining] = useState(null)
  const [globalTrainingDraft, setGlobalTrainingDraft] = useState(null)
  const [globalTrainingToDelete, setGlobalTrainingToDelete] = useState(null)

  useEffect(() => {
    if (!cloudEnabled) return undefined

    let active = true

    getCurrentSession()
      .then((nextSession) => {
        if (!active) return
        setSession(nextSession)
        setAuthLoading(false)
      })
      .catch((error) => {
        if (!active) return
        setCloudError(error.message || t('cloudConnectionError'))
        setAuthLoading(false)
      })

    return subscribeToAuth((nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
      if (!nextSession) setCloudReady(false)
    })
  }, [])

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('coachapp-theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  // TactiKick is the current browser storage namespace. Keep the old
  // coachapp-* keys as a fallback so existing installations are preserved.
  // Supabase is the single source of truth for application data.
  // Do not initialize business data from localStorage.
  // Supabase is the single source of truth for application data.
  // Do not initialize business data from localStorage.
  const [teams, setTeams] = useState([])
  const [trainings, setTrainings] = useState([])
  const [players, setPlayers] = useState([])

  const [showTeamForm, setShowTeamForm] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [ageGroup, setAgeGroup] = useState('')

  const [profile, setProfile] = useState({
    name: '',
    role: 'coach',
    club: '',
    email: '',
  })
  useEffect(() => {
    if (!cloudEnabled || !session?.user?.id) return undefined

    let active = true
    setCloudReady(false)
    setDataLoading(true)
    setCloudError('')
    setLocalRecoveryMode(false)
    loadCoachData(session.user.id)
      .then((data) => {
        if (!active) return

        const legacy = readLegacyBusinessData()
        const legacyBelongsToThisUser = !legacy.owner || legacy.owner === session.user.id
        const migrationSource = legacyBelongsToThisUser ? legacy : { teams: [], players: [], trainings: [], profile: null, hasBusinessData: false }
        const merged = mergeCoachData(data, migrationSource)

        setTeams(merged.teams)
        setPlayers(merged.players)
        setTrainings(merged.trainings)

        const nextProfile = data?.profile || migrationSource.profile
        const effectiveEmail = String(nextProfile?.email || session.user.email || '').trim().toLowerCase()
        setProfile({
          name: nextProfile?.name || '',
          role: effectiveEmail === 'pappcsabi7126@gmail.com' ? 'admin' : (nextProfile?.role || 'coach'),
          club: nextProfile?.club || '',
          email: nextProfile?.email || session.user.email || '',
        })

        setCloudReady(true)
        setLocalRecoveryMode(false)
        setDataLoading(false)

        // Keep a browser backup after a successful load. This is a safety net,
        // not the source of truth, and lets us recover from future failed reads.
        try {
          localStorage.setItem('tactikick-teams', JSON.stringify(merged.teams))
          localStorage.setItem('tactikick-players', JSON.stringify(merged.players))
          localStorage.setItem('tactikick-trainings', JSON.stringify(merged.trainings))
          localStorage.setItem('coachapp-teams', JSON.stringify(merged.teams))
          localStorage.setItem('coachapp-players', JSON.stringify(merged.players))
          localStorage.setItem('coachapp-trainings', JSON.stringify(merged.trainings))
          localStorage.setItem('coachapp-local-owner', session.user.id)
        } catch {
          // Storage can be unavailable in private/restricted browser contexts.
        }
      })
      .catch((error) => {
        if (!active) return
        const legacy = readLegacyBusinessData()
        const legacyBelongsToThisUser = !legacy.owner || legacy.owner === session.user.id
        if (legacy.hasBusinessData && legacyBelongsToThisUser) {
          setTeams(legacy.teams)
          setPlayers(legacy.players)
          setTrainings(legacy.trainings)
          if (legacy.profile) setProfile(legacy.profile)
          setCloudError(`Supabase átmenetileg nem elérhető: ${error.message || 'ismeretlen hiba'}. Helyi biztonsági mentésből dolgozunk; automatikus felhőmentés szünetel.`)
          setCloudReady(false)
          setLocalRecoveryMode(true)
          setDataLoading(false)
          return
        }
        setCloudError(error.message || t('dataLoadError'))
        setCloudReady(false)
        setDataLoading(false)
      })

    return () => { active = false }
  }, [session?.user?.id])

  // Keep a redundant browser backup as a safety net. Supabase remains the
  // primary source, but a transient cloud issue must never make the UI look
  // like the user's teams/players/trainings vanished.
  useEffect(() => {
    if (!cloudReady && !localRecoveryMode) return
    try {
      localStorage.setItem('tactikick-teams', JSON.stringify(teams))
      localStorage.setItem('tactikick-players', JSON.stringify(players))
      localStorage.setItem('tactikick-trainings', JSON.stringify(trainings))
      localStorage.setItem('coachapp-teams', JSON.stringify(teams))
      localStorage.setItem('coachapp-players', JSON.stringify(players))
      localStorage.setItem('coachapp-trainings', JSON.stringify(trainings))
    } catch {
      // Ignore storage quota/privacy mode failures.
    }
  }, [cloudReady, localRecoveryMode, teams, players, trainings])

  useEffect(() => {
    if (!cloudEnabled || !session?.user?.id || !cloudReady) return
    const timer = window.setTimeout(() => {
      syncCoachData(session.user.id, { teams, players, trainings }).catch((error) => {
        console.error(error)
        setCloudError(error.message || t('cloudSaveError'))
      })
    }, 350)
    return () => window.clearTimeout(timer)
  }, [cloudReady, session?.user?.id, teams, players, trainings])

  useEffect(() => {
    if (!cloudEnabled || !session?.user?.id || !cloudReady) return
    saveProfile(session.user.id, profile).catch((error) => {
      console.error(error)
      setCloudError(error.message || t('profileSaveError'))
    })
  }, [cloudReady, session?.user?.id, profile])

  async function handleSignOut() {
    if (!cloudEnabled) return
    await signOut()
  }

  function openGlobalTrainingEdit(training) {
    if (!training) return
    setGlobalEditingTraining(training)
    setGlobalTrainingDraft({
      date: training.date || '',
      startTime: training.startTime || '17:00',
      endTime: training.endTime || '18:30',
      title: training.title || '',
      plan: Array.isArray(training.plan) ? training.plan : [],
    })
  }

  function closeGlobalTrainingEdit() {
    setGlobalEditingTraining(null)
    setGlobalTrainingDraft(null)
  }

  function saveGlobalTrainingEdit(event) {
    event.preventDefault()
    if (!globalEditingTraining || !globalTrainingDraft?.date || !globalTrainingDraft.title?.trim()) return
    setTrainings((current) => current.map((training) =>
      training.id === globalEditingTraining.id
        ? {
            ...training,
            date: globalTrainingDraft.date,
            startTime: globalTrainingDraft.startTime,
            endTime: globalTrainingDraft.endTime,
            title: globalTrainingDraft.title.trim(),
            plan: Array.isArray(globalTrainingDraft.plan) ? globalTrainingDraft.plan : [],
          }
        : training,
    ))
    closeGlobalTrainingEdit()
  }

  function requestGlobalTrainingDelete(training) {
    if (training) setGlobalTrainingToDelete(training)
  }

  function confirmGlobalTrainingDelete() {
    if (!globalTrainingToDelete) return
    if (cloudEnabled && session?.user?.id) {
      deleteCoachTraining(session.user.id, globalTrainingToDelete.id).catch((error) => {
        console.error(error)
        setCloudError(error.message || 'Edzés törlése nem sikerült.')
      })
    }
    setTrainings((current) => current.filter((training) => training.id !== globalTrainingToDelete.id))
    setGlobalTrainingToDelete(null)
  }

  function createTrainingFromAI(training) {
    setTrainings((current) => [training, ...current])
    const createdTeam = teamsWithStats.find((item) => item.id === training.teamId)
    if (createdTeam) {
      setSelectedTeam(createdTeam)
      setActivePage('team')
    } else {
      setActivePage('trainings')
    }
  }

  useEffect(() => {
    if (!authLoading) {
      document.documentElement.setAttribute('data-coachapp-ready', 'true')
    }
  }, [authLoading])

  if (authLoading) {
    return <div className="auth-loading">{t('loading')}</div>
  }

  if (cloudEnabled && !session) {
    return <AuthScreen />
  }

  if (cloudEnabled && session?.user?.id && dataLoading) {
    return (
      <div className="app-data-loading">
        <div className="data-loading-card">
          <div className="data-loading-spinner" aria-hidden="true" />
          <strong>Adatok betöltése…</strong>
          <span>Megvárjuk a Supabase válaszát, hogy egy pillanatra se jelenjen meg üres csapat- vagy játékoslista.</span>
        </div>
      </div>
    )
  }

  if (cloudEnabled && session?.user?.id && !cloudReady && cloudError && !localRecoveryMode) {
    return (
      <div className="app-data-loading">
        <div className="data-loading-card data-error-card">
          <strong>Az adatok nem tölthetők be</strong>
          <span>{cloudError}</span>
          <button type="button" className="neon-button" onClick={() => window.location.reload()}>Újrapróbálás</button>
        </div>
      </div>
    )
  }

  if (!cloudEnabled && session === null) {
    return (
      <div className="app-data-loading">
        <div className="data-loading-card data-error-card">
          <strong>Supabase nincs csatlakoztatva</strong>
          <span>Az alkalmazás így nem tudja betölteni a meglévő csapatokat, játékosokat és edzéseket. Ellenőrizd a VITE_SUPABASE_URL és VITE_SUPABASE_PUBLISHABLE_KEY változókat a .env fájlban.</span>
        </div>
      </div>
    )
  }

  const recoveryBanner = localRecoveryMode ? (
    <div className="data-recovery-banner" role="status">
      <strong>Helyi biztonsági mentés mód</strong>
      <span>{cloudError}</span>
      <button type="button" className="secondary-button" onClick={() => window.location.reload()}>Újrapróbálás</button>
    </div>
  ) : null

  function navigate(page) {
    setActivePage(page)
    setOpenTrainingChooserOnTeam(false)
    setOpenTrainingModeOnTeam(null)
    setShowTrainingCreationChooser(false)
    setTrainingCreationTeam(null)
    if (page !== 'team') setSelectedTeam(null)
    const path = page === 'dashboard' ? '/' : `/${page}`
    window.history.pushState({}, '', path)
  }

  function openTeam(team, options = {}) {
    setSelectedTeam(team)
    setOpenTrainingChooserOnTeam(Boolean(options.openTrainingChooser))
    setOpenTrainingModeOnTeam(options.openTrainingMode || null)
    setShowTrainingCreationChooser(false)
    setTrainingCreationTeam(null)
    setActivePage('team')
    window.history.pushState({}, '', `/team/${encodeURIComponent(team.id)}`)
  }

  function closeTeam() {
    setSelectedTeam(null)
    setOpenTrainingChooserOnTeam(false)
    setOpenTrainingModeOnTeam(null)
    setShowTrainingCreationChooser(false)
    setTrainingCreationTeam(null)
    setActivePage('teams')
    window.history.pushState({}, '', '/teams')
  }

  function closeTrainingCreationChooser() {
    setShowTrainingCreationChooser(false)
    setTrainingCreationTeam(null)
  }

  function openTrainingCreationMode(mode) {
    const targetTeam = trainingCreationTeam || teamsWithStats[0]

    closeTrainingCreationChooser()

    if (!targetTeam) {
      navigate('teams')
      return
    }

    openTeam(targetTeam, { openTrainingMode: mode })
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('coachapp-theme', next)
    document.documentElement.setAttribute('data-coachapp-theme', next)
    document.documentElement.style.backgroundColor = next === 'dark' ? '#07090d' : '#f5f7f5'
    document.documentElement.style.colorScheme = next
  }

  function addTeam(event) {
    event.preventDefault()
    if (!teamName.trim()) return

    const newTeam = {
      id: Date.now(),
      name: teamName.trim(),
      age: ageGroup.trim() || 'Nincs megadva',
      players: 0,
      attendance: 0,
      color: teams.length % 2 === 0 ? 'purple' : 'blue',
    }

    setTeams((current) => [...current, newTeam])
    setTeamName('')
    setAgeGroup('')
    setShowTeamForm(false)
  }

  function requestEditTeam(team) {
    setTeamToEdit({
      ...team,
      name: team.name || '',
      age: team.age || '',
      color: team.color || 'purple',
    })
  }

  function saveEditedTeam(event) {
    event.preventDefault()
    if (!teamToEdit?.name?.trim()) return

    const updatedTeam = {
      ...teamToEdit,
      name: teamToEdit.name.trim(),
      age: teamToEdit.age?.trim() || 'Nincs megadva',
      color: teamToEdit.color || 'purple',
    }

    setTeams((current) =>
      current.map((team) =>
        team.id === updatedTeam.id
          ? { ...team, ...updatedTeam }
          : team,
      ),
    )

    if (selectedTeam?.id === updatedTeam.id) {
      setSelectedTeam((current) =>
        current ? { ...current, ...updatedTeam } : current,
      )
    }

    setTeamToEdit(null)
  }

  function requestDeleteTeam(team) {
    setTeamToDelete(team)
  }

  function confirmDeleteTeam() {
    if (!teamToDelete) return

    const teamId = teamToDelete.id
    if (cloudEnabled && session?.user?.id) {
      deleteCoachTeam(session.user.id, teamId).catch((error) => {
        console.error(error)
        setCloudError(error.message || 'Csapat törlése nem sikerült.')
      })
    }
    setTeams((current) => current.filter((team) => team.id !== teamId))
    setPlayers((current) => current.filter((player) => player.teamId !== teamId))
    setTrainings((current) => current.filter((training) => training.teamId !== teamId))

    if (selectedTeam?.id === teamId) {
      setSelectedTeam(null)
      setActivePage('teams')
    }

    setTeamToDelete(null)
  }

  function addPlayer(player) {
    setPlayers((currentPlayers) => [...currentPlayers, player])
  }

  function updatePlayer(updatedPlayer) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.id === updatedPlayer.id ? updatedPlayer : player,
      ),
    )
  }

  function deletePlayer(playerId) {
    if (cloudEnabled && session?.user?.id) {
      deleteCoachPlayer(session.user.id, playerId).catch((error) => {
        console.error(error)
        setCloudError(error.message || 'Játékos törlése nem sikerült.')
      })
    }
    setPlayers((currentPlayers) =>
      currentPlayers.filter((player) => player.id !== playerId),
    )
  }

  // Derived data only; keep this out of Hooks because App() has
  // early returns for auth/loading states. Attendance is calculated
  // from the attendance stored on each training, not from stale player fields.
  const playersWithStats = players.map((player) => {
    const stats = getPlayerAttendanceStats(player.id, trainings, player.teamId)
    return {
      ...player,
      attendance: stats.attendance,
      trainings: stats.trainings || Number(player.trainings || 0),
      present: stats.trainings ? stats.present : Number(player.present || 0),
      absent: stats.trainings ? stats.absent : Number(player.absent || 0),
      excused: stats.excused,
    }
  })

  const teamsWithStats = teams.map((team) => {
    const teamPlayers = playersWithStats.filter((player) => player.teamId === team.id)
    const attendance = teamPlayers.length
      ? Math.round(
          teamPlayers.reduce((sum, player) => sum + (Number(player.attendance) || 0), 0) /
            teamPlayers.length,
        )
      : 0

    return {
      ...team,
      players: teamPlayers.length,
      attendance,
    }
  })

  const totalPlayers = players.length

  const averageAttendance = playersWithStats.length
    ? Math.round(
        playersWithStats.reduce(
          (sum, player) => sum + (Number(player.attendance) || 0),
          0,
        ) / playersWithStats.length,
      )
    : 0

  const todayKey = new Date().toISOString().slice(0, 10)

  const pageTitles = {
    dashboard: t('home'),
    teams: t('teams'),
    trainings: t('trainings'),
    attendance: t('attendance'),
    calendar: t('calendar'),
    club: t('club'),
    statistics: t('statistics'),
    settings: t('settings'),
    profile: t('profile'),
    ai: t('aiTraining'),
    team: selectedTeam?.name || t('teams'),
  }

  const navigation = [
    { id: 'dashboard', icon: '⌂', label: t('home') },
    { id: 'teams', icon: '♙', label: t('teams') },
    { id: 'trainings', icon: '◉', label: t('trainings') },
    { id: 'attendance', icon: '✓', label: t('attendance') },
    { id: 'club', icon: '♜', label: t('club') },
  ]

  return (
    <div className={`app ${theme}-theme`}>
      {recoveryBanner}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo"><span>✦</span></div>
          <div>
            <div className="brand-name">TACTI<span>KICK</span></div>
            <div className="brand-tagline">TRAIN SMARTER</div>
          </div>
        </div>

        <div className="menu-title">{t('workspace')}</div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.ai && <span className="ai-badge">AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />
        <div className="menu-title">{t('management')}</div>

        <nav className="navigation">
          <button
            className={`nav-item ${activePage === 'calendar' ? 'active' : ''}`}
            onClick={() => navigate('calendar')}
          >
            <span className="nav-icon">◈</span>
            <span className="nav-label">{t('calendar')}</span>
          </button>

          <button
            className={`nav-item ${activePage === 'statistics' ? 'active' : ''}`}
            onClick={() => navigate('statistics')}
          >
            <span className="nav-icon">▥</span>
            <span className="nav-label">{t('statistics')}</span>
          </button>

          <button
            className={`nav-item ${activePage === 'settings' ? 'active' : ''}`}
            onClick={() => navigate('settings')}
          >
            <span className="nav-icon">⚙</span>
            <span className="nav-label">{t('settings')}</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-user">
          <button
            type="button"
            className="sidebar-user-main"
            onClick={() => {
              setProfileMenuOpen(false)
              navigate('profile')
            }}
          >
            <div className="avatar">{profile.name?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CS'}</div>
            <div className="user-details">
              <strong>{profile.name}</strong>
              <span>{profile.role === 'admin' ? 'Admin' : (profile.role || 'Coach')}</span>
            </div>
          </button>

          <button
            type="button"
            className="user-more-button"
            aria-label={t('profileMenu')}
            aria-expanded={profileMenuOpen}
            onClick={() => setProfileMenuOpen((value) => !value)}
          >
            •••
          </button>

          {profileMenuOpen && (
            <div className="profile-mini-menu">
              <button type="button" onClick={() => { setProfileMenuOpen(false); navigate('profile') }}>
                <span>◎</span> {t('profile')}
              </button>
              <button type="button" onClick={() => { setProfileMenuOpen(false); navigate('settings') }}>
                <span>⚙</span> {t('settings')}
              </button>
              <div className="profile-mini-divider" />
              <button type="button" className="danger" onClick={() => { setProfileMenuOpen(false); handleSignOut() }}>
                <span>↪</span> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      <nav className="mobile-bottom-nav" aria-label="Mobil navigáció">
        {[
          ['dashboard', t('home')],
          ['club', t('club')],
          ['teams', t('teams')],
          ['trainings', t('trainings')],
          ['calendar', t('calendar')],
        ].map(([id, label]) => (
          <button key={id} type="button" className={activePage === id ? 'active' : ''} onClick={() => navigate(id)} aria-current={activePage === id ? 'page' : undefined}>
            <span className="mobile-nav-icon" aria-hidden="true">
              {id === 'dashboard' && <svg viewBox="0 0 24 24"><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5.5v-6h-5v6H4a1 1 0 0 1-1-1Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>}
              {id === 'club' && <svg viewBox="0 0 24 24"><path d="M6 20h12M8 20V7h8v13M10 7V4h4v3M5 10h3M16 10h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M10 13h4M10 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              {id === 'teams' && <svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="17" cy="9" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.6"/><path d="M3.5 20c.5-4 2.7-6 5.5-6s5 2 5.5 6M14 15c2.8-.1 4.8 1.4 5.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
              {id === 'trainings' && <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>}
              {id === 'calendar' && <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8"/><path d="M7 3v4M17 3v4M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M8 14h2M14 14h2M8 17h2M14 17h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>}
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb">
            <span>TactiKick</span>
            <span>/</span>
            <strong>{pageTitles[activePage]}</strong>
          </div>

          <div className="topbar-right">
            <button
              className="search-button"
              type="button"
              onClick={() => setSearchOpen(true)}
            >
              <span>⌕</span>
              <span>{t('search')}...</span>
              <kbd>⌘ K</kbd>
            </button>

            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? t('light') : t('dark')}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>

            <button
              className="top-icon"
              type="button"
              title={t('notificationTitle')}
              aria-label={t('notificationTitle')}
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 20h4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
              </svg>
              <i />
            </button>

            <button
              className="mobile-profile-button"
              type="button"
              title={t('profile')}
              aria-label={t('profile')}
              onClick={() => navigate('profile')}
            >
              <svg viewBox="0 0 48 48" role="presentation">
                <circle cx="24" cy="16" r="8" fill="currentColor" />
                <path d="M10 40c0-7.2 6.3-13 14-13s14 5.8 14 13" fill="currentColor" />
              </svg>
            </button>
            {cloudEnabled && cloudError && (
              <span className="cloud-status error" title={cloudError}>
                ●
              </span>
            )}
          </div>
        </header>

        {activePage === 'dashboard' && (
          <Dashboard
            t={t}
            teams={teamsWithStats}
            totalPlayers={totalPlayers}
            trainings={trainings}
            profile={profile}
            onNavigate={navigate}
            onOpenTeam={openTeam}
            onEditTeam={requestEditTeam}
            onDeleteTeam={requestDeleteTeam}
            language={language}
          />
        )}

        {activePage === 'teams' && (
          <Teams
            t={t}
            teams={teamsWithStats}
            showForm={showTeamForm}
            setShowForm={setShowTeamForm}
            teamName={teamName}
            setTeamName={setTeamName}
            ageGroup={ageGroup}
            setAgeGroup={setAgeGroup}
            addTeam={addTeam}
            onOpenTeam={openTeam}
            onEditTeam={requestEditTeam}
            onDeleteTeam={requestDeleteTeam}
          />
        )}

        {activePage === 'team' && selectedTeam && (
          <TeamPage
            t={t}
            team={selectedTeam}
            players={playersWithStats.filter((player) => player.teamId === selectedTeam.id)}
            onAddPlayer={addPlayer}
            onUpdatePlayer={updatePlayer}
            onDeletePlayer={deletePlayer}
            trainings={trainings}
            setTrainings={setTrainings}
            onBack={closeTeam}
            openTrainingChooser={openTrainingChooserOnTeam}
            openTrainingMode={openTrainingModeOnTeam}
            language={language}
          />
        )}

        {activePage === 'trainings' && showTrainingCreationChooser && (
          <TrainingCreationChooser
            t={t}
            onClose={closeTrainingCreationChooser}
            onPlan={() => openTrainingCreationMode('plan')}
            onLibrary={() => openTrainingCreationMode('library')}
            onAI={() => openTrainingCreationMode('ai')}
          />
        )}

        {activePage === 'trainings' && (
          <TrainingsPage
            t={t}
            trainings={trainings}
            teams={teamsWithStats}
            onOpenTeam={openTeam}
            onNavigate={navigate}
            onEditTraining={openGlobalTrainingEdit}
            onDeleteTraining={requestGlobalTrainingDelete}
            onOpenNewTraining={() => {
              const targetTeam = teamsWithStats[0]

              if (!targetTeam) {
                navigate('teams')
                return
              }

              setTrainingCreationTeam(targetTeam)
              setShowTrainingCreationChooser(true)
            }}
          />
        )}

        {activePage === 'club' && (
          <ClubPage
            teams={teamsWithStats}
            trainings={trainings}
            profile={profile}
            onNavigate={navigate}
            onOpenTeam={openTeam}
          />
        )}

        {activePage === 'attendance' && (
          <AttendancePage t={t} language={language} teams={teamsWithStats} players={players} trainings={trainings} />
        )}

        {activePage === 'calendar' && (
          <CalendarPage
            t={t}
            trainings={trainings}
            setTrainings={setTrainings}
            teams={teamsWithStats}
            onOpenTeam={openTeam}
            language={language}
          />
        )}

        {activePage === 'statistics' && (
          <StatisticsPage
            t={t}
            teams={teamsWithStats}
            players={playersWithStats}
            trainings={trainings}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            t={t}
            theme={theme}
            setTheme={toggleTheme}
            language={language}
            onLanguageChange={handleLanguageChange}
            profile={profile}
            setProfile={setProfile}
          />
        )}

        {globalEditingTraining && globalTrainingDraft && (
          <TrainingEditorModal
            t={t}
            open
            editingTraining={globalEditingTraining}
            value={globalTrainingDraft}
            onChange={setGlobalTrainingDraft}
            onClose={closeGlobalTrainingEdit}
            onSave={saveGlobalTrainingEdit}
          />
        )}

        {globalTrainingToDelete && (
          <div className="delete-modal-backdrop" onClick={() => setGlobalTrainingToDelete(null)}>
            <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
              <div className="delete-modal-icon">!</div>
              <div className="delete-modal-eyebrow">{t('deleteTraining').toUpperCase()}</div>
              <h2>{t('deleteConfirm')}</h2>
              <p className="delete-modal-description">{t('deleteTrainingDescription')}</p>
              <div className="delete-modal-training">
                <strong>{globalTrainingToDelete.title}</strong>
                <span>{globalTrainingToDelete.date} · {globalTrainingToDelete.startTime}–{globalTrainingToDelete.endTime}</span>
              </div>
              <div className="delete-modal-actions">
                <button type="button" className="secondary-button" onClick={() => setGlobalTrainingToDelete(null)}>{t('cancel')}</button>
                <button type="button" className="delete-confirm-button" onClick={confirmGlobalTrainingDelete}>{t('delete')}</button>
              </div>
            </div>
          </div>
        )}

        {activePage === 'profile' && (
          <ProfilePage
            t={t}
            teams={teamsWithStats}
            totalPlayers={totalPlayers}
            trainings={trainings}
            players={playersWithStats}
            profile={profile}
            setProfile={setProfile}
          />
        )}

        {teamToEdit && (
          <div
            className="player-modal-backdrop"
            onClick={() => setTeamToEdit(null)}
          >
            <form
              className="player-modal add-player-modal"
              onSubmit={saveEditedTeam}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="player-modal-close"
                onClick={() => setTeamToEdit(null)}
              >
                ×
              </button>

              <div className="player-modal-eyebrow">{t('team').toUpperCase()}</div>
              <h2>{teamToEdit.name} — {t('editTeam')}</h2>
              <p className="player-modal-position">
                {t('editTeamDescription')}
              </p>

              <div className="player-form">
                <div className="form-group">
                  <label>{t('teamName').toUpperCase()}</label>
                  <input
                    autoFocus
                    required
                    value={teamToEdit.name}
                    onChange={(event) =>
                      setTeamToEdit((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Pl. U13"
                  />
                </div>

                <div className="form-group">
                  <label>{t('ageGroup').toUpperCase()}</label>
                  <input
                    value={teamToEdit.age}
                    onChange={(event) =>
                      setTeamToEdit((current) => ({
                        ...current,
                        age: event.target.value,
                      }))
                    }
                    placeholder="Pl. U12–U13"
                  />
                </div>

                <div className="form-group">
                  <label>{t('teamColor').toUpperCase()}</label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {[
                      { id: 'purple', label: t('purple'), icon: '✦' },
                      { id: 'blue', label: t('blue'), icon: '◆' },
                      { id: 'green', label: t('green'), icon: '●' },
                    ].map((color) => (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() =>
                          setTeamToEdit((current) => ({
                            ...current,
                            color: color.id,
                          }))
                        }
                        style={{
                          padding: '12px 10px',
                          borderRadius: '12px',
                          border: teamToEdit.color === color.id
                            ? '1px solid rgba(168,85,247,.9)'
                            : '1px solid rgba(255,255,255,.1)',
                          background: teamToEdit.color === color.id
                            ? 'rgba(168,85,247,.14)'
                            : 'rgba(255,255,255,.03)',
                          color: 'inherit',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ marginRight: '7px' }}>{color.icon}</span>
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="player-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setTeamToEdit(null)}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="neon-button">
                  {t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        )}

        {teamToDelete && (
          <div className="delete-modal-backdrop" onClick={() => setTeamToDelete(null)}>
            <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
              <div className="delete-modal-icon">!</div>
              <div className="delete-modal-eyebrow">{t('deleteTeam').toUpperCase()}</div>
              <h2>{t('deleteConfirm')}</h2>
              <p className="delete-modal-description">
                {t('deleteTeamDescription', { team: teamToDelete.name })}
              </p>
              <div className="delete-modal-actions">
                <button type="button" className="secondary-button" onClick={() => setTeamToDelete(null)}>{t('cancel')}</button>
                <button type="button" className="delete-confirm-button" onClick={confirmDeleteTeam}>{t('deleteTeam')}</button>
              </div>
            </div>
          </div>
        )}

        {searchOpen && (
          <div
            className="player-modal-backdrop app-search-backdrop"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="app-search-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="app-search-header">
                <div>
                  <div className="eyebrow">{t('quickSearch')}</div>
                  <h2>{t('searchTactiKick')}</h2>
                </div>
                <button
                  type="button"
                  className="player-modal-close"
                  onClick={() => setSearchOpen(false)}
                >
                  ×
                </button>
              </div>

              <input
                autoFocus
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder={t('searchPlaceholder')}
              />

              <div className="app-search-results">
                {[
                  ...teamsWithStats.map((item) => ({
                    type: t('teamResult'),
                    label: item.name,
                    detail: item.age,
                    action: () => {
                      openTeam(item)
                      setSearchOpen(false)
                    },
                  })),
                  ...players.map((item) => ({
                    type: t('playerResult'),
                    label: item.name,
                    detail:
                      teamsWithStats.find(
                        (team) => team.id === item.teamId,
                      )?.name || 'Csapat',
                    action: () => {
                      const team = teamsWithStats.find(
                        (team) => team.id === item.teamId,
                      )
                      if (team) openTeam(team)
                      setSearchOpen(false)
                    },
                  })),
                  ...trainings.map((item) => ({
                    type: t('trainingResult'),
                    label: item.title,
                    detail: item.date,
                    action: () => {
                      const team = teamsWithStats.find(
                        (team) => team.id === item.teamId,
                      )
                      if (team) openTeam(team)
                      setSearchOpen(false)
                    },
                  })),
                ]
                  .filter((item) => {
                    const q = searchQuery.trim().toLowerCase()
                    return (
                      !q ||
                      item.label.toLowerCase().includes(q) ||
                      item.detail.toLowerCase().includes(q)
                    )
                  })
                  .slice(0, 10)
                  .map((item, index) => (
                    <button
                      type="button"
                      className="app-search-result"
                      key={`${item.type}-${item.label}-${index}`}
                      onClick={item.action}
                    >
                      <span>{item.type}</span>
                      <strong>{item.label}</strong>
                      <small>{item.detail}</small>
                      <b>→</b>
                    </button>
                  ))}

                {searchQuery.trim() &&
                  ![
                    ...teamsWithStats,
                    ...players,
                    ...trainings,
                  ].some((item) =>
                    String(item.name || item.title || '')
                      .toLowerCase()
                      .includes(searchQuery.trim().toLowerCase()),
                  ) && (
                    <div className="app-search-empty">{t('noResults')}</div>
                  )}
              </div>
            </div>
          </div>
        )}

        {notificationsOpen && (
          <div className="notification-popover">
            <div className="eyebrow">{t('notifications')}</div>
            <strong>{t('notifications')}</strong>
            <p>
              {trainings.some(
                (training) => training.date === todayKey,
              )
                ? t('trainingToday')
                : t('noNotifications')}
            </p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setNotificationsOpen(false)
                navigate('calendar')
              }}
            >
              {t('openCalendar')}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

/* =====================================================
   DASHBOARD
===================================================== */

function Dashboard({ t, teams, totalPlayers, trainings, profile, onNavigate, onOpenTeam, onEditTeam, onDeleteTeam, language = 'hu' }) {
  const todayKey = new Date().toISOString().slice(0, 10)
  const nextTraining =
    trainings
      .slice()
      .filter((training) => training.date >= todayKey)
      .sort((a, b) =>
        `${a.date}T${a.startTime}`.localeCompare(
          `${b.date}T${b.startTime}`,
        ),
      )[0] || trainings
      .slice()
      .sort((a, b) =>
        `${b.date}T${b.startTime}`.localeCompare(
          `${a.date}T${a.startTime}`,
        ),
      )[0]

  const nextTeam = teams.find((team) => team.id === nextTraining?.teamId)

  return (
    <div className="page">
      <div className="hero-header">
        <div>
          <div className="eyebrow">TACTIKICK • 2026</div>
          <h1>{t('goodTraining')}, {profile?.name || 'Coach'}! <span>👋</span></h1>
          <p>{t('everythingForToday')}</p>
        </div>

        <button className="neon-button" onClick={() => onNavigate('calendar')}>
          <span>◫</span> {t('openCalendar')}
        </button>
      </div>

      <div className="stats">
        <Stat label={t('teamsCount')} value={teams.length} change="" text={t('activeTeam')} icon="♙" color="purple" />
        <Stat label={t('playersCount')} value={totalPlayers} change="" text={t('totalPlayers')} icon="♙" color="blue" />
        <Stat
          label={t('averageAttendance')}
          value={`${teams.length ? Math.round(teams.reduce((sum, team) => sum + team.attendance, 0) / teams.length) : 0}%`}
          change=""
          text={t('currentAverage')}
          icon="✓"
          color="green"
        />
        <Stat label={t('trainingsCount')} value={trainings.length} change="" text={t('plannedTraining')} icon="⚽" color="orange" />
      </div>

      <div className="dashboard-columns">
        <section className="glass-card">
          <div className="card-heading">
            <div>
              <div className="card-label">{t('nextTraining')}</div>
              <h2>{nextTeam?.name || 'U13'} • {nextTraining?.title || 'Labdakihozatal'}</h2>
            </div>
            <span className="live-dot">{t('next')}</span>
          </div>

          <div className="training-main">
            <div className="big-date">
              <span>
                {nextTraining
                  ? new Date(`${nextTraining.date}T12:00:00`)
                      .toLocaleDateString(language === 'en' ? 'en-US' : 'hu-HU', { month: 'short' })
                      .replace('.', '')
                      .toUpperCase()
                  : '—'}
              </span>
              <strong>{nextTraining ? nextTraining.date.slice(-2) : '—'}</strong>
              <small>
                {nextTraining
                  ? nextTraining.date.slice(0, 4)
                  : '—'}
              </small>
            </div>

            <div className="training-details">
              <div className="training-row"><span>◷</span><strong>{nextTraining?.startTime || '17:00'} – {nextTraining?.endTime || '18:30'}</strong></div>
              <div className="training-row"><span>♙</span><span>{nextTeam?.players || 17} {t('players')}</span></div>
              <div className="training-row"><span>◎</span><span>{t('venue')}</span></div>
            </div>
          </div>

          <button
            className="team-button"
            onClick={() => nextTeam && onOpenTeam(nextTeam)}
          >
            {t('teamOpen')} <span>→</span>
          </button>
        </section>

        <section className="glass-card">
          <div className="card-heading">
            <div>
              <div className="card-label">{t('todayProgram')}</div>
              <h2>{t('todayTrainings')}</h2>
            </div>
            <button className="small-link" onClick={() => onNavigate('calendar')}>{t('calendar')} →</button>
          </div>

          <div className="schedule">
            {trainings.slice(0, 3).map((training) => {
              const team = teams.find((item) => item.id === training.teamId)
              return (
                <ScheduleItem
                  key={training.id}
                  time={training.startTime}
                  team={team?.name || t('team')}
                  title={training.title}
                  color={training.color}
                />
              )
            })}
          </div>
        </section>
      </div>

      <section className="teams-section">
        <div className="section-heading">
          <div>
            <div className="card-label">{t('teams')}</div>
            <h2>{t('activeTeams')}</h2>
          </div>
          <button className="small-link" onClick={() => onNavigate('teams')}>{t('all')} →</button>
        </div>

        <div className="team-grid">
          {teams.map((team) => (
            <TeamCard key={team.id} t={t} team={team} onOpen={onOpenTeam} onEdit={onEditTeam} onDelete={onDeleteTeam} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Stat({ label, value, change, text, icon, color }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <div className={`stat-icon ${color}`}>{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-bottom">
        <strong>{change}</strong>
        <span>{text}</span>
      </div>
    </div>
  )
}

function ScheduleItem({ time, team, title, color }) {
  return (
    <div className="schedule-item">
      <div className="schedule-time">{time}</div>
      <div className={`schedule-line ${color}`} />
      <div className="schedule-info"><strong>{team}</strong><span>{title}</span></div>
      <span>→</span>
    </div>
  )
}

/* =====================================================
   TEAMS
===================================================== */

function Teams({
  t,
  teams,
  showForm,
  setShowForm,
  teamName,
  setTeamName,
  ageGroup,
  setAgeGroup,
  addTeam,
  onOpenTeam,
  onEditTeam,
  onDeleteTeam,
}) {
  return (
    <div className="page">
      <div className="hero-header">
        <div>
          <div className="eyebrow">MANAGEMENT</div>
          <h1>{t('teams')}</h1>
          <p>{t('manageTeams')}</p>
        </div>

        <button className="neon-button" onClick={() => setShowForm(true)}>
          + {t('newTeam')}
        </button>
      </div>

      {showForm && (
        <form className="team-form" onSubmit={addTeam}>
          <div className="form-header">
            <div>
              <div className="eyebrow">{t('newTeam')}</div>
              <h2>{t('createTeam')}</h2>
            </div>
            <button type="button" className="close-button" onClick={() => setShowForm(false)}>×</button>
          </div>

          <div className="form-group">
            <label>{t('teamName')}</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Pl. U13" autoFocus />
          </div>

          <div className="form-group">
            <label>{t('ageGroup')}</label>
            <input value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} placeholder="Pl. U12–U13" />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>{t('cancel')}</button>
            <button type="submit" className="neon-button">{t('createTeam')}</button>
          </div>
        </form>
      )}

      <div className="team-grid large">
        {teams.map((team) => (
          <TeamCard key={team.id} t={t} team={team} onOpen={onOpenTeam} onEdit={onEditTeam} onDelete={onDeleteTeam} />
        ))}
        <button className="add-team" onClick={() => setShowForm(true)}>
          <div>+</div>
          <strong>{t('newTeam')}</strong>
          <span>{t('createTeam')}</span>
        </button>
      </div>
    </div>
  )
}

function TeamCard({ t, team, onOpen, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="team-card">
      <div className={`team-card-top ${team.color}`}>
        <div className="team-badge">{team.name.replace(/\D/g, '') || 'T'}</div>
        <button
          type="button"
          className="team-card-menu-button"
          aria-label={`${team.name} műveletek`}
          aria-expanded={menuOpen}
          onClick={(event) => {
            event.stopPropagation()
            setMenuOpen((value) => !value)
          }}
        >
          •••
        </button>

        {menuOpen && (
          <div className="team-card-menu" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="team-card-menu-item"
              onClick={() => {
                setMenuOpen(false)
                onEdit?.(team)
              }}
            >
              <span>✎</span>
              {t('editTeam')}
            </button>

            <button
              type="button"
              className="team-card-menu-item danger"
              onClick={() => {
                setMenuOpen(false)
                onDelete?.(team)
              }}
            >
              <span>×</span>
              {t('deleteTeam')}
            </button>
          </div>
        )}
      </div>

      <div className="team-card-body">
        <div className="team-name-row">
          <div>
            <h3>{team.name}</h3>
            <span>{team.age}</span>
          </div>
          <span className="active-pill">{t('active')}</span>
        </div>

        <div className="team-metrics">
          <div><strong>{team.players}</strong><span>{t('player')}</span></div>
          <div><strong>{team.attendance}%</strong><span>{t('attendanceShort')}</span></div>
        </div>

        <button className="team-button" onClick={() => onOpen(team)}>
          {t('teamOpen')} <span>→</span>
        </button>
      </div>
    </div>
  )
}

/* =====================================================
   CALENDAR
===================================================== */

function CalendarPage({ t, trainings, setTrainings, teams, onOpenTeam, language = 'hu' }) {
  const today = new Date()
  const todayKey = today.toISOString().slice(0, 10)
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventForm, setEventForm] = useState({
    type: 'training', title: '', date: todayKey, startTime: '17:00', endTime: '18:30', teamId: teams[0]?.id || '',
  })

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7
  const monthName = cursor.toLocaleDateString(language === 'en' ? 'en-US' : 'hu-HU', { month: 'long', year: 'numeric' })

  const eventsForDay = (day) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return trainings.filter((training) => training.date === key)
  }

  const selectedEvents = selectedDate ? eventsForDay(selectedDate) : []

  function moveMonth(offset) {
    setCursor(new Date(year, month + offset, 1))
    setSelectedDate(null)
  }

  function openEventForm(date = '') {
    const fallback = date || `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDate || 1).padStart(2, '0')}`
    setEventForm({ type: 'training', title: '', date: fallback, startTime: '17:00', endTime: '18:30', teamId: teams[0]?.id || '' })
    setShowEventForm(true)
  }

  function saveEvent(event) {
    event.preventDefault()
    if (
      !eventForm.title.trim() ||
      !eventForm.date ||
      eventForm.endTime <= eventForm.startTime
    ) {
      return
    }
    const team = teams.find((item) => item.id === Number(eventForm.teamId))
    const icon = eventForm.type === 'match' ? '🏆 ' : eventForm.type === 'other' ? '📋 ' : ''
    const newEvent = {
      id: Date.now(), teamId: team?.id || teams[0]?.id, date: eventForm.date,
      startTime: eventForm.startTime, endTime: eventForm.endTime,
      title: `${icon}${eventForm.title.trim()}`, color: team?.color || 'purple', calendarType: eventForm.type,
    }
    setTrainings((current) => [newEvent, ...current])
    setCursor(new Date(`${eventForm.date}T12:00:00`))
    setSelectedDate(Number(eventForm.date.slice(-2)))
    setShowEventForm(false)
  }

  return (
    <div className="page">
      <div className="hero-header">
        <div><div className="eyebrow">{t('schedule')}</div><h1>{t('calendar')}</h1><p>{t('calendarDescription')}</p></div>
        <button className="neon-button" onClick={() => openEventForm()}>+ {t('newEvent')}</button>
      </div>

      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-toolbar">
            <button className="calendar-nav-button" onClick={() => moveMonth(-1)}>‹</button>
            <h2>{monthName}</h2>
            <button className="calendar-nav-button" onClick={() => moveMonth(1)}>›</button>
          </div>
          <div className="calendar-weekdays">{[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {Array.from({ length: firstDay }).map((_, index) => <div className="calendar-day muted" key={`empty-${index}`} />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1, events = eventsForDay(day), selected = selectedDate === day
              return <button key={day} className={`calendar-day ${selected ? 'selected' : ''}`} onClick={() => setSelectedDate(day)}>
                <span className="calendar-day-number">{day}</span>
                <div className="calendar-events">
                  {events.slice(0, 2).map((event) => <span key={event.id} className={`calendar-event ${event.color || 'purple'}`}>{event.startTime} · {event.title}</span>)}
                  {events.length > 2 && <small>+{events.length - 2} {t('all').toLowerCase()}</small>}
                </div>
              </button>
            })}
          </div>
        </section>

        <section className="calendar-side-card">
          <div className="card-label">{selectedDate ? `${selectedDate}. ${t('day')}` : t('selectedDay')}</div>
          <h2>{selectedDate ? t('dailyProgram') : t('chooseDay')}</h2>
          {!selectedDate && <p className="calendar-empty">{t('clickDay')}</p>}
          {selectedDate && selectedEvents.length === 0 && <div><p className="calendar-empty">{t('noEventsDay')}</p><button className="secondary-button" onClick={() => openEventForm()}>+ {t('eventForDay')}</button></div>}
          {selectedEvents.map((event) => {
            const team = teams.find((item) => item.id === event.teamId)
            return <button className="calendar-event-detail" key={event.id} onClick={() => team && onOpenTeam(team)}>
              <div className={`calendar-event-dot ${event.color || 'purple'}`} /><div><strong>{event.title}</strong><span>{team?.name || t('team')} · {event.startTime}–{event.endTime}</span></div><span>→</span>
            </button>
          })}
        </section>
      </div>

      {showEventForm && <div className="player-modal-backdrop" onClick={() => setShowEventForm(false)}>
        <form className="player-modal add-player-modal" onSubmit={saveEvent} onClick={(event) => event.stopPropagation()}>
          <button type="button" className="player-modal-close" onClick={() => setShowEventForm(false)}>×</button>
          <div className="player-modal-eyebrow">{t('calendar')}</div><h2>{t('newEvent')}</h2>
          <p className="player-modal-position">{t('addEventDescription')}</p>
          <div className="player-form">
            <div className="form-group"><label>{t('eventType')}</label><select value={eventForm.type} onChange={(e) => setEventForm((v) => ({...v, type:e.target.value}))}><option value="training">⚽ {t('training')}</option><option value="match">🏆 {t('match')}</option><option value="other">📋 {t('other')}</option></select></div>
            <div className="form-group"><label>{t('eventName')}</label><input autoFocus required value={eventForm.title} placeholder={language === 'en' ? 'e.g. U13 – league match' : 'Pl. U13 – bajnoki mérkőzés'} onChange={(e) => setEventForm((v) => ({...v, title:e.target.value}))}/></div>
            <div className="form-group"><label>{t('team').toUpperCase()}</label><select value={eventForm.teamId} onChange={(e) => setEventForm((v) => ({...v, teamId:e.target.value}))}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name} · {team.age}</option>)}</select></div>
            <div className="form-group"><label>{t('date')}</label><input type="date" required value={eventForm.date} onChange={(e) => setEventForm((v) => ({...v, date:e.target.value}))}/></div>
            <div className="player-form-row"><div className="form-group"><label>{t('start')}</label><input type="time" required value={eventForm.startTime} onChange={(e) => setEventForm((v) => ({...v, startTime:e.target.value}))}/></div><div className="form-group"><label>{t('end')}</label><input type="time" required value={eventForm.endTime} onChange={(e) => setEventForm((v) => ({...v, endTime:e.target.value}))}/></div></div>
          </div>
          <div className="player-form-actions"><button type="button" className="secondary-button" onClick={() => setShowEventForm(false)}>{t('cancel')}</button><button type="submit" className="neon-button">{t('saveEvent')}</button></div>
        </form>
      </div>}
    </div>
  )
}

/* =====================================================
   STATISTICS
===================================================== */

function StatisticsPage({ t, teams, players, trainings }) {
  const [selectedTeam, setSelectedTeam] = useState('all')

  const visiblePlayers = selectedTeam === 'all'
    ? players
    : players.filter((player) => player.teamId === Number(selectedTeam))

  const average = visiblePlayers.length
    ? Math.round(
        visiblePlayers.reduce((sum, player) => sum + player.attendance, 0) /
          visiblePlayers.length,
      )
    : 0

  const bestPlayer = visiblePlayers
    .slice()
    .sort((a, b) => b.attendance - a.attendance)[0]

  return (
    <div className="page">
      <div className="hero-header">
        <div>
          <div className="eyebrow">{t('analytics')}</div>
          <h1>{t('statistics')}</h1>
          <p>{t('statisticsDescription')}</p>
        </div>

        <div className="statistics-team-switcher" role="tablist" aria-label={t('team')}>
          <button
            type="button"
            className={selectedTeam === 'all' ? 'active' : ''}
            onClick={() => setSelectedTeam('all')}
          >
            {t('allTeams')}
          </button>
          {teams.map((team) => (
            <button
              type="button"
              key={team.id}
              className={selectedTeam === String(team.id) ? 'active' : ''}
              onClick={() => setSelectedTeam(String(team.id))}
            >
              <span className={`statistics-team-dot ${team.color || ''}`} />
              {team.name}
            </button>
          ))}
        </div>
      </div>

      <div className="stats">
        <Stat label={t('trainingsCount')} value={trainings.length} change="" text={t('plannedTraining')} icon="⚽" color="purple" />
        <Stat label={t('playersCount')} value={visiblePlayers.length} change="" text={t('selectedScope')} icon="♙" color="blue" />
        <Stat label={t('averageAttendance')} value={`${average}%`} change="" text={t('currentAverage')} icon="✓" color="green" />
        <Stat label={t('bestAttendance')} value={bestPlayer ? `${bestPlayer.attendance}%` : '—'} change="" text={bestPlayer?.name || t('noData')} icon="★" color="orange" />
      </div>

      <div className="statistics-grid">
        <section className="glass-card">
          <div className="card-heading">
            <div>
              <div className="card-label">{t('playersCount')}</div>
              <h2>{t('playerRanking')}</h2>
            </div>
          </div>

          <div className="statistics-list">
            {visiblePlayers
              .slice()
              .sort((a, b) => b.attendance - a.attendance)
              .map((player, index) => (
                <div className="statistics-row" key={player.id}>
                  <span className="statistics-rank">{index + 1}</span>
                  <div className="statistics-player">
                    <strong>{player.name}</strong>
                    <span>{teams.find((team) => team.id === player.teamId)?.name}</span>
                  </div>
                  <div className="statistics-bar">
                    <div style={{ width: `${player.attendance}%` }} />
                  </div>
                  <strong>{player.attendance}%</strong>
                </div>
              ))}
          </div>
        </section>

        <section className="glass-card">
          <div className="card-heading">
            <div>
              <div className="card-label">{t('teamsCount')}</div>
              <h2>{t('byTeam')}</h2>
            </div>
          </div>

          <div className="team-stat-list">
            {teams.map((team) => (
              <div className="team-stat-row" key={team.id}>
                <div className={`team-stat-dot ${team.color}`} />
                <div>
                  <strong>{team.name}</strong>
                  <span>{team.players} {t('players')}</span>
                </div>
                <strong>{team.attendance}%</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

/* =====================================================
   TRAININGS / ATTENDANCE
===================================================== */

function TrainingsPage({ t, trainings, teams, onOpenTeam, onNavigate, onOpenNewTraining, onEditTraining, onDeleteTraining }) {
  return (
    <div className="page">
      <div className="hero-header">
        <div>
          <div className="eyebrow">{t('trainings')}</div>
          <h1>{t('trainings')}</h1>
          <p>{t('allTrainings')}</p>
        </div>
        <div className="training-page-actions">
          <button className="neon-button" onClick={onOpenNewTraining}>+ {t('newTraining')}</button>
          <button className="secondary-button" onClick={() => onNavigate('calendar')}>{t('calendar')} →</button>
        </div>
      </div>

      {trainings.length === 0 ? (
        <button className="training-empty-state" onClick={onOpenNewTraining}>
          <div className="training-empty-plus">+</div>
          <strong>{t('newTraining')}</strong>
          <span>{t('createTraining')}</span>
        </button>
      ) : (
        <div className="training-overview-list">
          {trainings.map((training) => {
            const team = teams.find((item) => item.id === training.teamId)

            return (
              <div className="training-overview-card training-overview-card-actionable" key={training.id}>
                <button className="training-overview-main" type="button" onClick={() => team && onOpenTeam(team)}>
                  <div className="training-overview-date">
                    <span>{training.date.slice(5, 7)}.</span>
                    <strong>{training.date.slice(8, 10)}</strong>
                  </div>
                  <div className={`calendar-event-dot ${training.color}`} />
                  <div className="training-overview-info">
                    <strong>{training.title}</strong>
                    <span>{team?.name} · {training.startTime}–{training.endTime}</span>
                  </div>
                  <span>→</span>
                </button>
                <div className="training-overview-actions">
                  <button type="button" className="training-action-button" title={t('edit')} onClick={() => onEditTraining?.(training)}>✎</button>
                  <button type="button" className="training-action-button danger" title={t('delete')} onClick={() => onDeleteTraining?.(training)}>×</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AttendancePage({ t, language = 'hu', teams = [], players = [], trainings = [] }) {
  const today = new Date()
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [teamId, setTeamId] = useState(
    teams[0]?.id ? String(teams[0].id) : 'all',
  )

  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const monthName = cursor.toLocaleDateString(language === 'en' ? 'en-US' : 'hu-HU', {
    month: 'long',
    year: 'numeric',
  })

  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const selectedTeamId = teamId === 'all' ? null : Number(teamId)

  const visiblePlayers = players
    .filter((player) =>
      selectedTeamId === null ? true : player.teamId === selectedTeamId,
    )
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'hu'))

  const monthTrainings = trainings
    .filter((training) => {
      const type = training.calendarType || 'training'
      return (
        type === 'training' &&
        training.date?.startsWith(monthKey) &&
        (selectedTeamId === null || training.teamId === selectedTeamId)
      )
    })
    .slice()
    .sort((a, b) =>
      `${a.date}T${a.startTime || ''}`.localeCompare(
        `${b.date}T${b.startTime || ''}`,
      ),
    )

  function moveMonth(offset) {
    setCursor(new Date(year, month + offset, 1))
  }

  function goToCurrentMonth() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  function getStatus(training, playerId) {
    return training.attendance?.[playerId] || 'present'
  }

  function statusLabel(status) {
    if (status === 'absent') return '×'
    if (status === 'excused') return '◷'
    return '✓'
  }

  function statusClass(status) {
    return `attendance-cell-status ${status}`
  }

  const totals = visiblePlayers.reduce(
    (result, player) => {
      monthTrainings.forEach((training) => {
        const status = getStatus(training, player.id)

        if (status === 'present') result.present += 1
        else if (status === 'absent') result.absent += 1
        else if (status === 'excused') result.excused += 1

        result.total += 1
      })

      return result
    },
    { present: 0, absent: 0, excused: 0, total: 0 },
  )

  const countedTotal = totals.present + totals.absent
  const teamAttendance = countedTotal
    ? Math.round((totals.present / countedTotal) * 100)
    : 0

  return (
    <div className="page attendance-page">
      <div className="hero-header attendance-hero">
        <div>
          <div className="eyebrow">{t('attendance')}</div>
          <h1>{t('attendance')}</h1>
          <p>{t('attendanceOverview')}</p>
        </div>

        <div className="attendance-team-picker">
          <label>{t('team').toUpperCase()}</label>
          <select
            className="statistics-team-select"
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
          >
            {teams.length > 1 && <option value="all">{t('allTeams')}</option>}
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name} · {team.age}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="attendance-calendar-card">
        <div className="attendance-calendar-toolbar">
          <div className="attendance-month-navigation">
            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => moveMonth(-1)}
              aria-label={t('previousMonth')}
            >
              ‹
            </button>

            <div className="attendance-month-title">
              <div className="card-label">{t('monthlyAttendance')}</div>
              <h2>{monthName}</h2>
            </div>

            <button
              type="button"
              className="calendar-nav-button"
              onClick={() => moveMonth(1)}
              aria-label={t('nextMonth')}
            >
              ›
            </button>
          </div>

          <button
            type="button"
            className="secondary-button attendance-today-button"
            onClick={goToCurrentMonth}
          >
            {t('currentMonth')}
          </button>
        </div>

        <div className="attendance-summary">
          <div className="attendance-summary-card">
            <span>{t('sessions')}</span>
            <strong>{monthTrainings.length}</strong>
          </div>

          <div className="attendance-summary-card">
            <span>{t('present')}</span>
            <strong>{totals.present}</strong>
          </div>

          <div className="attendance-summary-card">
            <span>{t('absent')}</span>
            <strong>{totals.absent}</strong>
          </div>

          <div className="attendance-summary-card">
            <span>{t('excused')}</span>
            <strong>{totals.excused}</strong>
          </div>

          <div className="attendance-summary-card highlight">
            <span>{t('monthlyAverage')}</span>
            <strong>{monthTrainings.length ? `${teamAttendance}%` : '—'}</strong>
          </div>
        </div>

        {monthTrainings.length > 0 && visiblePlayers.length > 0 ? (
          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="attendance-player-header">
                    <span>{t('player')}</span>
                  </th>

                  {monthTrainings.map((training) => {
                    const date = new Date(`${training.date}T12:00:00`)
                    const day = date.getDate()
                    const weekday = date.toLocaleDateString('hu-HU', {
                      weekday: 'short',
                    }).replace('.', '')

                    const team = teams.find(
                      (item) => item.id === training.teamId,
                    )

                    return (
                      <th
                        key={training.id}
                        className="attendance-training-header"
                        title={`${training.title} · ${training.startTime || ''}`}
                      >
                        <div className="attendance-training-date">
                          <strong>{day}.</strong>
                          <span>{weekday}</span>
                        </div>
                        <small>{training.startTime || '—'}</small>
                      </th>
                    )
                  })}

                  <th className="attendance-total-header">
                    <span>{t('attendanceShort')}</span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {visiblePlayers.map((player) => {
                  let present = 0
                  let absent = 0
                  let excused = 0

                  monthTrainings.forEach((training) => {
                    const status = getStatus(training, player.id)

                    if (status === 'present') present += 1
                    if (status === 'absent') absent += 1
                    if (status === 'excused') excused += 1
                  })

                  const counted = present + absent
                  const percentage = counted
                    ? Math.round((present / counted) * 100)
                    : 0

                  const initials = player.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={player.id}>
                      <td className="attendance-player-cell">
                        <div className="attendance-player">
                          <div className="avatar">{initials}</div>
                          <div>
                            <strong>{player.name}</strong>
                            <span>
                              {teams.find(
                                (team) => team.id === player.teamId,
                              )?.name || 'Csapat'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {monthTrainings.map((training) => {
                        const status = getStatus(training, player.id)

                        return (
                          <td
                            key={training.id}
                            className="attendance-cell"
                            title={`${training.title} · ${
                              status === 'present'
                                ? t('present')
                                : status === 'absent'
                                  ? t('absent')
                                  : t('excused')
                            }`}
                          >
                            <span className={statusClass(status)}>
                              {statusLabel(status)}
                            </span>
                          </td>
                        )
                      })}

                      <td className="attendance-total-cell">
                        <strong>{percentage}%</strong>
                        <small>
                          {present}/{counted || monthTrainings.length}
                        </small>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="attendance-empty">
            <div className="placeholder-icon">✓</div>
            <h2>
              {visiblePlayers.length === 0
                ? t('noPlayers')
                : t('noTrainingsThisMonth')}
            </h2>
            <p>
              {visiblePlayers.length === 0
                ? t('noPlayersDescription')
                : t('noTrainingsThisMonthDescription')}
            </p>
          </div>
        )}


      </section>
    </div>
  )
}

/* =====================================================
   SETTINGS
===================================================== */

function SettingsPage({
  t,
  theme,
  language,
  onLanguageChange,
  setTheme,
  profile,
  setProfile,
}) {
  const [form, setForm] = useState(profile)
  const [notifications, setNotifications] = useState(true)
  const [reminders, setReminders] = useState(true)
  const [defaultTime, setDefaultTime] = useState(
    '17:00',
  )
  const [defaultDuration, setDefaultDuration] =
    useState('90')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm(profile)
  }, [profile])

  function save(event) {
    event.preventDefault()

    setProfile({
      name: form.name.trim() || profile.name,
      role: form.role.trim() || 'coach',
      email: form.email.trim(),
      club: form.club.trim(),
    })

    localStorage.setItem(
      'coachapp-settings',
      JSON.stringify({
        notifications,
        reminders,
        defaultTime,
        defaultDuration,
      }),
    )

    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  return (
    <form className="page" onSubmit={save}>
      <div className="hero-header">
        <div>
          <div className="eyebrow">{t('account')}</div>
          <h1>{t('settings')}</h1>
          <p>{t('settingsDescription')}</p>
        </div>

        <button className="neon-button" type="submit">
          {saved
            ? t('saved')
            : t('saveChanges')}
        </button>
      </div>

      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-heading">
            <span>🌐</span>
            <div>
              <strong>{t('language')}</strong>
              <small>{t('languageDescription')}</small>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group">
              <label>{t('language')}</label>
              <select
                value={language}
                onChange={(event) => onLanguageChange(event.target.value)}
              >
                <option value="hu">🇭🇺 Magyar</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span>👤</span>
            <div>
              <strong>{t('profileSettings')}</strong>
              <small>
                {t('profileDescription')}
              </small>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group">
              <label>{t('name')}</label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>{t('role')}</label>
              <input
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>{t('email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label>{t('club')}</label>
              <input
                value={form.club}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    club: event.target.value,
                  }))
                }
                placeholder="Klub neve"
              />
            </div>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span>◐</span>
            <div>
              <strong>{t('appearance')}</strong>
              <small>
                {t('appearanceDescription')}
              </small>
            </div>
          </div>

          <div className="theme-choice-grid">
            <button
              type="button"
              className={
                theme === 'dark'
                  ? 'theme-choice active'
                  : 'theme-choice'
              }
              onClick={() =>
                theme !== 'dark' && setTheme()
              }
            >
              <div className="theme-preview dark-preview" />
              <strong>{t('dark')}</strong>
            </button>

            <button
              type="button"
              className={
                theme === 'light'
                  ? 'theme-choice active'
                  : 'theme-choice'
              }
              onClick={() =>
                theme !== 'light' && setTheme()
              }
            >
              <div className="theme-preview light-preview" />
              <strong>{t('light')}</strong>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span>🔔</span>
            <div>
              <strong>{t('notifications')}</strong>
              <small>
                {t('notificationsDescription')}
              </small>
            </div>
          </div>

          <ToggleRow
            label={t('trainingReminders')}
            text={t('trainingRemindersDescription')}
            value={reminders}
            setValue={setReminders}
          />

          <ToggleRow
            label={t('attendanceNotifications')}
            text={t('attendanceNotificationsDescription')}
            value={notifications}
            setValue={setNotifications}
          />
        </section>

        <section className="settings-card">
          <div className="settings-card-heading">
            <span>⚙</span>
            <div>
              <strong>{t('defaults')}</strong>
              <small>
                {t('defaultsDescription')}
              </small>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="form-group">
              <label>{t('defaultTrainingTime')}</label>
              <select
                value={defaultTime}
                onChange={(event) =>
                  setDefaultTime(event.target.value)
                }
              >
                <option>16:00</option>
                <option>17:00</option>
                <option>18:00</option>
                <option>19:00</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t('trainingLength')}</label>
              <select
                value={defaultDuration}
                onChange={(event) =>
                  setDefaultDuration(event.target.value)
                }
              >
                <option value="60">60 {t('minutes')}</option>
                <option value="75">75 {t('minutes')}</option>
                <option value="90">90 {t('minutes')}</option>
                <option value="120">120 {t('minutes')}</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </form>
  )
}

function ToggleRow({ label, text, value, setValue }) {
  return (
    <div className="toggle-row">
      <div><strong>{label}</strong><span>{text}</span></div>
      <button
        type="button"
        className={`toggle ${value ? 'on' : ''}`}
        onClick={() => setValue(!value)}
      >
        <span />
      </button>
    </div>
  )
}

/* =====================================================
   PROFILE
===================================================== */

function ProfilePage({
  t,
  teams,
  totalPlayers,
  trainings,
  players,
  profile,
  setProfile,
}) {
  const [showEditProfile, setShowEditProfile] = useState(false)

  const [form, setForm] = useState(profile)

  const average = players.length
    ? Math.round(
        players.reduce(
          (sum, player) => sum + player.attendance,
          0,
        ) / players.length,
      )
    : 0

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openEditProfile() {
    setForm(profile)
    setShowEditProfile(true)
  }

  function closeEditProfile() {
    setShowEditProfile(false)
    setForm(profile)
  }

  function saveProfile(event) {
    event.preventDefault()

    if (!form.name.trim()) return

    const profileEmail = String(profile.email || '').trim().toLowerCase()
    const updatedProfile = {
      name: form.name.trim(),
      role: profileEmail === 'pappcsabi7126@gmail.com' ? 'admin' : (form.role.trim() || 'coach'),
      club: form.club.trim(),
      email: form.email.trim(),
    }

    setProfile(updatedProfile)
    setShowEditProfile(false)
  }

  return (
    <div className="page">

      <div className="profile-hero">

        <div className="profile-avatar-large" aria-hidden="true">
          <svg viewBox="0 0 48 48" role="presentation">
            <circle cx="24" cy="16" r="8" fill="currentColor" />
            <path d="M10 40c0-7.2 6.3-13 14-13s14 5.8 14 13" fill="currentColor" />
          </svg>
        </div>

        <div>
          <div className="eyebrow">{t('coachProfile')}</div>

          <h1>
            {profile.name}
          </h1>

          <p>
            {profile.role === 'admin' ? 'Admin' : profile.role}
            {profile.club
              ? ` · ${profile.club}`
              : ' · TactiKick'}
          </p>
        </div>

        <button
          className="neon-button profile-edit-button"
          onClick={openEditProfile}
        >
          {t('editProfile')}
        </button>

      </div>


      <div className="profile-stat-grid">

        <ProfileStat
          value={teams.length}
          label={t('team')}
        />

        <ProfileStat
          value={totalPlayers}
          label={t('player')}
        />

        <ProfileStat
          value={trainings.length}
          label={t('training')}
        />

        <ProfileStat
          value={`${average}%`}
          label={t('averageAttendance')}
        />

      </div>


      <div className="profile-content-grid">

        <section className="glass-card">

          <div className="card-label">{t('activeTeams')}</div>

          <h2>{t('teams')}</h2>

          <div className="profile-team-list">

            {teams.map((team) => (

              <div
                className="profile-team-row"
                key={team.id}
              >

                <div
                  className={`team-stat-dot ${team.color}`}
                />

                <div>
                  <strong>
                    {team.name}
                  </strong>

                  <span>
                    {team.age}
                  </span>
                </div>

                <strong>
                  {team.players} {t('players')}
                </strong>

              </div>

            ))}

          </div>

        </section>


        <section className="glass-card">

          <div className="card-label">{t('coachSummary')}</div>

          <h2>{t('performance')}</h2>

          <div className="profile-summary">

            <div>
              <span>{t('trainings')}</span>
              <strong>{trainings.length}</strong>
            </div>

            <div>
              <span>{t('players')}</span>
              <strong>{totalPlayers}</strong>
            </div>

            <div>
              <span>{t('attendanceShort')}</span>
              <strong>{average}%</strong>
            </div>

          </div>

        </section>

      </div>


      {showEditProfile && (

        <div
          className="player-modal-backdrop"
          onClick={closeEditProfile}
        >

          <form
            className="player-modal add-player-modal"
            onSubmit={saveProfile}
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="player-modal-close"
              onClick={closeEditProfile}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">{t('profile')}</div>

            <h2>{t('editProfile')}</h2>

            <p className="player-modal-position">
              {t('editProfileDescription')}
            </p>

            <div className="player-form">

              <div className="form-group">
                <label>{t('name')}</label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      'name',
                      event.target.value,
                    )
                  }
                  autoFocus
                  required
                />
              </div>


              <div className="form-group">
                <label>{t('role')}</label>

                <input
                  type="text"
                  value={String(profile.email || '').trim().toLowerCase() === 'pappcsabi7126@gmail.com' ? 'Admin' : form.role}
                  onChange={(event) =>
                    updateField(
                      'role',
                      event.target.value,
                    )
                  }
                  placeholder="Pl. Coach"
                  readOnly={String(profile.email || '').trim().toLowerCase() === 'pappcsabi7126@gmail.com'}
                />
              </div>


              <div className="form-group">
                <label>{t('club')}</label>

                <input
                  type="text"
                  value={form.club}
                  onChange={(event) =>
                    updateField(
                      'club',
                      event.target.value,
                    )
                  }
                  placeholder="Klub neve"
                />
              </div>


              <div className="form-group">
                <label>{t('email')}</label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value,
                    )
                  }
                />
              </div>

            </div>


            <div className="player-form-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={closeEditProfile}
              >
                {t('cancel')}
              </button>

              <button
                type="submit"
                className="neon-button"
              >
                {t('save')}
              </button>

            </div>

          </form>

        </div>

      )}

    </div>
  )
}

function ProfileStat({ value, label }) {
  return (
    <div className="profile-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

/* =====================================================
   AI EDZÉS – EGYELŐRE VÁLTOZATLAN / DEMO
===================================================== */

export default App