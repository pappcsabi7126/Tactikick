import { useEffect, useMemo, useState } from 'react'
import './club-page.css'

const DAYS = [
  { key: 'mon', label: 'Hétfő' },
  { key: 'tue', label: 'Kedd' },
  { key: 'wed', label: 'Szerda' },
  { key: 'thu', label: 'Csütörtök' },
  { key: 'fri', label: 'Péntek' },
  { key: 'sat', label: 'Szombat' },
  { key: 'sun', label: 'Vasárnap' },
]

const DEFAULT_PITCHES = [
  { id: 'pitch-1', name: 'Pálya 1', type: 'Füves pálya', zones: defaultZones() },
  { id: 'pitch-2', name: 'Pálya 2', type: 'Füves pálya', zones: defaultZones() },
  { id: 'artificial', name: 'Műfű', type: 'Műfüves pálya', zones: defaultZones() },
]

function defaultZones() {
  return [
    { id: 'z1', name: '1. rész · 1. térfél', short: '1' },
    { id: 'z2', name: '2. rész · 1. térfél', short: '2' },
    { id: 'z3', name: '3. rész · 2. térfél', short: '3' },
    { id: 'z4', name: '4. rész · 2. térfél', short: '4' },
  ]
}

function normalizePitch(pitch) {
  return {
    ...pitch,
    zones: Array.isArray(pitch?.zones) && pitch.zones.length
      ? pitch.zones
      : defaultZones(),
  }
}

function normalizeEvent(event) {
  const pitchIds = Array.isArray(event?.pitchIds)
    ? event.pitchIds
    : event?.pitchId ? [event.pitchId] : []
  const locations = Array.isArray(event?.locations)
    ? event.locations
    : pitchIds.map((pitchId) => ({
        pitchId,
        zoneIds: [],
      }))
  return {
    ...event,
    pitchIds,
    locations,
  }
}

const EVENT_TYPES = [
  { value: 'training', label: 'Edzés' },
  { value: 'match', label: 'Mérkőzés' },
  { value: 'goalkeeping', label: 'Kapusedzés' },
  { value: 'other', label: 'Egyéb' },
]

const ROLE_OPTIONS = [
  { value: 'coach', label: 'Edző' },
  { value: 'professional_manager', label: 'Szakmai vezető' },
]

function getWeekStart(source = new Date()) {
  const date = new Date(source)
  const day = (date.getDay() + 6) % 7
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - day)
  return date
}

function dateKey(date) {
  const local = new Date(date)
  return `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`
}

function formatDate(date) {
  return new Intl.DateTimeFormat('hu-HU', { month: 'short', day: '2-digit' }).format(date)
}

function makeWeekDays(weekStart) {
  return DAYS.map((day, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return { ...day, date, dateKey: dateKey(date) }
  })
}

function minutes(time) {
  const [hours, mins] = String(time || '00:00').split(':').map(Number)
  return (hours || 0) * 60 + (mins || 0)
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return minutes(aStart) < minutes(bEnd) && minutes(aEnd) > minutes(bStart)
}

function eventColor(kind) {
  if (kind === 'match') return 'club-event purple'
  if (kind === 'goalkeeping') return 'club-event red'
  if (kind === 'other') return 'club-event blue'
  return 'club-event green'
}

function pitchName(pitches, pitchId) {
  return pitches.find((pitch) => pitch.id === pitchId)?.name || 'Nincs helyszín'
}

function eventLocationLabel(event, pitches) {
  const locations = Array.isArray(event.locations) && event.locations.length
    ? event.locations
    : (event.pitchIds || []).map((pitchId) => ({ pitchId, zoneIds: [] }))

  if (!locations.length) return 'Nincs helyszín'

  return locations.map((location) => {
    const pitch = pitches.find((item) => item.id === location.pitchId)
    if (!pitch) return null
    const zones = (location.zoneIds || [])
      .map((zoneId) => pitch.zones?.find((zone) => zone.id === zoneId))
      .filter(Boolean)
    return locationDisplayLabel(location, pitches)
  }).filter(Boolean).join(' · ')
}

function zoneSummary(pitch, zoneIds = []) {
  const ids = new Set(zoneIds)
  if (!ids.size) return 'Teljes pálya'
  const hasFirstHalf = ids.has('z1') || ids.has('z2')
  const hasSecondHalf = ids.has('z3') || ids.has('z4')
  const firstComplete = ids.has('z1') && ids.has('z2')
  const secondComplete = ids.has('z3') && ids.has('z4')
  if (firstComplete && secondComplete) return 'Teljes pálya'
  if (firstComplete && !hasSecondHalf) return '1. térfél'
  if (secondComplete && !hasFirstHalf) return '2. térfél'
  const names = pitch?.zones
    ?.filter((zone) => ids.has(zone.id))
    ?.map((zone) => zone.short || zone.name) || []
  return names.join(' + ') || 'Teljes pálya'
}

function locationDisplayLabel(location, pitches) {
  const pitch = pitches.find((item) => item.id === location.pitchId)
  if (!pitch) return null
  return `${pitch.name} · ${zoneSummary(pitch, location.zoneIds || [])}`
}

function eventUsesSameArea(a, b) {
  const aLocations = a.locations?.length
    ? a.locations
    : (a.pitchIds || (a.pitchId ? [a.pitchId] : [])).map((pitchId) => ({ pitchId, zoneIds: [] }))
  const bLocations = b.locations?.length
    ? b.locations
    : (b.pitchIds || (b.pitchId ? [b.pitchId] : [])).map((pitchId) => ({ pitchId, zoneIds: [] }))

  return aLocations.some((aLoc) => bLocations.some((bLoc) => {
    if (aLoc.pitchId !== bLoc.pitchId) return false
    const az = aLoc.zoneIds || []
    const bz = bLoc.zoneIds || []
    // Empty zone selection means the whole pitch.
    return !az.length || !bz.length || az.some((zone) => bz.includes(zone))
  }))
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Local prototype persistence is best effort.
  }
}

function cleanClubName(value) {
  const cleaned = String(value || '')
    .replace(/[“”„"\\|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || 'TactiKick FC'
}

function isManagerRole(role) {
  const value = String(role || '').trim().toLowerCase()
  return [
    'professional_manager',
    'szakmai vezető',
    'szakmai vezeto',
    'admin',
    'administrator',
    'club manager',
    'head coach',
  ].includes(value)
}

function normalizeMemberRole(role) {
  return isManagerRole(role) ? 'professional_manager' : 'coach'
}

function buildTrainingEvents(trainings, teams) {
  return (trainings || [])
    .filter((training) => training.date)
    .slice(0, 80)
    .map((training, index) => {
      const team = teams.find((item) => item.id === training.teamId)
      const pitch = DEFAULT_PITCHES[index % DEFAULT_PITCHES.length]
      return {
        id: `training-${training.id}`,
        date: training.date,
        pitchId: pitch.id,
        pitchIds: [pitch.id],
        locations: [{ pitchId: pitch.id, zoneIds: [] }],
        start: training.startTime || '17:00',
        end: training.endTime || '18:30',
        title: training.title || 'Edzés',
        team: team?.name || 'Csapat',
        teamId: training.teamId,
        coach: 'Saját edző',
        kind: 'training',
        notes: '',
        sourceTrainingId: training.id,
      }
    })
}

export default function ClubPage({ teams = [], trainings = [], profile, onNavigate }) {
  const storageKey = `tactikick-club-v2-${profile?.email || 'local'}`
  const [clubName, setClubName] = useState(() =>
    cleanClubName(readStorage(`${storageKey}-name`, profile?.club || 'TactiKick FC')),
  )
  const [clubLogo, setClubLogo] = useState(() =>
    readStorage(`${storageKey}-logo`, ''),
  )
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState('')
  const [weekStart, setWeekStart] = useState(getWeekStart)
  const [selectedPitch, setSelectedPitch] = useState('all')
  const [pitches, setPitches] = useState(() => {
    const stored = readStorage(`${storageKey}-pitches`, DEFAULT_PITCHES)
    const source = Array.isArray(stored) && stored.length ? stored : DEFAULT_PITCHES
    return source.map(normalizePitch)
  })
  const [localEvents, setLocalEvents] = useState(() =>
    readStorage(`${storageKey}-events`, null),
  )
  const [members, setMembers] = useState(() =>
    readStorage(`${storageKey}-members`, null),
  )
  const [invites, setInvites] = useState(() =>
    readStorage(`${storageKey}-invites`, []),
  )
  const [modal, setModal] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [detailEvent, setDetailEvent] = useState(null)
  const [editingPitch, setEditingPitch] = useState(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'success') {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 2600)
  }

  const isClubManager = isManagerRole(profile?.role)

  useEffect(() => {
    if (members) return
    if (!profile?.email) return

    setMembers([{
      id: 'owner',
      name: profile.name || profile.email,
      email: profile.email,
      role: normalizeMemberRole(profile.role),
      status: 'active',
    }])
  }, [members, profile])

  useEffect(() => {
    if (!members || !profile?.email) return
    setMembers((current) => current.map((member) => {
      if (member.email !== profile.email) return { ...member, role: normalizeMemberRole(member.role) }
      return {
        ...member,
        name: member.name || profile.name || member.email,
        role: normalizeMemberRole(profile.role),
      }
    }))
  }, [profile?.email, profile?.name, profile?.role])

  const derivedEvents = useMemo(
    () => buildTrainingEvents(trainings, teams),
    [trainings, teams],
  )

  const baseEvents = localEvents ?? derivedEvents

  const events = useMemo(
    () => (baseEvents || []).map((event) => normalizeEvent({
      ...event,
      date: event.date || dateKey(new Date()),
    })),
    [baseEvents],
  )

  const weekDays = useMemo(() => makeWeekDays(weekStart), [weekStart])
  const weekDateSet = useMemo(
    () => new Set(weekDays.map((day) => day.dateKey)),
    [weekDays],
  )
  const weekEvents = useMemo(
    () => events.filter((event) => weekDateSet.has(event.date)),
    [events, weekDateSet],
  )
  const visibleEvents = selectedPitch === 'all'
    ? weekEvents
    : weekEvents.filter((event) =>
        (event.pitchIds || [event.pitchId]).includes(selectedPitch),
      )

  const upcoming = [...visibleEvents]
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
    .slice(0, 6)

  const weekLabel = `${formatDate(weekStart)} – ${formatDate(
    new Date(weekStart.getTime() + 6 * 86400000),
  )}`

  useEffect(() => writeStorage(`${storageKey}-name`, cleanClubName(clubName)), [storageKey, clubName])
  useEffect(() => writeStorage(`${storageKey}-logo`, clubLogo || ''), [storageKey, clubLogo])
  useEffect(() => writeStorage(`${storageKey}-pitches`, pitches), [storageKey, pitches])
  useEffect(() => {
    if (localEvents !== null) writeStorage(`${storageKey}-events`, localEvents)
  }, [storageKey, localEvents])
  useEffect(() => {
    if (members) writeStorage(`${storageKey}-members`, members)
  }, [storageKey, members])
  useEffect(() => writeStorage(`${storageKey}-invites`, invites), [storageKey, invites])

  useEffect(() => {
    if (!isClubManager && ['event', 'pitches', 'people', 'settings'].includes(modal)) {
      setModal(null)
      setEditingEvent(null)
      setEditingPitch(null)
      setDetailEvent(null)
    }
  }, [isClubManager, modal])

  function moveWeek(amount) {
    setWeekStart((current) => {
      const next = new Date(current)
      next.setDate(current.getDate() + amount * 7)
      return next
    })
  }

  function resetWeek() {
    setWeekStart(getWeekStart())
  }

  function copyPreviousWeek() {
    if (!isClubManager) return
    const previousStart = new Date(weekStart)
    previousStart.setDate(previousStart.getDate() - 7)
    const previousKeys = new Set(makeWeekDays(previousStart).map((day) => day.dateKey))
    const sourceEvents = events.filter((event) => previousKeys.has(event.date))

    if (!sourceEvents.length) {
      showToast('Az előző héten nincs másolható esemény.', 'info')
      return
    }

    const existing = [...events]
    let copiedCount = 0
    let skippedCount = 0

    sourceEvents.forEach((event, index) => {
      const sourceDate = new Date(`${event.date}T12:00:00`)
      const targetDate = new Date(sourceDate)
      targetDate.setDate(targetDate.getDate() + 7)
      const nextDate = dateKey(targetDate)

      const alreadyThere = existing.some((item) =>
        item.date === nextDate &&
        item.start === event.start &&
        item.end === event.end &&
        item.team === event.team &&
        eventUsesSameArea(item, { ...event, date: nextDate }),
      )

      if (alreadyThere) {
        skippedCount += 1
        return
      }

      existing.push({
        ...event,
        id: `local-event-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
        date: nextDate,
      })
      copiedCount += 1
    })

    saveEvents(existing)
    if (copiedCount && skippedCount) {
      showToast(`${copiedCount} esemény átmásolva · ${skippedCount} már szerepelt, ezért kihagytuk.`, 'success')
    } else if (copiedCount) {
      showToast(`${copiedCount} esemény átmásolva erre a hétre.`, 'success')
    } else {
      showToast('A hét már tartalmazza az előző hét eseményeit.', 'info')
    }
  }

  function openEvent(event = null) {
    if (!event) return
    setDetailEvent(event)
    setModal('details')
  }

  function openEventEditor(event = null) {
    if (!isClubManager) return
    setDetailEvent(null)
    setEditingEvent(event)
    setModal('event')
  }

  function saveEvents(nextEvents) {
    setLocalEvents(nextEvents)
  }

  function submitEvent(formEvent) {
    formEvent.preventDefault()
    if (!isClubManager) return

    const form = new FormData(formEvent.currentTarget)
    const id = editingEvent?.id || `local-event-${Date.now()}`
    const selectedPitchIds = form.getAll('pitchIds')
    const locations = selectedPitchIds.map((pitchId) => ({
      pitchId: String(pitchId),
      zoneIds: form.getAll(`zones-${pitchId}`).map(String),
    }))

    if (!locations.length) {
      showToast('Válassz legalább egy helyszínt vagy pályarészt.', 'error')
      return
    }

    const next = {
      id,
      date: String(form.get('date')),
      pitchId: locations[0].pitchId,
      pitchIds: locations.map((location) => location.pitchId),
      locations,
      start: String(form.get('start')),
      end: String(form.get('end')),
      title: String(form.get('title')).trim(),
      team: String(form.get('team')).trim(),
      coach: String(form.get('coach')).trim() || profile?.name || 'Edző',
      kind: String(form.get('kind')),
      notes: String(form.get('notes') || '').trim(),
      goal: String(form.get('goal') || '').trim(),
    }

    if (minutes(next.start) >= minutes(next.end)) {
      showToast('A befejezésnek később kell lennie, mint a kezdésnek.', 'error')
      return
    }

    const conflict = events.find(
      (item) =>
        item.id !== id &&
        item.date === next.date &&
        overlaps(item.start, item.end, next.start, next.end) &&
        eventUsesSameArea(item, next),
    )

    if (conflict) {
      showToast(
        `Ütközés: ${eventLocationLabel(conflict, pitches)} már foglalt ${conflict.start}–${conflict.end} között.`,
        'error',
      )
      return
    }

    const nextEvents = editingEvent
      ? events.map((item) => (item.id === id ? next : item))
      : [...events, next]

    saveEvents(nextEvents)
    setEditingEvent(null)
    setModal(null)
  }

  function deleteEvent(eventId) {
    if (!isClubManager) return

    const event = events.find((item) => item.id === eventId)
    if (!event) return

    if (!window.confirm(`Biztosan törlöd ezt az eseményt?\n\n${event.title} · ${event.start}–${event.end}`)) {
      return
    }

    saveEvents(events.filter((item) => item.id !== eventId))
    setModal(null)
    setEditingEvent(null)
    setDetailEvent(null)
  }

  function submitPitch(formEvent) {
    formEvent.preventDefault()
    if (!isClubManager) return

    const form = new FormData(formEvent.currentTarget)
    const name = String(form.get('name') || '').trim()
    const type = String(form.get('type') || '').trim() || 'Pálya'

    if (!name) return

    if (editingPitch) {
      setPitches((current) =>
        current.map((pitch) =>
          pitch.id === editingPitch.id ? { ...pitch, name, type } : pitch,
        ),
      )
    } else {
      setPitches((current) => [
        ...current,
        { id: `pitch-${Date.now()}`, name, type, zones: defaultZones() },
      ])
    }

    setEditingPitch(null)
  }

  function deletePitch(pitchId) {
    if (!isClubManager) return

    const pitch = pitches.find((item) => item.id === pitchId)
    if (!pitch) return

    const usedCount = events.filter((event) =>
      (event.locations || [{ pitchId: event.pitchId }]).some((location) => location.pitchId === pitchId),
    ).length

    if (usedCount) {
      showToast(
        `${pitch.name} nem törölhető, mert ${usedCount} esemény használja. Előbb helyezd át ezeket az eseményeket.`,
        'error',
      )
      return
    }

    if (!window.confirm(`Törlöd a(z) „${pitch.name}” helyszínt?`)) return

    setPitches((current) => current.filter((item) => item.id !== pitchId))
    if (selectedPitch === pitchId) setSelectedPitch('all')
  }

  function invitePerson(formEvent) {
    formEvent.preventDefault()
    if (!isClubManager) return

    const form = new FormData(formEvent.currentTarget)
    const email = String(form.get('email') || '').trim().toLowerCase()
    const role = normalizeMemberRole(form.get('role'))
    const name = String(form.get('name') || '').trim()

    if (!email) return

    if (
      members?.some((member) => member.email === email) ||
      invites.some((invite) => invite.email === email)
    ) {
      showToast('Ehhez az email-címhez már van klubtagság vagy függő meghívó.', 'error')
      return
    }

    const invite = {
      id: `invite-${Date.now()}`,
      email,
      name,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    setInvites((current) => [invite, ...current])

    const roleLabel = ROLE_OPTIONS.find((item) => item.value === role)?.label || 'Edző'
    const joinLink = `${window.location.origin}/join/${encodeURIComponent(
      cleanClubName(clubName).toLowerCase().replace(/[^a-z0-9]+/gi, '-'),
    )}`
    const subject = encodeURIComponent(`${cleanClubName(clubName)} – meghívás a TactiKick klubba`)
    const body = encodeURIComponent(
      `Szia${name ? ` ${name}` : ''}!\n\nMeghívlak a(z) ${cleanClubName(
        clubName,
      )} klubba a TactiKick rendszerben ${roleLabel} szerepkörrel.\n\nMeghívólink: ${joinLink}\n\nA link megnyitása után regisztrálhatsz vagy beléphetsz a klubhoz.`,
    )

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    setModal('people')
    formEvent.currentTarget.reset()
  }

  function resendInvite(invite) {
    if (!isClubManager) return

    const roleLabel = ROLE_OPTIONS.find((item) => item.value === invite.role)?.label || 'Edző'
    const joinLink = `${window.location.origin}/join/${encodeURIComponent(
      cleanClubName(clubName).toLowerCase().replace(/[^a-z0-9]+/gi, '-'),
    )}`
    const subject = encodeURIComponent(`${cleanClubName(clubName)} – TactiKick meghívó`)
    const body = encodeURIComponent(
      `Szia${invite.name ? ` ${invite.name}` : ''}!\n\nMeghívlak a(z) ${cleanClubName(
        clubName,
      )} klubba ${roleLabel} szerepkörrel.\n\nMeghívólink: ${joinLink}`,
    )

    window.location.href = `mailto:${invite.email}?subject=${subject}&body=${body}`
  }

  async function copyEmailSummary() {
    const lines = [`${cleanClubName(clubName)} – Heti program`, weekLabel, '']

    weekDays.forEach((day) => {
      lines.push(
        `${day.label} · ${day.date.toLocaleDateString('hu-HU', {
          month: 'short',
          day: '2-digit',
        })}`,
      )

      const dayEvents = visibleEvents.filter((event) => event.date === day.dateKey)

      if (!dayEvents.length) {
        lines.push('• Nincs tervezett program')
      }

      dayEvents.forEach((event) => {
        lines.push(
          `• ${event.start}–${event.end} · ${event.title} · ${pitchName(
            pitches,
            event.pitchId,
          )} · ${event.coach}`,
        )
      })

      lines.push('')
    })

    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      showToast('A heti program nem került a vágólapra. Ellenőrizd a böngésző engedélyeit.', 'error')
    }
  }

  function handleLogoUpload(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setLogoError('Csak képfájlt tölthetsz fel.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoError('A kép legfeljebb 5 MB lehet.')
      return
    }

    setLogoError('')
    setLogoUploading(true)

    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        try {
          const maxSize = 512
          const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
          const width = Math.max(1, Math.round(image.width * scale))
          const height = Math.max(1, Math.round(image.height * scale))
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const context = canvas.getContext('2d')
          if (!context) throw new Error('A kép feldolgozása nem sikerült.')
          context.clearRect(0, 0, width, height)
          context.drawImage(image, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/webp', 0.88)
          if (!dataUrl || dataUrl.length > 900000) {
            throw new Error('A kép túl nagy a böngésző helyi tárhelyéhez.')
          }
          setClubLogo(dataUrl)
        } catch (error) {
          setLogoError(error.message || 'A címer feldolgozása nem sikerült.')
        } finally {
          setLogoUploading(false)
        }
      }
      image.onerror = () => {
        setLogoError('A képet nem sikerült beolvasni.')
        setLogoUploading(false)
      }
      image.src = String(reader.result)
    }
    reader.onerror = () => {
      setLogoError('A kép feltöltése nem sikerült.')
      setLogoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  function removeClubLogo() {
    setLogoError('')
    setClubLogo('')
  }

  function saveClubSettings(formEvent) {
    formEvent.preventDefault()
    if (!isClubManager) return

    const form = new FormData(formEvent.currentTarget)
    setClubName(cleanClubName(form.get('clubName')))
    setModal(null)
  }

  function resetLocalDemo() {
    if (!isClubManager) return
    if (!window.confirm('A klub helyi prototípus adatait visszaállítod?')) return

    localStorage.removeItem(`${storageKey}-events`)
    localStorage.removeItem(`${storageKey}-pitches`)
    localStorage.removeItem(`${storageKey}-members`)
    localStorage.removeItem(`${storageKey}-invites`)

    setLocalEvents(null)
    setClubLogo('')
    setPitches(DEFAULT_PITCHES.map(normalizePitch))
    setMembers(profile?.email ? [{
      id: 'owner',
      name: profile.name || profile.email,
      email: profile.email,
      role: normalizeMemberRole(profile.role),
      status: 'active',
    }] : [])
    setInvites([])
    setEditingEvent(null)
    setEditingPitch(null)
    setModal(null)
  }

  const eventFormDate = editingEvent?.date || weekDays[0]?.dateKey
  const memberList = members || []

  return (
    <div className="page club-page">
      <div className="hero-header club-hero">
        <div>
          <div className="eyebrow">KLUB</div>

          <div className="club-title-row">
            <div className={`club-logo-mark${clubLogo ? ' has-image' : ''}`} aria-label="Klubjelvény">
              {clubLogo ? (
                <img src={clubLogo} alt="" />
              ) : (
                <span className="club-ball-silhouette" aria-hidden="true" />
              )}
            </div>

            <div>
              <h1>{cleanClubName(clubName)}</h1>
              <span className="club-role-pill">
                {isClubManager ? 'Szakmai vezető' : 'Edző'}
              </span>
            </div>
          </div>

          <p>
            A klub heti programja, pályabeosztása, csapatai és edzői egy helyen.
          </p>
        </div>

        <div className="club-header-actions">
          <button
            className="secondary-button club-action-button"
            type="button"
            onClick={() => setModal('email')}
          >
            <span className="club-action-icon" aria-hidden="true">▤</span>
            Heti program
          </button>

          {isClubManager && (
            <>
              <button
                className="secondary-button club-action-button"
                type="button"
                onClick={() => setModal('pitches')}
              >
                <span className="club-action-icon" aria-hidden="true">□</span>
                Pályák
              </button>

              <button
                className="secondary-button club-action-button"
                type="button"
                onClick={() => setModal('people')}
              >
                <span className="club-action-icon" aria-hidden="true">♙</span>
                Emberek
              </button>

              <button
                className="neon-button club-action-button club-primary-action"
                type="button"
                onClick={() => openEventEditor()}
              >
                <span aria-hidden="true">+</span>
                Új esemény
              </button>
            </>
          )}
        </div>
      </div>

      <div className="club-main-grid">
        <section className="club-calendar-card">
          <div className="club-card-heading">
            <div>
              <div className="card-label">KLUBNAPTÁR</div>
              <h2>Heti program · {weekLabel}</h2>
            </div>

            <div className="club-week-controls">
              {isClubManager && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={copyPreviousWeek}
                  title="Az előző heti program átmásolása erre a hétre"
                >
                  ⧉ Előző hét másolása
                </button>
              )}
              <button type="button" className="calendar-nav-button" onClick={() => moveWeek(-1)} aria-label="Előző hét">‹</button>
              <button type="button" className="secondary-button" onClick={resetWeek}>Ma</button>
              <button type="button" className="calendar-nav-button" onClick={() => moveWeek(1)} aria-label="Következő hét">›</button>
            </div>
          </div>

          <div className="club-filter-row">
            <button
              type="button"
              className={selectedPitch === 'all' ? 'club-filter active' : 'club-filter'}
              onClick={() => setSelectedPitch('all')}
            >
              Minden helyszín
            </button>

            {pitches.map((pitch) => (
              <button
                type="button"
                key={pitch.id}
                className={selectedPitch === pitch.id ? 'club-filter active' : 'club-filter'}
                onClick={() => setSelectedPitch(pitch.id)}
              >
                {pitch.name}
              </button>
            ))}

          </div>

          <div className="club-calendar-scroll">
            <div className="club-calendar-grid">
              <div className="club-time-column">
                <div className="club-grid-corner">IDŐ</div>
                {Array.from({ length: 15 }, (_, index) => index + 8).map((hour) => (
                  <div key={hour}>{String(hour).padStart(2, '0')}:00</div>
                ))}
              </div>

              {weekDays.map((day) => (
                <div className="club-day-column" key={day.dateKey}>
                  <div className="club-day-header">
                    <strong>{day.label}</strong>
                    <span>
                      {day.date.toLocaleDateString('hu-HU', {
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="club-day-body">
                    {Array.from({ length: 15 }, (_, index) => index + 8).map((hour) => (
                      <div className="club-hour-line" key={hour} />
                    ))}

                    {(() => {
                      const dayEvents = visibleEvents.filter((event) => event.date === day.dateKey)
                      const laneIds = [...new Set(dayEvents.flatMap((event) => event.pitchIds || [event.pitchId]).filter(Boolean))]
                      const laneCount = Math.max(laneIds.length, 1)

                      return dayEvents.map((event) => {
                        const top = Math.max(
                          0,
                          ((minutes(event.start) - 8 * 60) / (14 * 60)) * 100,
                        )
                        const height = Math.max(
                          7,
                          ((minutes(event.end) - minutes(event.start)) / (14 * 60)) * 100,
                        )
                        const eventPitchIds = event.pitchIds || [event.pitchId]
                        const indices = eventPitchIds
                          .map((pitchId) => laneIds.indexOf(pitchId))
                          .filter((index) => index >= 0)
                        const lane = indices.length ? Math.min(...indices) : 0
                        const lastLane = indices.length ? Math.max(...indices) : lane
                        const width = ((lastLane - lane + 1) / laneCount) * 100

                        return (
                          <button
                            type="button"
                            key={event.id}
                            disabled={!isClubManager}
                            className={`${eventColor(event.kind)} ${!isClubManager ? 'club-event-readonly' : ''}`}
                            style={{
                              top: `${Math.min(93, top)}%`,
                              height: `${Math.min(42, height)}%`,
                              left: `calc(${lane * width}% + 4px)`,
                              width: `calc(${width}% - 8px)`,
                            }}
                            onClick={() => openEvent(event)}
                            title={isClubManager ? 'Esemény szerkesztése' : 'Csak megtekintés'}
                          >
                            <strong>{event.team || event.title}</strong>
                            <span>{event.start}–{event.end}</span>
                            <small>{eventLocationLabel(event, pitches)}</small>
                          </button>
                        )
                      })
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="club-calendar-hint">
            {isClubManager
              ? 'Kattints egy eseményre a szerkesztéshez vagy törléshez.'
              : 'Megtekintési mód: a klubprogramot csak a szakmai vezető módosíthatja.'}
          </div>
        </section>

        <aside className="club-sidebar-stack">
          <section className="club-side-card">
            <div className="card-label">KÖVETKEZŐ ESEMÉNYEK</div>
            <h3>Gyors áttekintés</h3>

            <div className="club-upcoming-list">
              {upcoming.map((event) => (
                <button
                  type="button"
                  className="club-upcoming-item"
                  key={event.id}
                  disabled={!isClubManager}
                  onClick={() => openEvent(event)}
                >
                  <span className="club-upcoming-dot" />
                  <span>
                    <strong>{event.start} · {event.title}</strong>
                    <small>{pitchName(pitches, event.pitchId)} · {event.coach}</small>
                  </span>
                  {isClubManager && <b>→</b>}
                </button>
              ))}

              {!upcoming.length && (
                <div className="club-empty-small">Nincs esemény ezen a héten.</div>
              )}
            </div>
          </section>

          <section className="club-side-card">
            <div className="card-label">KLUBTAGOK</div>
            <h3>Edzők és szakmai vezetők</h3>

            <div className="club-role-list">
              {memberList.slice(0, 6).map((member) => (
                <div key={member.id}>
                  <span>{normalizeMemberRole(member.role) === 'professional_manager' ? '◆' : '●'}</span>
                  <div>
                    <strong>{member.name || member.email}</strong>
                    <small>
                      {ROLE_OPTIONS.find((role) => role.value === normalizeMemberRole(member.role))?.label || 'Edző'}
                    </small>
                  </div>
                </div>
              ))}

              {invites.slice(0, 2).map((invite) => (
                <div key={invite.id} className="club-invite-row">
                  <span>✉</span>
                  <div>
                    <strong>{invite.name || invite.email}</strong>
                    <small>Meghívó · függőben</small>
                  </div>
                </div>
              ))}
            </div>

            {isClubManager && (
              <button
                type="button"
                className="club-full-width-action"
                onClick={() => setModal('people')}
              >
                Emberek kezelése →
              </button>
            )}
          </section>

          {isClubManager && (
            <section className="club-side-card">
              <div className="card-label">KLUB KEZELÉSE</div>

              <div className="club-quick-actions">
                <button type="button" onClick={() => setModal('pitches')}>
                  ＋ Pályák kezelése
                </button>
                <button type="button" onClick={() => setModal('people')}>
                  ＋ Ember meghívása
                </button>
                <button type="button" onClick={() => setModal('settings')}>
                  ⚙ Klub beállításai
                </button>
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="club-mobile-preview">
        <div className="club-card-heading">
          <div>
            <div className="card-label">MOBIL NÉZET</div>
            <h2>Edzői gyorsnézet</h2>
          </div>
          <button
            className="secondary-button"
            type="button"
            onClick={() => onNavigate?.('calendar')}
          >
            Saját naptár →
          </button>
        </div>

        <div className="club-mobile-cards">
          {weekDays.slice(0, 4).map((day) => {
            const dayEvents = visibleEvents.filter((event) => event.date === day.dateKey)

            return (
              <div className="club-mobile-day" key={day.dateKey}>
                <div>
                  <strong>{day.label}</strong>
                  <span>
                    {day.date.toLocaleDateString('hu-HU', {
                      month: 'short',
                      day: '2-digit',
                    })}
                  </span>
                </div>

                {dayEvents.slice(0, 4).map((event) => (
                  <button
                    type="button"
                    className="club-mobile-event"
                    disabled={!isClubManager}
                    key={event.id}
                    onClick={() => openEvent(event)}
                  >
                    <strong>{event.start} · {event.title}</strong>
                    <span>{pitchName(pitches, event.pitchId)}</span>
                  </button>
                ))}

                {!dayEvents.length && <span className="club-muted">Nincs program</span>}
              </div>
            )
          })}
        </div>
      </section>

      {toast && (
        <div className={`club-toast club-toast-${toast.type}`} role="status" aria-live="polite">
          <span className="club-toast-icon" aria-hidden="true">
            {toast.type === 'error' ? '!' : toast.type === 'info' ? 'i' : '✓'}
          </span>
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Bezárás">×</button>
        </div>
      )}

      {isClubManager && modal === 'settings' && (
        <div className="player-modal-backdrop" onClick={() => setModal(null)}>
          <form
            className="player-modal club-event-modal"
            onSubmit={saveClubSettings}
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="player-modal-close" onClick={() => setModal(null)}>×</button>
            <div className="player-modal-eyebrow">KLUB BEÁLLÍTÁSOK</div>
            <h2>{cleanClubName(clubName)} beállításai</h2>
            <p className="player-modal-position">
              A klub neve és jelvénye ehhez a klubhoz tartozik. A jelvény PNG, JPG vagy WebP képből tölthető fel.
            </p>

            <div className="form-group">
              <label>KLUB NEVE</label>
              <input name="clubName" defaultValue={cleanClubName(clubName)} autoFocus required />
            </div>

            <div className="club-logo-settings">
              <div className="club-logo-settings-preview">
                {clubLogo ? (
                  <img src={clubLogo} alt="Klubjelvény előnézete" />
                ) : (
                  <span className="club-ball-silhouette" aria-hidden="true" />
                )}
              </div>

              <div className="club-logo-settings-copy">
                <strong>Klubjelvény</strong>
                <span>A fejlécben és a klub nézetben ez a kép jelenik meg.</span>

                <div className="club-logo-settings-actions">
                  <label className="secondary-button club-file-button">
                    {logoUploading ? 'Feldolgozás…' : 'Kép kiválasztása'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      disabled={logoUploading}
                    />
                  </label>

                  {clubLogo && (
                    <button type="button" className="danger-button small" onClick={removeClubLogo}>
                      Címer törlése
                    </button>
                  )}
                </div>

                {logoError && <span className="club-logo-error">{logoError}</span>}
              </div>
            </div>

            <div className="player-form-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Mégse
              </button>
              <button type="button" className="secondary-button" onClick={resetLocalDemo}>
                Helyi adatok reset
              </button>
              <button type="submit" className="neon-button">Mentés</button>
            </div>
          </form>
        </div>
      )}

      {modal === 'details' && detailEvent && (
        <div
          className="player-modal-backdrop"
          onClick={() => { setModal(null); setDetailEvent(null) }}
        >
          <div className="player-modal club-event-details-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="player-modal-close"
              onClick={() => { setModal(null); setDetailEvent(null) }}
            >×</button>

            <div className="player-modal-eyebrow">EDZÉS RÉSZLETEI</div>
            <div className="club-detail-header">
              <div>
                <h2>{detailEvent.title || detailEvent.team || 'Edzés'}</h2>
                <p>{detailEvent.date} · {detailEvent.start}–{detailEvent.end}</p>
              </div>
              <span className={eventColor(detailEvent.kind)}>{EVENT_TYPES.find((type) => type.value === detailEvent.kind)?.label || 'Edzés'}</span>
            </div>

            <div className="club-detail-meta">
              <div><small>CSAPAT</small><strong>{detailEvent.team || '—'}</strong></div>
              <div><small>EDZŐ</small><strong>{detailEvent.coach || '—'}</strong></div>
              <div><small>HELYSZÍN</small><strong>{eventLocationLabel(detailEvent, pitches)}</strong></div>
            </div>

            <div className="club-pitch-visual-wrap">
              <div className="club-detail-section-title">Kijelölt pályaterület</div>
              <div className="club-pitch-visual-stack">
                {(detailEvent.locations || [{ pitchId: detailEvent.pitchId, zoneIds: [] }]).map((location) => {
                  const pitch = pitches.find((item) => item.id === location.pitchId)
                  if (!pitch) return null
                  const selectedZones = location.zoneIds?.length ? location.zoneIds : pitch.zones.map((zone) => zone.id)
                  return (
                    <div className="club-pitch-visual-card" key={location.pitchId}>
                      <strong>{pitch.name}</strong>
                      <small>{zoneSummary(pitch, location.zoneIds || [])}</small>
                      <div className="club-pitch-visual">
                        <div className="club-pitch-lines" />
                        {selectedZones.map((zoneId) => {
                          const index = pitch.zones.findIndex((zone) => zone.id === zoneId)
                          if (index < 0) return null
                          return (
                            <div
                              key={`${location.pitchId}-${zoneId}`}
                              className={`club-pitch-zone zone-${index + 1}`}
                              title={`${pitch.name} · ${pitch.zones[index].name}`}
                            >
                              {pitch.zones[index].short || index + 1}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {detailEvent.goal && (
              <div className="club-detail-info">
                <small>EDZÉS CÉLJA</small>
                <p>{detailEvent.goal}</p>
              </div>
            )}

            {detailEvent.notes && (
              <div className="club-detail-info">
                <small>MEGJEGYZÉS</small>
                <p>{detailEvent.notes}</p>
              </div>
            )}

            <div className="player-form-actions">
              {isClubManager && (
                <button
                  type="button"
                  className="neon-button"
                  onClick={() => openEventEditor(detailEvent)}
                >
                  ✎ Edzés szerkesztése
                </button>
              )}
              {isClubManager && (
                <button type="button" className="danger-button" onClick={() => deleteEvent(detailEvent.id)}>
                  Törlés
                </button>
              )}
              <span className="form-actions-spacer" />
              <button type="button" className="secondary-button" onClick={() => { setModal(null); setDetailEvent(null) }}>
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}

      {isClubManager && modal === 'event' && (
        <div
          className="player-modal-backdrop"
          onClick={() => {
            setModal(null)
            setEditingEvent(null)
          }}
        >
          <form
            className="player-modal club-event-modal"
            onSubmit={submitEvent}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="player-modal-close"
              onClick={() => {
                setModal(null)
                setEditingEvent(null)
              }}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">KLUBNAPTÁR</div>
            <h2>{editingEvent ? 'Esemény szerkesztése' : 'Új esemény'}</h2>
            <p className="player-modal-position">
              Az esemény a klub minden edzője számára megjelenik.
            </p>

            <div className="player-form">
              <div className="form-group">
                <label>ESEMÉNY NEVE</label>
                <input
                  name="title"
                  defaultValue={editingEvent?.title || ''}
                  placeholder="Pl. U13 edzés"
                  required
                />
              </div>

              <div className="player-form-row">
                <div className="form-group">
                  <label>DÁTUM</label>
                  <input name="date" type="date" defaultValue={eventFormDate} required />
                </div>

                <div className="form-group">
                  <label>TÍPUS</label>
                  <select name="kind" defaultValue={editingEvent?.kind || 'training'}>
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="player-form-row">
                <div className="form-group">
                  <label>CSAPAT</label>
                  <input
                    name="team"
                    defaultValue={editingEvent?.team || teams[0]?.name || ''}
                    placeholder="U13"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>EDZŐ</label>
                  <input
                    name="coach"
                    defaultValue={editingEvent?.coach || profile?.name || ''}
                    placeholder="Edző neve"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>PÁLYA ÉS PÁLYARÉSZEK</label>
                <div className="club-location-picker">
                  {pitches.map((pitch) => {
                    const existing = (editingEvent?.locations || []).find((location) => location.pitchId === pitch.id)
                    return (
                      <div className="club-location-group" key={pitch.id}>
                        <label className="club-location-main">
                          <input
                            type="checkbox"
                            name="pitchIds"
                            value={pitch.id}
                            defaultChecked={Boolean(existing)}
                          />
                          <span>
                            <strong>{pitch.name}</strong>
                            <small>{pitch.type}</small>
                          </span>
                        </label>
                        <div className="club-zone-picker">
                          <div className="club-zone-half">
                            <div className="club-zone-half-label">
                              <strong>1. térfél</strong>
                              <span>1 + 2</span>
                            </div>
                            <div className="club-zone-half-options">
                              {pitch.zones.slice(0, 2).map((zone) => (
                                <label key={zone.id} className="club-zone-check">
                                  <input
                                    type="checkbox"
                                    name={`zones-${pitch.id}`}
                                    value={zone.id}
                                    defaultChecked={Boolean(existing?.zoneIds?.includes(zone.id))}
                                  />
                                  <span>{zone.short || zone.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="club-zone-half">
                            <div className="club-zone-half-label">
                              <strong>2. térfél</strong>
                              <span>3 + 4</span>
                            </div>
                            <div className="club-zone-half-options">
                              {pitch.zones.slice(2, 4).map((zone) => (
                                <label key={zone.id} className="club-zone-check">
                                  <input
                                    type="checkbox"
                                    name={`zones-${pitch.id}`}
                                    value={zone.id}
                                    defaultChecked={Boolean(existing?.zoneIds?.includes(zone.id))}
                                  />
                                  <span>{zone.short || zone.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <small className="club-form-help">Egy pályán belül az 1 + 2 együtt az első térfél, a 3 + 4 együtt a második térfél. Több pályát is kijelölhetsz; ha egy pályán nem választasz részt, az egész pálya foglaltnak számít.</small>
              </div>

              <div className="player-form-row">
                <div className="form-group">
                  <label>KEZDÉS</label>
                  <input name="start" type="time" defaultValue={editingEvent?.start || '17:00'} required />
                </div>

                <div className="form-group">
                  <label>VÉGE</label>
                  <input name="end" type="time" defaultValue={editingEvent?.end || '18:30'} required />
                </div>
              </div>

              <div className="form-group">
                <label>EDZÉS CÉLJA</label>
                <input
                  name="goal"
                  defaultValue={editingEvent?.goal || ''}
                  placeholder="Pl. labdakihozatal, letámadás, befejezés..."
                />
              </div>

              <div className="form-group">
                <label>MEGJEGYZÉS</label>
                <textarea
                  name="notes"
                  defaultValue={editingEvent?.notes || ''}
                  placeholder="Opcionális információ az edzőknek..."
                  rows="3"
                />
              </div>
            </div>

            <div className="player-form-actions">
              {editingEvent && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => deleteEvent(editingEvent.id)}
                >
                  Törlés
                </button>
              )}

              <span className="form-actions-spacer" />

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setModal(null)
                  setEditingEvent(null)
                }}
              >
                Mégse
              </button>

              <button type="submit" className="neon-button">
                {editingEvent ? 'Változások mentése' : 'Esemény mentése'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isClubManager && modal === 'pitches' && (
        <div className="player-modal-backdrop" onClick={() => { setModal(null); setEditingPitch(null) }}>
          <div
            className="player-modal club-event-modal club-management-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="player-modal-close"
              onClick={() => { setModal(null); setEditingPitch(null) }}
            >
              ×
            </button>

            <div className="player-modal-eyebrow">HELYSZÍNEK</div>
            <h2>Pályák és helyszínek</h2>
            <p className="player-modal-position">
              Adj hozzá saját pályákat, termeket vagy bármilyen klubhelyszínt. Minden helyszín szerkeszthető és törölhető, ha nincs hozzárendelt eseménye.
            </p>

            <div className="club-management-list">
              {pitches.map((pitch) => (
                <div className="club-management-row" key={pitch.id}>
                  <div>
                    <strong>{pitch.name}</strong>
                    <span>
                      {pitch.type} · {events.filter((event) => event.pitchId === pitch.id).length} esemény
                    </span>
                  </div>

                  <div className="club-row-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setEditingPitch(pitch)}
                    >
                      Szerkesztés
                    </button>
                    <button
                      type="button"
                      className="danger-button small"
                      onClick={() => deletePitch(pitch.id)}
                    >
                      Törlés
                    </button>
                  </div>
                </div>
              ))}

              {!pitches.length && (
                <div className="club-empty-small">Még nincs hozzáadott helyszín.</div>
              )}
            </div>

            <form className="club-inline-form" onSubmit={submitPitch}>
              <div className="form-group">
                <label>{editingPitch ? 'HELYSZÍN SZERKESZTÉSE' : 'ÚJ HELYSZÍN'}</label>
                <input
                  name="name"
                  defaultValue={editingPitch?.name || ''}
                  placeholder="Pl. Műfüves pálya 2"
                  required
                  key={editingPitch?.id || 'new'}
                />
              </div>

              <div className="form-group">
                <label>TÍPUS</label>
                <input
                  name="type"
                  defaultValue={editingPitch?.type || ''}
                  placeholder="Pl. Füves pálya"
                  key={`type-${editingPitch?.id || 'new'}`}
                />
              </div>

              <div className="player-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setEditingPitch(null)}
                >
                  Új
                </button>
                <button type="submit" className="neon-button">
                  {editingPitch ? 'Mentés' : 'Pálya hozzáadása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isClubManager && modal === 'people' && (
        <div className="player-modal-backdrop" onClick={() => setModal(null)}>
          <div
            className="player-modal club-event-modal club-management-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="player-modal-close" onClick={() => setModal(null)}>×</button>

            <div className="player-modal-eyebrow">KLUBTAGOK</div>
            <h2>Edzők meghívása</h2>
            <p className="player-modal-position">
              Az email-cím alapján elkészítjük a meghívót. A klubban csak két szerepkör van: szakmai vezető és edző.
            </p>

            <form className="club-inline-form" onSubmit={invitePerson}>
              <div className="player-form-row">
                <div className="form-group">
                  <label>NÉV</label>
                  <input name="name" placeholder="Pl. Kovács Péter" />
                </div>

                <div className="form-group">
                  <label>EMAIL</label>
                  <input name="email" type="email" placeholder="edzo@email.hu" required />
                </div>
              </div>

              <div className="form-group">
                <label>SZEREPKÖR</label>
                <select name="role" defaultValue="coach">
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              <div className="player-form-actions">
                <span className="club-muted">
                  A meghívó jelenleg email-kliensből küldhető; a valódi klubtagságot később Supabase kezeli.
                </span>
                <button type="submit" className="neon-button">Meghívó email megnyitása</button>
              </div>
            </form>

            <div className="club-management-list club-members-list">
              <div className="card-label">AKTÍV TAGOK</div>

              {memberList.map((member) => (
                <div className="club-management-row" key={member.id}>
                  <div>
                    <strong>{member.name || member.email}</strong>
                    <span>
                      {ROLE_OPTIONS.find(
                        (role) => role.value === normalizeMemberRole(member.role),
                      )?.label || 'Edző'} · {member.email}
                    </span>
                  </div>
                  <span className="active-pill">AKTÍV</span>
                </div>
              ))}

              {invites.length > 0 && (
                <div className="card-label club-invites-label">FÜGGŐ MEGHÍVÓK</div>
              )}

              {invites.map((invite) => (
                <div className="club-management-row" key={invite.id}>
                  <div>
                    <strong>{invite.name || invite.email}</strong>
                    <span>
                      {ROLE_OPTIONS.find((role) => role.value === normalizeMemberRole(invite.role))?.label || 'Edző'} · {invite.email}
                    </span>
                  </div>

                  <div className="club-row-actions">
                    <span className="club-pending-pill">FÜGGŐBEN</span>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => resendInvite(invite)}
                    >
                      Újraküldés
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal === 'email' && (
        <div className="player-modal-backdrop" onClick={() => setModal(null)}>
          <div
            className="player-modal club-email-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="player-modal-close" onClick={() => setModal(null)}>×</button>

            <div className="player-modal-eyebrow">EMAIL ELŐNÉZET</div>
            <h2>{cleanClubName(clubName)} · Heti program</h2>
            <p className="player-modal-position">{weekLabel} · mobilbarát összefoglaló</p>

            <div className="club-email-preview">
              {weekDays.map((day) => {
                const dayEvents = visibleEvents.filter((event) => event.date === day.dateKey)

                return (
                  <div className="club-email-day" key={day.dateKey}>
                    <strong>
                      {day.label} · {day.date.toLocaleDateString('hu-HU', {
                        month: 'short',
                        day: '2-digit',
                      })}
                    </strong>

                    {dayEvents.length ? (
                      dayEvents.map((event) => (
                        <div className="club-email-row" key={event.id}>
                          <span>{event.start}–{event.end}</span>
                          <b>{event.title}</b>
                          <span>{pitchName(pitches, event.pitchId)}</span>
                          <small>{event.coach}</small>
                        </div>
                      ))
                    ) : (
                      <span className="club-muted">Nincs tervezett program</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="player-form-actions">
              <button type="button" className="secondary-button" onClick={() => setModal(null)}>
                Bezárás
              </button>
              <button type="button" className="neon-button" onClick={copyEmailSummary}>
                {copied ? '✓ Kimásolva' : '✉ Szöveg másolása'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
