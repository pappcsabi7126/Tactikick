import { formationRows } from './matchPlan.js'

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

export function matchPdfHtml({ match, plan, halves, teamName, teamAge }) {
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
