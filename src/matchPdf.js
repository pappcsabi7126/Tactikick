import { formationRows, matchRoles, matchTimeline, playingMinutes, getMatchFormat } from './matchPlan.js'

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

export function matchPdfHtml({ match, plan, halves, teamName, teamAge, full = false }) {
  if (full) {
    const minutes = playingMinutes(plan, halves)
    const timeline = matchTimeline(plan, halves)
    const name = id => escapeHtml(plan.squad.find(player => String(player.id) === String(id))?.name || 'Üres poszt')
    return `<div style="font-family:Arial,sans-serif;color:#173c2b;background:white;width:740px;padding:20px;box-sizing:border-box">
      <h1>${escapeHtml(match.title)}</h1><p>${escapeHtml(teamName)} · ${escapeHtml(teamAge)} · ${escapeHtml(match.date)} · ${escapeHtml(match.startTime)} · ${getMatchFormat(plan)} · ${plan.duration} perc</p>
      ${halves.map((half, index) => `<section style="break-inside:avoid"><h2>${index + 1}. félidő · ${half.formation}</h2>${matchPdfHtml({ match: { ...match, title: '' }, plan, halves: [half], teamName: '', teamAge: '' }).replace('width:740px;padding:20px', 'width:100%;padding:0')}</section>`).join('')}
      <h2>Időzített összeállítások</h2>${timeline.segments.map(segment => `<p style="break-inside:avoid"><strong>${segment.start}–${segment.end}. perc</strong><br>${Object.entries(segment.lineup).map(([position, id]) => `${position}: ${name(id)}`).join(' · ')}</p>`).join('')}
      <h2>Tervezett játékpercek</h2><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Játékos</th><th>Pályán</th><th>Kispadon</th></tr></thead><tbody>${plan.squad.map(player => `<tr><td style="padding:8px;border-bottom:1px solid #dce4df">${escapeHtml(player.name)}</td><td align="center">${minutes[String(player.id)] || 0} perc</td><td align="center">${plan.duration - (minutes[String(player.id)] || 0)} perc</td></tr>`).join('')}</tbody></table>
    </div>`
  }
  const half = halves[0]
  const starters = new Set(Object.values(half.starters).map(String))
  const bench = plan.squad.filter((player) => !starters.has(String(player.id))).sort((a, b) => a.name.localeCompare(b.name, 'hu'))
  const name = (id) => escapeHtml(plan.squad.find((player) => String(player.id) === String(id))?.name || '')
  return `<div style="font-family:Arial,sans-serif;color:#173c2b;background:white;width:740px;padding:20px;box-sizing:border-box">
    <h1 style="font-size:24px;margin:0 0 8px">${escapeHtml(match.title)}</h1>
    <p style="font-size:13px;margin:0 0 24px">${escapeHtml(teamAge || teamName)} · ${escapeHtml(match.date)}</p>
    <div style="border:3px solid #8cbd9b;border-radius:12px;background:#25784b;padding:24px 6px;break-inside:avoid">
      ${formationRows[half.formation].map((row) => `<div style="text-align:center;padding:20px 0;white-space:nowrap">${row.map((position) => `<div style="display:inline-block;vertical-align:top;width:${96 / row.length}%;box-sizing:border-box;padding:4px;white-space:normal;color:white">
        <div style="font-size:11px;margin-bottom:5px">${position}</div>
        <div style="font-size:16px;font-weight:bold;overflow-wrap:anywhere">${name(half.starters[position])}</div>
        <div style="font-size:12px;min-height:15px;margin-top:6px;overflow-wrap:anywhere">${half.starters[position] && half.replacements[position] ? name(half.replacements[position]) : ''}</div>
      </div>`).join('')}</div>`).join('')}
    </div>
    <div style="break-inside:avoid"><h2 style="font-size:16px;margin:22px 0 10px">Cserék</h2><p style="font-size:13px;line-height:1.8;margin:0">${bench.map((player) => escapeHtml(player.name)).join(' · ')}</p></div>
    ${matchRoles.some(([key]) => name(plan.roles?.[key])) ? `<div style="break-inside:avoid;border-top:2px solid #8cbd9b;margin-top:18px;padding-top:12px"><h2 style="font-size:16px;margin:0 0 8px">Csapatkapitány és pontrúgások</h2>${matchRoles.filter(([key]) => name(plan.roles?.[key])).map(([key, label]) => `<div style="font-size:13px;line-height:1.6;overflow-wrap:anywhere"><span>${escapeHtml(label)}:</span> <strong>${name(plan.roles[key])}</strong></div>`).join('')}</div>` : ''}
  </div>`
}

export async function downloadMatchPdf(data) {
  const { default: html2pdf } = await import('html2pdf.js')
  const container = document.createElement('div')
  container.innerHTML = matchPdfHtml(data)
  document.body.appendChild(container)
  const filename = `${data.match.title}-${data.match.date}-meccsterv`.replace(/[^\p{L}\p{N}_-]+/gu, '-').slice(0, 120)
  try {
    await document.fonts.ready
    await html2pdf().set({ filename: `${filename}.pdf`, margin: 8, image: { type: 'jpeg', quality: .98 }, html2canvas: { scale: 2, backgroundColor: '#ffffff', logging: false }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['css', 'legacy'] } }).from(container.firstElementChild).save()
  } finally { container.remove() }
}
