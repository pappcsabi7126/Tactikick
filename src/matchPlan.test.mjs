import assert from 'node:assert/strict'
import test from 'node:test'
import { formations, formationRows, getHalves, readMatchPlan, quarterLineup, validateHalves, changeFormation, removePlayerFromHalf, getMatchFormat, changeMatchFormat, playingMinutes, matchTimeline, halfChanges, newTeamMatchPlan, teamMatchDefaults } from './matchPlan.js'
import { matchPdfHtml } from './matchPdf.js'

test('four formations have correct player counts and pitch rows', () => {
  assert.deepEqual(Object.keys(formations), ['1–2–1', '2–2', '3–2–3', '4–3–1'])
  assert.deepEqual(formationRows['3–2–3'].map((row) => row.length), [3, 2, 3, 1])
  assert.deepEqual(formationRows['4–3–1'].map((row) => row.length), [1, 3, 4, 1])
  for (const [formation, positions] of Object.entries(formations)) {
    assert.equal(new Set(positions).size, ['1–2–1', '2–2'].includes(formation) ? 5 : 9)
    assert.deepEqual([...formationRows[formation].flat()].sort(), [...positions].sort())
  }
})

test('U9 defaults and format switches support five players in both halves and PDF', () => {
  const plan = readMatchPlan({}, { age: 'U9' })
  assert.equal(getMatchFormat(plan), '4+1')
  assert.equal(getHalves(plan)[0].formation, '1–2–1')
  assert.deepEqual(formationRows['1–2–1'].map(row => row.length), [1, 2, 1, 1])
  assert.deepEqual(formationRows['2–2'].map(row => row.length), [2, 2, 1])
  const old = readMatchPlan({})
  assert.equal(getMatchFormat(readMatchPlan({ plan: [old] }, { age: 'U9' })), '8+1')
  old.halves = getHalves(old)
  old.halves[0].starters = { K: '1', BSZ: '2' }
  old.halves[1].replacements = { K: '3', JSZ: '4' }
  const next = changeMatchFormat(old, '4+1')
  assert.deepEqual(next.halves[0].starters, { K: '1' })
  assert.deepEqual(next.halves[1].replacements, { K: '3' })
  assert.equal(old.halves[0].starters.BSZ, '2')
  const html = matchPdfHtml({ match: { title: 'U9', date: '2026-10-07' }, plan: next, halves: next.halves, teamAge: 'U9' })
  assert.equal((html.match(/margin-bottom:5px/g) || []).length, 5)
})

test('half lineups remain independent and replacements affect only the next quarter', () => {
  const halves = getHalves(readMatchPlan({}))
  halves[0].starters.K = '1'
  halves[0].replacements.K = '2'
  assert.equal(halves[1].starters.K, undefined)
  assert.equal(halves[0].starters.K, '1')
  assert.equal(quarterLineup(halves[0]).K, '2')
  assert.deepEqual(validateHalves(halves), [])
  halves[0].starters.BV = '2'
  assert.equal(validateHalves(halves).length, 1)
})

test('legacy match retains squad and migrates substitutions at quarter boundaries', () => {
  const plan = { ...readMatchPlan({}), formation: '9 · 3–3–2', starters: { K: '1', KK: '9' }, substitutions: [{ minute: 20, out: '1', in: '2' }, { minute: 40, out: '2', in: '3' }, { minute: 60, out: '3', in: '4' }] }
  const halves = getHalves(plan)
  assert.equal(halves[0].formation, '3–2–3')
  assert.equal(halves[0].starters.K, '1')
  assert.equal(quarterLineup(halves[0]).K, '2')
  assert.equal(halves[1].starters.K, '3')
  assert.equal(quarterLineup(halves[1]).K, '4')
  assert.equal(halves[0].starters.KK, undefined)
  assert.equal(plan.starters.KK, '9')
})

test('formation changes and squad removal clear unusable assignments', () => {
  const half = { formation: '3–2–3', starters: { K: '1', KV: '2' }, replacements: { K: '3', KV: '4' } }
  assert.deepEqual(changeFormation(half, '4–3–1').starters, { K: '1' })
  assert.deepEqual(changeFormation(half, '4–3–1').replacements, { K: '3' })
  assert.deepEqual(removePlayerFromHalf(half, '1').replacements, { KV: '4' })
})

test('PDF contains only the opening lineup, replacements and one bench with minimal match information', () => {
  const plan = { ...readMatchPlan({}), squad: [{ id: '1', name: '<Ákos & Bence>' }, { id: '2', name: 'Csere' }] }
  const halves = getHalves(plan)
  halves[0].starters.K = '1'
  halves[0].replacements.K = '2'
  halves[1].formation = '4–3–1'
  const html = matchPdfHtml({ match: { title: '<Meccs>', date: '2026-09-07', startTime: '14:00' }, teamName: 'Klub', teamAge: 'U12', plan, halves })
  assert.ok(html.includes('&lt;Ákos &amp; Bence&gt;'))
  assert.ok(html.includes('U12 · 2026-09-07'))
  assert.ok(html.includes('>Csere</div>'))
  assert.ok(html.includes('Cserék'))
  assert.ok(!html.includes('félidő'))
  assert.ok(!html.includes('negyed'))
  assert.ok(!html.includes('Marad'))
  assert.ok(!html.includes('14:00'))
  assert.ok(!html.includes('Meccskeret névsora'))
  const bench = html.split('Cserék</h2>')[1]
  assert.ok(bench.includes('Csere'))
  assert.ok(!bench.includes('&lt;Ákos'))
  assert.ok(!html.includes('<Meccs>'))
})

function completeU9() {
  const plan = readMatchPlan({}, { age: 'U9' })
  plan.squad = Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), name: `Játékos ${i + 1}` }))
  plan.halves = getHalves(plan)
  for (const half of plan.halves) half.starters = Object.fromEntries(formations[half.formation].map((position, i) => [position, String(i + 1)]))
  return plan
}

test('multiple timed substitutions and re-entry calculate exact minutes', () => {
  const plan = completeU9()
  plan.halves[0].changes = [{ id: 'a', minute: 5, position: 'K', in: '6' }, { id: 'b', minute: 12, position: 'K', in: '1' }]
  const minutes = playingMinutes(plan)
  assert.equal(minutes['1'], 33)
  assert.equal(minutes['6'], 7)
  assert.equal(Object.values(minutes).reduce((a, b) => a + b, 0), 5 * 40)
  assert.deepEqual(matchTimeline(plan).errors, [])
  assert.equal(matchTimeline(plan).segments[1].lineup.K, '6')
})

test('legacy quarter substitutions retain their minutes when converted', () => {
  const plan = completeU9()
  plan.halves[0].replacements.K = '6'
  const before = playingMinutes(plan)
  plan.halves[0].changes = halfChanges(plan.halves[0], plan.duration)
  plan.halves[0].replacements = {}
  assert.deepEqual(playingMinutes(plan), before)
  assert.equal(before['6'], 10)
})

test('validation catches missing goalkeeper, invalid times and players already on field', () => {
  const plan = completeU9()
  plan.halves[0].changes = [{ minute: 20, position: 'K', in: '6' }, { minute: 5, position: 'K', in: '2' }]
  assert.equal(matchTimeline(plan).errors.length, 2)
  delete plan.halves[1].starters.K
  assert.ok(matchTimeline(plan).errors.some(error => error.includes('hiányzó posztok: K')))
})

test('team defaults are isolated by team and full PDF contains both halves and minutes', () => {
  const plan = completeU9()
  const defaults = { kind: 'match-defaults', savedAt: 10, format: '4+1', formation: '2–2', duration: 32 }
  const matches = [{ teamId: 1, plan: [defaults] }, { teamId: 2, plan: [{ ...defaults, savedAt: 20, duration: 80 }] }]
  const saved = teamMatchDefaults(matches, { id: 1 })
  const next = newTeamMatchPlan({ age: 'U9' }, saved)
  assert.equal(next.duration, 32)
  assert.equal(next.formation, '2–2')
  assert.deepEqual(next.squad, [])
  const html = matchPdfHtml({ match: { title: '<U9>', date: '2026-10-07' }, plan, halves: plan.halves, full: true })
  assert.ok(html.includes('1. félidő'))
  assert.ok(html.includes('2. félidő'))
  assert.ok(html.includes('Tervezett játékpercek'))
  assert.ok(html.includes('&lt;U9&gt;'))
})
