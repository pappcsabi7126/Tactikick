export const formations = {
  '5 · 1–2–1': ['K', 'V', 'BK', 'JK', 'CS'],
  '7 · 2–3–1': ['K', 'BV', 'JV', 'BK', 'KK', 'JK', 'CS'],
  '9 · 3–3–2': ['K', 'BV', 'KV', 'JV', 'BK', 'KK', 'JK', 'BCS', 'JCS'],
  '11 · 4–3–3': ['K', 'BV', 'BKV', 'JKV', 'JV', 'BK', 'KK', 'JK', 'BSZ', 'CS', 'JSZ'],
  '11 · 4–4–2': ['K', 'BV', 'BKV', 'JKV', 'JV', 'BK', 'BKK', 'JKK', 'JK', 'BCS', 'JCS'],
}

export function readMatchPlan(match) {
  return match.plan?.find((item) => item.kind === 'match-lineup') || {
    kind: 'match-lineup', formation: '9 · 3–3–2', squad: [], starters: {}, substitutions: [], duration: 80,
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
