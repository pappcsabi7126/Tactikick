import { supabase } from './supabase'

export const cloudEnabled = Boolean(supabase)

function throwIfError(result, label) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`)
  }
  return result.data
}

export async function getCurrentSession() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export function subscribeToAuth(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session)
  })
  return () => data.subscription.unsubscribe()
}

export async function signInWithEmail(email, password) {
  if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signUpWithEmail(email, password) {
  if (!supabase) throw new Error('A Supabase nincs konfigurálva.')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('A Supabase nincs konfigurálva.')

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  })

  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function loadCoachData(userId) {
  if (!supabase || !userId) return null

  const [profileResult, teamsResult, playersResult, trainingsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('teams').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('players').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('trainings').select('*').eq('user_id', userId).order('date', { ascending: true }).order('start_time', { ascending: true }),
  ])

  throwIfError(profileResult, 'Profil betöltése')
  throwIfError(teamsResult, 'Csapatok betöltése')
  throwIfError(playersResult, 'Játékosok betöltése')
  throwIfError(trainingsResult, 'Edzések betöltése')

  const profileEmail = String(profileResult.data?.email || '').trim().toLowerCase()
  const effectiveRole = profileEmail === 'pappcsabi7126@gmail.com'
    ? 'admin'
    : (profileResult.data?.role || 'coach')

  return {
    profile: profileResult.data
      ? {
          name: profileResult.data.name || '',
          role: effectiveRole,
          club: profileResult.data.club || '',
          email: profileResult.data.email || '',
        }
      : null,
    teams: (teamsResult.data || []).map((team) => ({
      id: Number(team.id),
      name: team.name,
      age: team.age || team.age_group || '',
      color: team.color || 'purple',
    })),
    players: (playersResult.data || []).map((player) => ({
      id: Number(player.id),
      teamId: Number(player.team_id),
      name: player.name,
      position: player.position || '',
      birthYear: player.birth_year || '',
      number: player.jersey_number ?? '',
      attendance: Number(player.attendance || 0),
      trainings: Number(player.trainings || 0),
      present: Number(player.present || 0),
      absent: Number(player.absent || 0),
    })),
    trainings: (trainingsResult.data || []).map((training) => ({
      id: Number(training.id),
      teamId: Number(training.team_id),
      date: training.date || training.training_date || '',
      startTime: training.start_time?.slice(0, 5) || '',
      endTime: training.end_time?.slice(0, 5) || '',
      title: training.title,
      color: training.color || 'purple',
      calendarType: training.calendar_type || 'training',
      plan: Array.isArray(training.plan) ? training.plan : [],
      attendance: training.attendance || {},
      notes: training.notes || '',
    })),
  }
}

export async function saveProfile(userId, profile) {
  if (!supabase || !userId) return
  throwIfError(
    await supabase.from('profiles').upsert({
      id: userId,
      email: profile.email || null,
      name: profile.name || '',
      role: profile.role || 'Coach',
      club: profile.club || '',
      updated_at: new Date().toISOString(),
    }),
    'Profil mentése',
  )
}

function dataUrlToBlob(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/s)
  if (!match) return null

  const mime = match[1] || 'application/octet-stream'
  const body = match[3] || ''

  if (match[2]) {
    const binary = atob(body)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return new Blob([bytes], { type: mime })
  }

  return new Blob([decodeURIComponent(body)], { type: mime })
}

function extensionFromMime(mime) {
  const normalized = String(mime || '').toLowerCase()
  if (normalized.includes('png')) return 'png'
  if (normalized.includes('webp')) return 'webp'
  if (normalized.includes('gif')) return 'gif'
  return 'jpg'
}

async function uploadExerciseImages(userId, training) {
  if (!supabase || !userId || !Array.isArray(training.plan)) {
    return training.plan || []
  }

  const nextPlan = []

  for (const exercise of training.plan) {
    if (!exercise?.image || !String(exercise.image).startsWith('data:')) {
      nextPlan.push(exercise)
      continue
    }

    const blob = dataUrlToBlob(exercise.image)
    if (!blob) {
      nextPlan.push(exercise)
      continue
    }

    const extension = extensionFromMime(blob.type)
    const path = `${userId}/${training.id}/${exercise.id}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from('exercise-images')
      .upload(path, blob, {
        contentType: blob.type,
        upsert: true,
        cacheControl: '31536000',
      })

    if (uploadError) {
      throw new Error(`Gyakorlatkép feltöltése: ${uploadError.message}`)
    }

    const { data } = supabase.storage
      .from('exercise-images')
      .getPublicUrl(path)

    nextPlan.push({
      ...exercise,
      image: data.publicUrl,
    })
  }

  return nextPlan
}

async function normalizeTrainingForCloud(userId, training) {
  const plan = await uploadExerciseImages(userId, training)
  return {
    ...training,
    plan,
  }
}

async function syncTable(table, userId, rows, mapRow) {
  if (!supabase || !userId) return

  // IMPORTANT: sync is intentionally non-destructive. A temporary empty
  // React state, failed query, or migration must never delete real cloud data.
  // Explicit user deletions are handled by deleteCoach* functions below.
  if (!Array.isArray(rows) || rows.length === 0) return

  let payload = rows.map((row) => ({ ...mapRow(row), user_id: userId }))
  let { error } = await supabase.from(table).upsert(payload)

  // A few early TactiKick schemas used age_group instead of age. If an older
  // project is still on that schema, retry only the teams write with the old
  // column rather than losing the whole save operation.
  if (error && table === 'teams' && /age_group|column.*age|schema cache/i.test(error.message || '')) {
    payload = rows.map((row) => ({
      ...mapRow(row),
      user_id: userId,
      age_group: row.age || row.age_group || '',
    }))
    // Rebuild cleanly so we never send both columns to PostgREST.
    payload = rows.map((row) => ({
      id: row.id,
      name: row.name || '',
      age_group: row.age || row.age_group || '',
      color: row.color || 'purple',
      updated_at: new Date().toISOString(),
      user_id: userId,
    }))
    ;({ error } = await supabase.from(table).upsert(payload))
  }

  if (error) {
    if (table === 'trainings') {
      console.error('TactiKick trainings payload:', payload)
      console.error('TactiKick trainings Supabase error:', error)
    }
    throw new Error(`${table} mentése: ${error.message}`)
  }
}

export async function deleteCoachTeam(userId, teamId) {
  if (!supabase || !userId || teamId == null) return
  const { error } = await supabase.from('teams').delete().eq('id', Number(teamId)).eq('user_id', userId)
  if (error) throw new Error(`Csapat törlése: ${error.message}`)
}

export async function deleteCoachPlayer(userId, playerId) {
  if (!supabase || !userId || playerId == null) return
  const { error } = await supabase.from('players').delete().eq('id', Number(playerId)).eq('user_id', userId)
  if (error) throw new Error(`Játékos törlése: ${error.message}`)
}

export async function deleteCoachTraining(userId, trainingId) {
  if (!supabase || !userId || trainingId == null) return
  const { error } = await supabase.from('trainings').delete().eq('id', Number(trainingId)).eq('user_id', userId)
  if (error) throw new Error(`Edzés törlése: ${error.message}`)
}

export async function syncCoachData(userId, { teams, players, trainings }) {
  if (!supabase || !userId) return

  const cloudTrainings = []
  for (const training of trainings || []) {
    cloudTrainings.push(await normalizeTrainingForCloud(userId, training))
  }

  // Sync parent rows first so player/training foreign keys always have
  // their team available in Supabase.
  await syncTable('teams', userId, teams, (team) => ({
    id: team.id,
    name: team.name || '',
    age_group: team.age || team.age_group || '',
    color: team.color || 'purple',
    updated_at: new Date().toISOString(),
  }))

  await syncTable('players', userId, players, (player) => ({
    id: player.id,
    team_id: player.teamId,
    name: player.name || '',
    position: player.position || '',
    birth_year: player.birthYear ? Number(player.birthYear) : null,
    jersey_number: player.number === '' ? null : Number(player.number),
    attendance: Number(player.attendance || 0),
    trainings: Number(player.trainings || 0),
    present: Number(player.present || 0),
    absent: Number(player.absent || 0),
    updated_at: new Date().toISOString(),
  }))

  await syncTable('trainings', userId, cloudTrainings, (training) => {
    const plan = Array.isArray(training.plan) ? training.plan : []
    return {
      id: training.id,
      team_id: training.teamId,
      // Match the current Supabase schema exactly. Sending legacy/nonexistent
      // columns makes PostgREST reject the entire upsert and leaves the app
      // looking like it saved while nothing was actually persisted.
      date: training.date || null,
      start_time: training.startTime || null,
      end_time: training.endTime || null,
      title: training.title || '',
      color: training.color || 'purple',
      calendar_type: training.calendarType || 'training',
      plan,
      attendance: training.attendance || {},
      notes: training.notes || '',
      updated_at: new Date().toISOString(),
    }
  })
}


export async function generateAITrainingWithCloud(payload) {
  if (!supabase) return null
  try {
    const { data, error } = await supabase.functions.invoke('generate-training', {
      body: payload,
    })
    if (error) throw error
    return data?.training || data || null
  } catch (error) {
    console.warn('AI Edge Function unavailable, using local planner:', error)
    return null
  }
}

/* =====================================================
   TRAINING LIBRARY / SAVED TEMPLATES
===================================================== */

function mapTrainingTemplate(row) {
  return {
    id: Number(row.id),
    teamId: row.team_id == null ? null : Number(row.team_id),
    name: row.name || '',
    duration: Number(row.duration || 0),
    plan: Array.isArray(row.plan) ? row.plan : [],
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  }
}

export async function loadTrainingTemplates(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('training_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Edzéskönyvtár betöltése: ${error.message}`)
  }

  return (data || []).map(mapTrainingTemplate)
}

export async function createTrainingTemplate(userId, template) {
  if (!supabase || !userId) {
    throw new Error('A Supabase nincs konfigurálva.')
  }

  const plan = Array.isArray(template.plan) ? template.plan : []
  const duration =
    Number(template.duration) ||
    plan.reduce((sum, exercise) => sum + (Number(exercise?.duration) || 0), 0)

  const payload = {
    id: template.id ? Number(template.id) : (Date.now() * 1000 + Math.floor(Math.random() * 1000)),
    user_id: userId,
    team_id: template.teamId == null ? null : Number(template.teamId),
    name: String(template.name || '').trim() || 'Mentett edzés',
    duration,
    plan,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('training_templates')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Edzés mentése a könyvtárba: ${error.message}`)
  }

  return mapTrainingTemplate(data)
}

export async function updateTrainingTemplate(userId, template) {
  if (!supabase || !userId) {
    throw new Error('A Supabase nincs konfigurálva.')
  }

  const plan = Array.isArray(template.plan) ? template.plan : []
  const duration =
    Number(template.duration) ||
    plan.reduce((sum, exercise) => sum + (Number(exercise?.duration) || 0), 0)

  const { data, error } = await supabase
    .from('training_templates')
    .update({
      team_id: template.teamId == null ? null : Number(template.teamId),
      name: String(template.name || '').trim() || 'Mentett edzés',
      duration,
      plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', Number(template.id))
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Mentett edzés frissítése: ${error.message}`)
  }

  return mapTrainingTemplate(data)
}

export async function deleteTrainingTemplate(userId, templateId) {
  if (!supabase || !userId) {
    throw new Error('A Supabase nincs konfigurálva.')
  }

  const { error } = await supabase
    .from('training_templates')
    .delete()
    .eq('id', Number(templateId))
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Mentett edzés törlése: ${error.message}`)
  }
}

export async function createTrainingFromTemplate(userId, template, training) {
  if (!supabase || !userId) {
    throw new Error('A Supabase nincs konfigurálva.')
  }

  return {
    ...training,
    title: training.title || template.name,
    plan: Array.isArray(template.plan)
      ? template.plan.map((exercise) => ({ ...exercise }))
      : [],
  }
}