import { teamTranslations } from './teamI18n'

export const languages = {
  hu: {
    name: 'Magyar',
    flag: '🇭🇺',
    // App UI / modals
    language: 'Nyelv',
    languageDescription: 'Válaszd ki az alkalmazás nyelvét',
    quickSearch: 'QUICK SEARCH',
    searchButton: 'Keresés...',
    notifications: 'Értesítések',
    profileMenu: 'Profil menü',
    signOut: 'Kijelentkezés',
    teamDeleteEyebrow: 'CSAPAT TÖRLÉSE',
    teamDeleteDescription: 'A(z) {team} csapat, a hozzá tartozó játékosok és az edzések törlődnek. Ez a művelet nem vonható vissza.',
    teamEditDescription: 'Módosítsd a csapat adatait. A játékosok és az edzések megmaradnak.',
    profileEditDescription: 'Módosítsd az edzői profilod adatait.',
    addEventDescription: 'Adj hozzá edzést, meccset vagy egyéb programot.',
    searchNoResults: 'Nincs találat.',
    searchTeam: 'Csapat',
    searchPlayer: 'Játékos',
    searchTraining: 'Edzés',
    today: 'Ma',
    day: 'NAP',
    selectedDay: 'KIVÁLASZTOTT NAP',
    clickDay: 'Kattints egy napra, vagy adj hozzá új eseményt.',
    nextTrainingOpen: 'Edzés / csapat megnyitása',
    teamPlayers: 'Játékos',
    teamAttendance: 'Jelenlét',
    activePill: 'AKTÍV',
    teamsEyebrow: 'CSAPATAID',
    teamsActive: 'Aktív csapatok',
    allTeamsLink: 'Összes',
    nextTrainingLabel: 'KÖVETKEZŐ EDZÉS',
    todayProgramLabel: 'MAI PROGRAM',
    nextBadge: 'KÖVETKEZŐ',
    scheduledTrainings: 'tervezett edzés',
    currentAverageText: 'aktuális átlag',
    totalPlayersText: 'összes játékos',
    activeTeamText: 'aktív csapat',
    venue: 'Városi Sportpálya',
    trainingOpenCalendar: 'Naptár',
    teamCreateEyebrow: 'ÚJ CSAPAT',
    teamEditEyebrow: 'CSAPAT',
    teamCreateDescription: 'Csapat létrehozása',
    teamColorLabel: 'CSAPAT SZÍNE',
    saveTeamChanges: 'Változtatások mentése',
    createTeamButton: 'Csapat létrehozása',
    openTeamButton: 'Csapat megnyitása',
    deleteTeamButton: 'Csapat törlése',
    calendarEyebrow: 'NAPTÁR',
    attendanceEyebrow: 'ATTENDANCE',
    statisticsEyebrow: 'ANALYTICS',
    profileEyebrow: 'COACH PROFILE',
    accountEyebrow: 'ACCOUNT',
    trainingEyebrow: 'TRAININGS',
    notificationEyebrow: 'NOTIFICATIONS',
    editProfileDescription: 'Módosítsd az edzői profilod adatait.',
    roleLabel: 'SZEREPKÖR',
    teamLabel: 'CSAPAT',
    playerCountLabel: 'JÁTÉKOSOK',
    durationLabel: 'EDZÉS HOSSZA',
    defaultTimeLabel: 'ALAPÉRTELMEZETT EDZÉSIDŐ',
    savedChanges: '✓ Mentve',
    currentAverageAttendance: 'aktuális átlag',
    noData: 'Nincs adat',
    noTeam: 'Csapat',


  },

  en: {
    name: 'English',
    flag: '🇬🇧',
    // App UI / modals
    language: 'Language',
    languageDescription: 'Choose the language of the application',
    searchButton: 'Search...',
    profileMenu: 'Profile menu',
    signOut: 'Log out',
    teamDeleteEyebrow: 'DELETE TEAM',
    teamDeleteDescription: 'The {team} team, its players and trainings will be deleted. This action cannot be undone.',
    teamEditDescription: 'Edit the team details. Players and trainings will remain unchanged.',
    profileEditDescription: 'Edit your coaching profile details.',
    addEventDescription: 'Add a training, match or other event.',
    searchNoResults: 'No results.',
    searchTeam: 'Team',
    searchPlayer: 'Player',
    searchTraining: 'Training',
    today: 'Today',
    day: 'DAY',
    selectedDay: 'SELECTED DAY',
    clickDay: 'Click a day or add a new event.',
    nextTrainingOpen: 'Open training / team',
    teamPlayers: 'Players',
    teamAttendance: 'Attendance',
    activePill: 'ACTIVE',
    teamsEyebrow: 'YOUR TEAMS',
    teamsActive: 'Active teams',
    allTeamsLink: 'All',
    nextTrainingLabel: 'NEXT TRAINING',
    todayProgramLabel: "TODAY'S PROGRAM",
    nextBadge: 'NEXT',
    scheduledTrainings: 'scheduled trainings',
    currentAverageText: 'current average',
    totalPlayersText: 'total players',
    activeTeamText: 'active team',
    venue: 'City Sports Ground',
    trainingOpenCalendar: 'Calendar',
    teamCreateEyebrow: 'NEW TEAM',
    teamEditEyebrow: 'TEAM',
    teamCreateDescription: 'Create a team',
    teamColorLabel: 'TEAM COLOR',
    saveTeamChanges: 'Save changes',
    createTeamButton: 'Create team',
    openTeamButton: 'Open team',
    deleteTeamButton: 'Delete team',
    calendarEyebrow: 'CALENDAR',
    attendanceEyebrow: 'ATTENDANCE',
    statisticsEyebrow: 'ANALYTICS',
    profileEyebrow: 'COACH PROFILE',
    accountEyebrow: 'ACCOUNT',
    trainingEyebrow: 'TRAININGS',
    notificationEyebrow: 'NOTIFICATIONS',
    editProfileDescription: 'Edit your coaching profile details.',
    roleLabel: 'ROLE',
    teamLabel: 'TEAM',
    playerCountLabel: 'PLAYERS',
    durationLabel: 'TRAINING LENGTH',
    defaultTimeLabel: 'DEFAULT TRAINING TIME',
    savedChanges: '✓ Saved',
    currentAverageAttendance: 'current average',
    noData: 'No data',
    noTeam: 'Team',


  },

}

const translations = {
  hu: {
    // Navigation
    home: 'Kezdőlap',
    teams: 'Csapataim',
    trainings: 'Edzések',
    attendance: 'Jelenlét',
    calendar: 'Naptár',
    club: 'Klub',
    statistics: 'Statisztikák',
    settings: 'Beállítások',
    profile: 'Profil',
    aiTraining: 'AI Edzés',
    aiTrainingDescription: 'Generálj teljes edzéstervet AI segítségével a csapatodhoz.',
    aiExtraRequestPlaceholder: 'Pl. szeretnék sok kisjátékot, kevés várakozási időt és minél több labdás gyakorlatot...',

    workspace: 'WORKSPACE',
    management: 'MANAGEMENT',

    // General
    save: 'Mentés',
    cancel: 'Mégse',
    delete: 'Törlés',
    edit: 'Szerkesztés',
    close: 'Bezárás',
    viewImage: 'Kép megnyitása',
    create: 'Létrehozás',
    back: 'Vissza',
    search: 'Keresés',
    active: 'AKTÍV',
    yes: 'Igen',
    no: 'Nem',

    // Dashboard
    goodTraining: 'Jó edzést',
    everythingForToday: 'Minden, amire szükséged van a mai edzésekhez.',
    openCalendar: 'Naptár megnyitása',
    teamsCount: 'CSAPATOK',
    playersCount: 'JÁTÉKOSOK',
    averageAttendance: 'ÁTLAGOS JELENLÉT',
    trainingsCount: 'EDZÉSEK',
    activeTeam: 'aktív csapat',
    totalPlayers: 'összes játékos',
    currentAverage: 'aktuális átlag',
    plannedTraining: 'tervezett edzés',

    venue: 'Városi Sportpálya',
    nextTraining: 'KÖVETKEZŐ EDZÉS',
    next: 'KÖVETKEZŐ',
    todayProgram: 'MAI PROGRAM',
    todayTrainings: 'Mai edzések',
    activeTeams: 'Aktív csapatok',
    all: 'Összes',

    // Teams
    manageTeams: 'Kezeld a játékosaidat és csapataidat.',
    newTeam: 'Új csapat',
    createTeam: 'Csapat létrehozása',
    teamName: 'Csapat neve',
    ageGroup: 'Korosztály',
    teamColor: 'Csapat színe',
    teamOpen: 'Csapat megnyitása',
    editTeam: 'Csapat szerkesztése',
    deleteTeam: 'Csapat törlése',
    teamUpdated: 'Változtatások mentése',
    noAge: 'Nincs megadva',

    purple: 'Lila',
    blue: 'Kék',
    green: 'Zöld',

    deleteConfirm: 'Biztosan törlöd?',
    deleteTeamDescription:
      'A(z) {team} csapat, a hozzá tartozó játékosok és az edzések törlődnek. Ez a művelet nem vonható vissza.',

    // Training
    allTrainings: 'Az összes tervezett edzésed egy helyen.',
    trainingPlan: 'Edzésterv',
    trainingStructure: 'Az edzés felépítése',
    exercise: 'gyakorlat',
    exercises: 'gyakorlat',
    minutes: 'perc',

    // Attendance
    attendanceOverview:
      'Havi áttekintés a csapatod edzéslátogatásáról.',
    monthlyAttendance: 'HAVI JELENLÉT',
    currentMonth: 'Aktuális hónap',
    previousMonth: 'Előző hónap',
    nextMonth: 'Következő hónap',
    sessions: 'EDZÉSEK',
    present: 'JELEN',
    absent: 'HIÁNYZIK',
    excused: 'IGAZOLT',
    monthlyAverage: 'HAVI ÁTLAG',
    player: 'JÁTÉKOS',
    attendanceShort: 'JELENLÉT',
    noPlayers:
      'Nincs játékos a kiválasztott csapatban',
    noTrainingsThisMonth:
      'Nincs edzés ebben a hónapban',

    addPlayersDescription:
      'Adj hozzá játékosokat a csapathoz, és itt automatikusan megjelennek.',
    addTrainingDescription:
      'Ha rögzítesz egy edzést ebben a hónapban, az automatikusan megjelenik ebben a táblázatban.',

    // Calendar
    mon: 'MON',
    tue: 'TUE',
    wed: 'WED',
    thu: 'THU',
    fri: 'FRI',
    sat: 'SAT',
    sun: 'SUN',
    schedule: 'SCHEDULE',
    calendarDescription:
      'Tekintsd át és kezeld az összes programodat egy helyen.',
    newEvent: 'Új esemény',
    event: 'Esemény',
    eventType: 'TÍPUS',
    eventName: 'MEGNEVEZÉS',
    date: 'DÁTUM',
    start: 'KEZDÉS',
    end: 'BEFEJEZÉS',
    training: 'Edzés',
    match: 'Meccs',
    other: 'Egyéb',
    saveEvent: 'Esemény mentése',
    dailyProgram: 'Napi program',
    chooseDay: 'Válassz egy napot',
    noEventsDay:
      'Erre a napra nincs tervezett program.',
    eventForDay: 'Esemény erre a napra',

    // Statistics
    analytics: 'ANALYTICS',
    statisticsDescription:
      'Átlásd a csapataid teljesítményét és jelenlétét.',
    allTeams: 'Összes csapat',
    playerRanking: 'Jelenléti rangsor',
    byTeam: 'Csapatonként',
    bestAttendance: 'LEGJOBB JELENLÉT',

    // Settings
    account: 'ACCOUNT',
    settingsDescription:
      'Az alkalmazás és a profilod személyre szabása.',
    saveChanges: 'Változtatások mentése',
    saved: '✓ Mentve',

    profileSettings: 'Profil',
    profileDescription: 'Az edzői profilod adatai',
    name: 'NÉV',
    role: 'POZÍCIÓ',
    email: 'EMAIL',
    club: 'KLUB',

    appearance: 'Megjelenés',
    appearanceDescription:
      'Válaszd ki a kedvenc megjelenésedet',
    dark: 'Sötét',
    light: 'Világos',

    notifications: 'Értesítések',
    notificationsDescription:
      'Válaszd ki, miről szeretnél értesítést kapni',
    trainingReminders: 'Edzés emlékeztetők',
    trainingRemindersDescription:
      'Emlékeztessen a közelgő edzésekre.',
    attendanceNotifications: 'Jelenléti értesítések',
    attendanceNotificationsDescription:
      'Értesítés új vagy módosított jelenléti adatoknál.',

    defaults: 'Alapértelmezések',
    defaultsDescription: 'Gyorsabb edzéslétrehozás',
    defaultTrainingTime: 'ALAPÉRTELMEZETT EDZÉSIDŐ',
    trainingLength: 'EDZÉS HOSSZA',

    // Profile
    coachProfile: 'COACH PROFILE',
    editProfile: 'Profil szerkesztése',
    coachSummary: 'EDZŐI ÖSSZESÍTÉS',
    performance: 'Teljesítmény',
    team: 'Csapat',

    // Search
    quickSearch: 'QUICK SEARCH',
    searchTactiKick: 'Keresés a TactiKickban',
    searchPlaceholder: 'Csapat, játékos vagy edzés...',
    teamResult: 'Csapat',
    playerResult: 'Játékos',
    trainingResult: 'Edzés',
    noResults: 'Nincs találat.',

    // Notifications
    notificationTitle: 'Értesítések',
    trainingToday: 'Ma van tervezett edzésed.',
    noNotifications: 'Nincs új értesítés.',

    // Auth / errors
    loading: 'TactiKick betöltése…',
    cloudConnectionError:
      'A Supabase kapcsolat nem sikerült.',
    dataLoadError:
      'Az adatok betöltése nem sikerült.',
    cloudSaveError:
      'A felhőbe mentés nem sikerült.',
    profileSaveError:
      'A profil mentése nem sikerült.',

    logout: 'Kijelentkezés',

    // AI planner

    objectiveBuildUp: 'Labdakihozatal',
    objectivePossession: 'Labdabirtoklás',
    objectivePressing: 'Presszing',
    objectiveAttack: 'Támadásépítés',
    objectiveDefending: 'Védekezés',
    objectiveTransitions: 'Átmenetek',
    objectiveTechnical: 'Technikai képzés',
    intensityLow: 'Alacsony',
    intensityMedium: 'Közepes',
    intensityHigh: 'Magas',
    aiCoach: 'AI Edző',
    aiTrainingTitle: 'AI Edzés',
    aiTrainingIntro: 'Állítsd be az edzés fő paramétereit, az AI pedig ezek alapján készíti el a teljes edzéstervet.',
    noTeamsYet: 'Nincs még csapatod',
    createTeamFirstAI: 'Először hozz létre egy csapatot, utána tudsz AI edzést készíteni.',
    teamStep: 'CSAPAT',
    whichTeam: 'Melyik csapatnak?',
    selectTeam: 'CSAPAT KIVÁLASZTÁSA',
    trainingStep: 'EDZÉS',
    trainingGoal: 'Mit szeretnél gyakorolni?',
    customGoal: 'Saját cél',
    customTrainingGoal: 'SAJÁT EDZÉSCÉL',
    customGoalPlaceholder: 'Pl. 1v1 védekezés',
    add: 'Hozzáadás',
    parametersStep: 'PARAMÉTEREK',
    fineTune: 'Finomhangolás',
    duration: 'Időtartam',
    intensity: 'Intenzitás',
    extraRequest: 'Extra kérés',
    optional: 'opcionális',
    extraRequestPlaceholder: 'Pl. legyen benne két kisjáték, kevés várakozási idő és sok labdás gyakorlat...',
    aiPlan: 'AI EDZÉSTERV',
    chooseTeam: 'Válassz csapatot',
    generateTraining: 'Edzés generálása',
    trainingGenerating: 'Edzésterv készül…',
    warmup: 'Bemelegítés',
    mainExercises: 'Fő gyakorlatok',
    smallSidedGame: 'Kisjáték',
    cooldown: 'Levezetés',
    preview: 'ELŐNÉZET',
    saveAsTraining: 'Mentés edzésként',
    aiCoachDescription: 'A generált tervet később elmentheted a csapathoz, és az edzés részleteinél módosíthatod.',
  },
  en: {
    home: 'Home',
    teams: 'My Teams',
    trainings: 'Trainings',
    attendance: 'Attendance',
    calendar: 'Calendar',
    club: 'Club',
    statistics: 'Statistics',
    settings: 'Settings',
    profile: 'Profile',
    aiTraining: 'AI Training',
    aiTrainingDescription: 'Generate a complete training plan for your team with AI.',
    aiExtraRequestPlaceholder: 'e.g. more small-sided games, less waiting time and more ball work...',

    workspace: 'WORKSPACE',
    management: 'MANAGEMENT',

    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    viewImage: 'Open image',
    create: 'Create',
    back: 'Back',
    search: 'Search',
    active: 'ACTIVE',
    yes: 'Yes',
    no: 'No',

    goodTraining: 'Have a great training',
    everythingForToday:
      'Everything you need for today’s training sessions.',
    openCalendar: 'Open calendar',
    teamsCount: 'TEAMS',
    playersCount: 'PLAYERS',
    averageAttendance: 'AVERAGE ATTENDANCE',
    trainingsCount: 'TRAININGS',
    activeTeam: 'active teams',
    totalPlayers: 'total players',
    currentAverage: 'current average',
    plannedTraining: 'planned training',

    venue: 'City Sports Ground',
    nextTraining: 'NEXT TRAINING',
    next: 'NEXT',
    todayProgram: 'TODAY’S PROGRAM',
    todayTrainings: 'Today’s trainings',
    activeTeams: 'Active teams',
    all: 'All',

    manageTeams:
      'Manage your players and teams.',
    newTeam: 'New team',
    createTeam: 'Create team',
    teamName: 'Team name',
    ageGroup: 'Age group',
    teamColor: 'Team color',
    teamOpen: 'Open team',
    editTeam: 'Edit team',
    deleteTeam: 'Delete team',
    teamUpdated: 'Save changes',
    noAge: 'Not specified',

    purple: 'Purple',
    blue: 'Blue',
    green: 'Green',

    deleteConfirm: 'Are you sure?',
    deleteTeamDescription:
      'The {team} team, its players and trainings will be deleted. This action cannot be undone.',

    allTrainings:
      'All your planned trainings in one place.',
    trainingPlan: 'Training plan',
    trainingStructure: 'Training structure',
    exercise: 'exercise',
    exercises: 'exercises',
    minutes: 'min',

    attendanceOverview:
      'Monthly overview of your team’s attendance.',
    monthlyAttendance: 'MONTHLY ATTENDANCE',
    currentMonth: 'Current month',
    previousMonth: 'Previous month',
    nextMonth: 'Next month',
    sessions: 'TRAININGS',
    present: 'PRESENT',
    absent: 'ABSENT',
    excused: 'EXCUSED',
    monthlyAverage: 'MONTHLY AVERAGE',
    player: 'PLAYER',
    attendanceShort: 'ATTENDANCE',
    noPlayers: 'No players in the selected team',
    noTrainingsThisMonth:
      'No trainings this month',

    addPlayersDescription:
      'Add players to the team and they will appear here automatically.',
    addTrainingDescription:
      'When you schedule a training this month, it will automatically appear in this table.',

    schedule: 'SCHEDULE',
    calendarDescription:
      'Review and manage all your events in one place.',
    newEvent: 'New event',
    event: 'Event',
    eventType: 'TYPE',
    eventName: 'NAME',
    date: 'DATE',
    start: 'START',
    end: 'END',
    training: 'Training',
    match: 'Match',
    other: 'Other',
    saveEvent: 'Save event',
    dailyProgram: 'Daily schedule',
    chooseDay: 'Choose a day',
    noEventsDay: 'No events scheduled for this day.',
    eventForDay: 'Event for this day',

    analytics: 'ANALYTICS',
    statisticsDescription:
      'Understand your teams’ performance and attendance.',
    allTeams: 'All teams',
    playerRanking: 'Attendance ranking',
    byTeam: 'By team',
    bestAttendance: 'BEST ATTENDANCE',

    account: 'ACCOUNT',
    settingsDescription:
      'Customize the app and your profile.',
    saveChanges: 'Save changes',
    saved: '✓ Saved',

    profileSettings: 'Profile',
    profileDescription: 'Your coaching profile details',
    name: 'NAME',
    role: 'ROLE',
    email: 'EMAIL',
    club: 'CLUB',

    appearance: 'Appearance',
    appearanceDescription:
      'Choose your preferred appearance',
    dark: 'Dark',
    light: 'Light',

    notifications: 'Notifications',
    notificationsDescription:
      'Choose which notifications you want to receive',
    trainingReminders: 'Training reminders',
    trainingRemindersDescription:
      'Remind me about upcoming trainings.',
    attendanceNotifications: 'Attendance notifications',
    attendanceNotificationsDescription:
      'Notify me when attendance data changes.',

    defaults: 'Defaults',
    defaultsDescription: 'Faster training creation',
    defaultTrainingTime: 'DEFAULT TRAINING TIME',
    trainingLength: 'TRAINING LENGTH',

    coachProfile: 'COACH PROFILE',
    editProfile: 'Edit profile',
    coachSummary: 'COACH SUMMARY',
    performance: 'Performance',
    team: 'Team',

    quickSearch: 'QUICK SEARCH',
    searchTactiKick: 'Search TactiKick',
    searchPlaceholder: 'Team, player or training...',
    teamResult: 'Team',
    playerResult: 'Player',
    trainingResult: 'Training',
    noResults: 'No results.',

    notificationTitle: 'Notifications',
    trainingToday: 'You have a training scheduled today.',
    noNotifications: 'No new notifications.',

    loading: 'Loading TactiKick…',
    cloudConnectionError:
      'The Supabase connection failed.',
    dataLoadError:
      'Failed to load data.',
    cloudSaveError:
      'Failed to save to the cloud.',
    profileSaveError:
      'Failed to save your profile.',

    logout: 'Log out',

    // AI planner

    objectiveBuildUp: 'Build-up',
    objectivePossession: 'Possession',
    objectivePressing: 'Pressing',
    objectiveAttack: 'Attacking build-up',
    objectiveDefending: 'Defending',
    objectiveTransitions: 'Transitions',
    objectiveTechnical: 'Technical training',
    intensityLow: 'Low',
    intensityMedium: 'Medium',
    intensityHigh: 'High',
    aiCoach: 'AI Coach',
    aiTrainingTitle: 'AI Training',
    aiTrainingIntro: 'Set the main training parameters and AI will create the complete training plan based on them.',
    noTeamsYet: 'No teams yet',
    createTeamFirstAI: 'Create a team first, then you can generate an AI training session.',
    teamStep: 'TEAM',
    whichTeam: 'Which team?',
    selectTeam: 'SELECT TEAM',
    trainingStep: 'TRAINING',
    trainingGoal: 'What do you want to train?',
    customGoal: 'Custom goal',
    customTrainingGoal: 'CUSTOM TRAINING GOAL',
    customGoalPlaceholder: 'e.g. 1v1 defending',
    add: 'Add',
    parametersStep: 'PARAMETERS',
    fineTune: 'Fine-tune',
    duration: 'Duration',
    intensity: 'Intensity',
    extraRequest: 'Extra request',
    optional: 'optional',
    extraRequestPlaceholder: 'e.g. include two small-sided games, little waiting time and lots of ball work...',
    aiPlan: 'AI TRAINING PLAN',
    chooseTeam: 'Choose a team',
    generateTraining: 'Generate training',
    trainingGenerating: 'Generating training plan…',
    warmup: 'Warm-up',
    mainExercises: 'Main exercises',
    smallSidedGame: 'Small-sided game',
    cooldown: 'Cool-down',
    preview: 'PREVIEW',
    saveAsTraining: 'Save as training',
    aiCoachDescription: 'You can save the generated plan to the team and edit it later in the training details.',
  },
}

export function getInitialLanguage() {
  const saved = localStorage.getItem('coachapp-language')

  // TactiKick currently supports only Hungarian and English.
  // Any legacy/unsupported language selection falls back to Hungarian.
  if (saved === 'hu' || saved === 'en') {
    return saved
  }

  return 'hu'
}

export function saveLanguage(language) {
  if (!translations[language]) return

  localStorage.setItem('coachapp-language', language)
}

export function getTranslations(language) {
  const base = translations[language] || translations.hu
  const team = teamTranslations[language] || teamTranslations.hu

  return {
    ...base,
    ...team,
  }
}

export function createTranslator(language) {
  const dictionary = getTranslations(language)

  return function t(key, variables = {}) {
    let value = dictionary[key] ?? translations.hu[key] ?? key

    Object.entries(variables).forEach(([variable, replacement]) => {
      value = value.replaceAll(
        `{${variable}}`,
        String(replacement),
      )
    })

    return value
  }
}