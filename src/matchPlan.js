export const formations = {
  '3–2–3': ['K', 'BV', 'KV', 'JV', 'BK', 'JK', 'BSZ', 'CS', 'JSZ'],
  '4–3–1': ['K', 'BV', 'BKV', 'JKV', 'JV', 'BK', 'KK', 'JK', 'CS'],
}

// Rows run from attack to goalkeeper; positions within each row run left to right.
export const formationRows = {
  '3–2–3': [['BSZ', 'CS', 'JSZ'], ['BK', 'JK'], ['BV', 'KV', 'JV'], ['K']],
  '4–3–1': [['CS'], ['BK', 'KK', 'JK'], ['BV', 'BKV', 'JKV', 'JV'], ['K']],
}

export function changeFormation(half, formation) {
  const keep = (values) => Object.fromEntries(Object.entries(values).filter(([position]) => formations[formation].includes(position)))
  return { formation, starters: keep(half.starters), replacements: keep(half.replacements) }
}

export function removePlayerFromHalf(half, id) {
  return {
    ...half,
    starters: Object.fromEntries(Object.entries(half.starters).filter(([, value]) => value !== id)),
    replacements: Object.fromEntries(Object.entries(half.replacements).filter(([position, value]) => value !== id && half.starters[position] !== id)),
  }
}

export function quarterLineup(half) {
  return Object.fromEntries(formations[half.formation].map((position) => [position, half.replacements[position] || half.starters[position] || '']))
}

export function getHalves(plan) {
  if (plan.halves) return plan.halves.map((half) => formations[half.formation] ? half : changeFormation(half, '3–2–3'))
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
    return changeFormation({ starters, replacements: Object.fromEntries(Object.entries(next).filter(([position, id]) => id !== starters[position])) }, formations[plan.formation] ? plan.formation : '3–2–3')
  })
}

export function validateHalves(halves) {
  return halves.flatMap((half, index) => [half.starters, quarterLineup(half)].flatMap((lineup, quarter) => {
    const ids = Object.values(lineup).filter(Boolean)
    return ids.length !== new Set(ids).size ? [`${index * 2 + quarter + 1}. negyed: egy játékos több poszton szerepel.`] : []
  }))
}

export function readMatchPlan(match) {
  return match.plan?.find((item) => item.kind === 'match-lineup') || {
    kind: 'match-lineup', formation: '3–2–3', squad: [], starters: {}, substitutions: [], duration: 80,
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
