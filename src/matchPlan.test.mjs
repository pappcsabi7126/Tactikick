import assert from 'node:assert/strict'
import test from 'node:test'
import { formations, formationRows, getHalves, readMatchPlan, quarterLineup, validateHalves, changeFormation, removePlayerFromHalf } from './matchPlan.js'
import { matchPdfHtml } from './matchPdf.js'

test('only the two requested nine-player formations, in correct pitch rows', () => {
  assert.deepEqual(Object.keys(formations), ['3–2–3', '4–3–1'])
  assert.deepEqual(formationRows['3–2–3'].map((row) => row.length), [3, 2, 3, 1])
  assert.deepEqual(formationRows['4–3–1'].map((row) => row.length), [1, 3, 4, 1])
  for (const [formation, positions] of Object.entries(formations)) {
    assert.equal(new Set(positions).size, 9)
    assert.deepEqual([...formationRows[formation].flat()].sort(), [...positions].sort())
  }
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

<<<<<<< HEAD
test('PDF contains only the opening lineup, replacements and one bench with minimal match information', () => {
=======
test('PDF includes both half formations, substitutions, quarter benches and escaped names', () => {
>>>>>>> e724eda73f7a03b47cbe594092c05e774d51d5aa
  const plan = { ...readMatchPlan({}), squad: [{ id: '1', name: '<Ákos & Bence>' }, { id: '2', name: 'Csere' }] }
  const halves = getHalves(plan)
  halves[0].starters.K = '1'
  halves[0].replacements.K = '2'
  halves[1].formation = '4–3–1'
<<<<<<< HEAD
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
=======
  const html = matchPdfHtml({ match: { title: '<Meccs>', date: '2026-09-07' }, teamName: 'U12', plan, halves })
  assert.ok(html.includes('&lt;Ákos &amp; Bence&gt;'))
  assert.ok(html.includes('1. félidő · 3–2–3'))
  assert.ok(html.includes('2. félidő · 4–3–1'))
  assert.ok(html.includes('↳ Csere'))
  assert.ok(html.includes('4. negyed – kispad'))
>>>>>>> e724eda73f7a03b47cbe594092c05e774d51d5aa
  assert.ok(!html.includes('<Meccs>'))
})
