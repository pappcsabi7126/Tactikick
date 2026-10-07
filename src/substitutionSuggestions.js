import { matchTimeline, quarterLineup } from './matchPlan.js'

export const playerPositions = ['Kapus', 'Védő', 'Szélső védő', 'Középpályás', 'Szélső', 'Támadó']
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '')
export function positionGroup(value) {
  const name = normalize(value)
  if (['kapus', 'goalkeeper', 'k'].includes(name)) return 'keeper'
  if (['vedo', 'szelsovedo', 'defender', 'fullback', 'bv', 'kv', 'jv', 'bkv', 'jkv'].includes(name)) return 'defender'
  if (['kozeppalyas', 'midfielder', 'bk', 'jk', 'kk'].includes(name)) return 'midfielder'
  if (['szelso', 'winger', 'bsz', 'jsz'].includes(name)) return 'winger'
  if (['tamado', 'csatar', 'forward', 'striker', 'cs', 'bcs', 'jcs'].includes(name)) return 'forward'
  return null
}

export function suggestSubstitutions(plan, halves, halfIndex, position, history = [], goal = 'balanced') {
  const half = halves[halfIndex]
  const outgoing = plan.squad.find(player => String(player.id) === String(half.starters[position]))
  const required = positionGroup(position)
  if (!outgoing || !required) return []
  const lineup = quarterLineup(half)
  const onField = new Set([...Object.entries(lineup).filter(([pos]) => pos !== position).map(([, id]) => String(id)), ...Object.values(half.starters).filter(Boolean).map(String)])
  const atMinute = (halfIndex * 2 + 1) * plan.duration / 4
  const minutes = Object.fromEntries(plan.squad.map(player => [String(player.id), 0]))
  for (const segment of matchTimeline(plan, halves).segments) {
    const length = Math.max(0, Math.min(atMinute, segment.end) - segment.start)
    for (const id of new Set(Object.values(segment.lineup).filter(Boolean))) minutes[id] = (minutes[id] || 0) + length
  }
  return plan.squad.filter(player => !onField.has(String(player.id))).flatMap(player => {
    const primary = positionGroup(player.position)
    const secondary = positionGroup(player.secondaryPosition)
    // Goalkeepers and outfield players never cross roles, even through preferences.
    if (required === 'keeper' ? primary !== 'keeper' && secondary !== 'keeper' : primary === 'keeper') return []
    const fit = primary === required ? 2 : secondary === required ? 1 : 0
    if (!fit) return []
    const accepted = history.filter(item => item.position === position && String(item.in) === String(player.id)).length
    const difference = (minutes[String(outgoing.id)] || 0) - (minutes[String(player.id)] || 0)
    const score = (goal === 'balanced' ? difference * 10 + fit * 5 : fit * 100 + difference) + Math.min(accepted, 5)
    return [{ player, outgoing, score, position, fit, minutes: minutes[String(player.id)] || 0, reason: `${fit === 2 ? 'Elsődleges' : 'Másodlagos'} posztja megfelelő. Eddig ${minutes[String(player.id)] || 0} percet játszott${difference > 0 ? `, ${difference} perccel kevesebbet a lemenőnél` : ''}.${accepted ? ` Ezen a poszton ${accepted} korábbi elfogadott javaslat.` : ''}` }]
  }).sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name, 'hu')).slice(0, 3)
}
