export const matchRoles = [
  ['captain', 'Csapatkapitány'],
  ['penalty', 'Büntető'],
  ['freeKick', 'Szabadrúgás'],
  ['cornerLeft', 'Szöglet – bal oldal'],
  ['cornerRight', 'Szöglet – jobb oldal'],
]

export const formations = {
  '1–2–1': ['K', 'KV', 'BK', 'JK', 'CS'],
  '2–2': ['K', 'BV', 'JV', 'BCS', 'JCS'],
  '3–2–3': ['K', 'BV', 'KV', 'JV', 'BK', 'JK', 'BSZ', 'CS', 'JSZ'],
  '4–3–1': ['K', 'BV', 'BKV', 'JKV', 'JV', 'BK', 'KK', 'JK', 'CS'],
}

// Rows run from attack to goalkeeper; positions within each row run left to right.
export const formationRows = {
  '1–2–1': [['CS'], ['BK', 'JK'], ['KV'], ['K']],
  '2–2': [['BCS', 'JCS'], ['BV', 'JV'], ['K']],
  '3–2–3': [['BSZ', 'CS', 'JSZ'], ['BK', 'JK'], ['BV', 'KV', 'JV'], ['K']],
  '4–3–1': [['CS'], ['BK', 'KK', 'JK'], ['BV', 'BKV', 'JKV', 'JV'], ['K']],
}

export const matchFormats = {
  '4+1': { label: 'U9 · 4+1', formations: ['1–2–1', '2–2'] },
  '8+1': { label: 'U12–U13 · 8+1', formations: ['3–2–3', '4–3–1'] },
}

export function getMatchFormat(plan) {
  if (matchFormats[plan.format]) return plan.format
  return matchFormats['4+1'].formations.includes(plan.halves?.[0]?.formation || plan.formation) ? '4+1' : '8+1'
}

export function changeMatchFormat(plan, format) {
  const allowed = matchFormats[format].formations
  const halves = getHalves(plan).map((half) => changeFormation(half, allowed.includes(half.formation) ? half.formation : allowed[0]))
  return { ...plan, format, formation: halves[0].formation, halves, starters: halves[0].starters, substitutions: [] }
}

export function changeFormation(half, formation) {
  const keep = (values) => Object.fromEntries(Object.entries(values).filter(([position]) => formations[formation].includes(position)))
  return { ...half, formation, starters: keep(half.starters), replacements: keep(half.replacements), ...(half.changes ? { changes: half.changes.filter((change) => formations[formation].includes(change.position)) } : {}) }
}

export function removePlayerFromHalf(half, id) {
  return {
    ...half,
    ...(half.changes ? { changes: half.changes.filter((change) => String(change.in) !== String(id)) } : {}),
    starters: Object.fromEntries(Object.entries(half.starters).filter(([, value]) => value !== id)),
    replacements: Object.fromEntries(Object.entries(half.replacements).filter(([position, value]) => value !== id && half.starters[position] !== id)),
  }
}

export function quarterLineup(half) {
  return Object.fromEntries(formations[half.formation].map((position) => [position, half.replacements[position] || half.starters[position] || '']))
}

export function getHalves(plan) {
  const allowed = matchFormats[getMatchFormat(plan)].formations
  if (plan.halves) return plan.halves.map((half) => allowed.includes(half.formation) ? half : changeFormation(half, allowed[0]))
  const atMinute = (minute) => {
    const lineup = { ...plan.starters }
    for (const sub of [...plan.substitutions].sort((a, b) => Number(a.minute) - Number(b.minute))) {
      if (Number(sub.minute) > minute) continue
      const position = Object.keys(lineup).find((key) => String(lineup[key]) === String(sub.out))
      if (position) lineup[position] = String(sub.in)
    }
    return lineup
  }
  return [0, 1].map((index) => {
    const starters = atMinute(index * plan.duration / 2)
    const next = atMinute((index * 2 + 1) * plan.duration / 4)
    return changeFormation({ starters, replacements: Object.fromEntries(Object.entries(next).filter(([position, id]) => id !== starters[position])) }, allowed.includes(plan.formation) ? plan.formation : allowed[0])
  })
}

export function validateHalves(halves) {
  return halves.flatMap((half, index) => [half.starters, quarterLineup(half)].flatMap((lineup, quarter) => {
    const ids = Object.values(lineup).filter(Boolean)
    return ids.length !== new Set(ids).size ? [`${index * 2 + quarter + 1}. negyed: egy játékos több poszton szerepel.`] : []
  }))
}

export function readMatchPlan(match, team) {
  const isU9 = /\bU\s*9\b/i.test(`${team?.age || ''} ${team?.name || ''}`)
  return match.plan?.find((item) => item.kind === 'match-lineup') || {
    kind: 'match-lineup', format: isU9 ? '4+1' : '8+1', formation: isU9 ? '1–2–1' : '3–2–3', squad: [], starters: {}, substitutions: [], duration: isU9 ? 40 : 80,
  }
}

export function validateSubstitutions(plan) {
  const onField = new Set(Object.values(plan.starters).filter(Boolean))
  const squad = new Set(plan.squad.map((player) => String(player.id)))
  const errors = []
  for (const sub of [...plan.substitutions].sort((a, b) => Number(a.minute) - Number(b.minute))) {
    if (!Number.isInteger(Number(sub.minute)) || sub.minute === '' || Number(sub.minute) < 1 || Number(sub.minute) > plan.duration) errors.push('A csere perce legyen a játékidőn belül.')
    else if (!onField.has(sub.out) || onField.has(sub.in) || !squad.has(sub.in)) errors.push(`${sub.minute}. perc: a lemenő játékosnak a pályán, a beállónak a kispadon kell lennie.`)
    else { onField.delete(sub.out); onField.add(sub.in) }
  }
  return errors
}

export function halfChanges(half, duration) {
  return half.changes ?? Object.entries(half.replacements).filter(([, id]) => id).map(([position, id]) => ({ id: `legacy-${position}`, position, in: id, minute: duration / 4 }))
}

export function standardHalves(plan) {
  return getHalves(plan).map(half => {
    if (!half.changes) return half
    const lineup = { ...half.starters }
    for (const change of [...half.changes].sort((a, b) => Number(a.minute) - Number(b.minute))) {
      if (Number(change.minute) > 0 && Number(change.minute) <= plan.duration / 4 && formations[half.formation].includes(change.position) && change.in) lineup[change.position] = String(change.in)
    }
    const standard = { ...half }
    delete standard.changes
    return { ...standard, replacements: Object.fromEntries(Object.entries(lineup).filter(([position, id]) => id !== half.starters[position])) }
  })
}

export function matchTimeline(plan, halves = getHalves(plan)) {
  const segments = []
  const errors = [...validateHalves(halves)]
  const squad = new Set(plan.squad.map(player => String(player.id)))
  halves.forEach((half, index) => {
    let lineup = Object.fromEntries(formations[half.formation].map(position => [position, half.starters[position] || '']))
    let previous = 0
    const length = plan.duration / 2
    const append = (end) => {
      if (end > previous) segments.push({ start: index * length + previous, end: index * length + end, lineup: { ...lineup }, half: index })
      previous = end
    }
    for (const change of [...halfChanges(half, plan.duration)].sort((a, b) => Number(a.minute) - Number(b.minute))) {
      const minute = Number(change.minute)
      if (change.minute === '' || !Number.isFinite(minute) || minute <= 0 || minute >= length) {
        errors.push(`${index + 1}. félidő: a csere perce 0 és ${length} között legyen.`)
        continue
      }
      append(minute)
      if (!formations[half.formation].includes(change.position) || !lineup[change.position] || !squad.has(String(change.in)) || Object.values(lineup).includes(String(change.in))) {
        errors.push(`${index + 1}. félidő, ${minute}. perc: a beálló legyen a kispadon, a lecserélt poszt legyen betöltve.`)
        continue
      }
      lineup = { ...lineup, [change.position]: String(change.in) }
    }
    append(length)
  })
  for (const segment of segments) {
    const missing = Object.entries(segment.lineup).filter(([, id]) => !id).map(([position]) => position)
    if (missing.length) errors.push(`${segment.start}–${segment.end}. perc: hiányzó posztok: ${missing.join(', ')}.`)
    if (Object.values(segment.lineup).some(id => id && !squad.has(String(id)))) errors.push(`${segment.start}–${segment.end}. perc: kereten kívüli játékos szerepel.`)
  }
  return { segments, errors: [...new Set(errors)] }
}

export function playingMinutes(plan, halves = getHalves(plan)) {
  const minutes = Object.fromEntries(plan.squad.map(player => [String(player.id), 0]))
  for (const segment of matchTimeline(plan, halves).segments) {
    for (const id of new Set(Object.values(segment.lineup).filter(Boolean))) minutes[id] = (minutes[id] || 0) + segment.end - segment.start
  }
  return minutes
}

export function teamMatchDefaults(matches, team) {
  return matches.filter(match => String(match.teamId) === String(team?.id)).flatMap(match => match.plan || []).filter(item => item.kind === 'match-defaults').sort((a, b) => b.savedAt - a.savedAt)[0]
}

export function newTeamMatchPlan(team, defaults) {
  const plan = readMatchPlan({}, team)
  if (!defaults || !matchFormats[defaults.format]?.formations.includes(defaults.formation)) return plan
  return { ...plan, format: defaults.format, formation: defaults.formation, duration: defaults.duration }
}
