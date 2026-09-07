import { formationRows, quarterLineup } from './matchPlan.js'

const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;')

export function matchPdfHtml({ match, plan, halves, teamName }) {
  const name = (id) => escapeHtml(plan.squad.find((player) => String(player.id) === String(id))?.name || 'Üres poszt')
  return `<div style="font-family:Arial,sans-serif;color:#173c2b;background:white;width:740px;padding:20px;box-sizing:border-box">
    ${halves.map((half, index) => `<section style="${index ? 'break-before:page;page-break-before:always;' : ''}padding:5px 0">
      <h1 style="font-size:24px;margin:0 0 8px">${escapeHtml(match.title)}</h1>
      <p style="font-size:13px">${escapeHtml(teamName)} · ${escapeHtml(match.date)} · ${escapeHtml(match.startTime)} · 4 × ${plan.duration / 4} perc</p>
      <h2 style="font-size:20px">${index + 1}. félidő · ${half.formation} · ${index * 2 + 1}–${index * 2 + 2}. negyed</h2>
      <p style="font-size:12px">Kezdés: ${index * plan.duration / 2}. perc · A kisebb név a ${(index * 2 + 1) * plan.duration / 4}. percben beálló játékos.</p>
      <div style="border:3px solid #8cbd9b;border-radius:12px;background:#25784b;padding:18px 6px">
        ${formationRows[half.formation].map((row) => `<div style="text-align:center;padding:14px 0;white-space:nowrap">${row.map((position) => `<div style="display:inline-block;vertical-align:top;width:${96 / row.length}%;box-sizing:border-box;padding:4px;white-space:normal;color:white">
          <div style="font-size:11px;margin-bottom:5px">${position}</div><div style="font-size:15px;font-weight:bold;overflow-wrap:anywhere">${name(half.starters[position])}</div>
          <div style="font-size:11px;margin-top:6px;overflow-wrap:anywhere">${half.replacements[position] ? `↳ ${name(half.replacements[position])}` : 'Marad a következő negyedre'}</div>
        </div>`).join('')}</div>`).join('')}
      </div>
      ${[half.starters, quarterLineup(half)].map((lineup, quarter) => `<div style="break-inside:avoid"><h3 style="font-size:14px;margin:16px 0 6px">${index * 2 + quarter + 1}. negyed – kispad</h3><p style="font-size:12px;line-height:1.6">${plan.squad.filter((player) => !Object.values(lineup).includes(String(player.id))).map((player) => escapeHtml(player.name)).join(' · ') || 'Nincs cserejátékos.'}</p></div>`).join('')}
      <p style="font-size:10px;margin-top:18px">TACTIKICK · Meccsterv · K: kapus; V: védő; BK/KK/JK: középpályás; CS: csatár; SZ: szélső; B/J: bal/jobb.</p>
    </section>`).join('')}
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
