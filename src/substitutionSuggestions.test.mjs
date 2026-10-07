import test from 'node:test'
import assert from 'node:assert/strict'
import { readMatchPlan, getHalves } from './matchPlan.js'
import { suggestSubstitutions, positionGroup } from './substitutionSuggestions.js'

function fixture() {
  const plan = readMatchPlan({}, { age: 'U9' })
  plan.squad = [
    { id: '1', name: 'Kapus', position: 'Kapus' },
    { id: '2', name: 'Védő', position: 'Védő' },
    { id: '3', name: 'Bal közép', position: 'Középpályás' },
    { id: '4', name: 'Jobb közép', position: 'Középpályás' },
    { id: '5', name: 'Csatár', position: 'Támadó' },
    { id: '6', name: 'Cserecsatár', position: 'Támadó' },
    { id: '7', name: 'Cserekapus', position: 'Kapus' },
    { id: '8', name: 'Cserevédő', position: 'Védő' },
  ]
  const halves = getHalves(plan)
  halves.forEach(half => { half.starters = { K: '1', KV: '2', BK: '3', JK: '4', CS: '5' } })
  return { plan, halves }
}

test('keeper suggestions cannot include forwards even with strong acceptance history', () => {
  const { plan, halves } = fixture()
  const history = Array.from({ length: 100 }, () => ({ position: 'K', in: '6' }))
  const suggestions = suggestSubstitutions(plan, halves, 0, 'K', history)
  assert.deepEqual(suggestions.map(item => item.player.id), ['7'])
  assert.ok(suggestions[0].reason.includes('10 perccel kevesebbet'))
  assert.deepEqual(suggestSubstitutions(plan, halves, 0, 'CS').map(item => item.player.id), ['6'])
})

test('secondary positions work but missing and incompatible positions are excluded', () => {
  const { plan, halves } = fixture()
  plan.squad.find(player => player.id === '6').secondaryPosition = 'Védő'
  const suggestions = suggestSubstitutions(plan, halves, 0, 'KV')
  assert.deepEqual(suggestions.map(item => item.player.id), ['8', '6'])
  assert.equal(positionGroup('Kozep-palyas'), 'midfielder')
  assert.equal(positionGroup('ismeretlen'), null)
  plan.squad.find(player => player.id === '8').position = ''
  assert.deepEqual(suggestSubstitutions(plan, halves, 0, 'KV').map(item => item.player.id), ['6'])
})

test('players assigned to another replacement are excluded and suggestions do not mutate plans', () => {
  const { plan, halves } = fixture()
  halves[0].replacements.CS = '8'
  const original = structuredClone(halves)
  assert.deepEqual(suggestSubstitutions(plan, halves, 0, 'KV'), [])
  assert.deepEqual(halves, original)
})

test('less played compatible player wins and acceptance history resolves equal fits', () => {
  const { plan, halves } = fixture()
  plan.squad.push({ id: '9', name: 'Másik védő', position: 'Védő' })
  halves[0].starters.KV = '8'
  const suggestions = suggestSubstitutions(plan, halves, 1, 'KV', [{ position: 'KV', in: '9' }])
  assert.equal(suggestions[0].player.id, '9')
  assert.ok(suggestions[0].reason.includes('korábbi elfogadott'))
  assert.equal(suggestions[0].minutes, 0)
})
