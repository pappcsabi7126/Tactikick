function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function safeFileName(value) {
  return String(value || 'jelenlet')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function statusSymbol(status) {
  if (status === 'absent') return '×'
  if (status === 'excused') return '◷'
  return '✓'
}

function formatDate(date) {
  if (!date) return '—'
  return new Date(`${date}T12:00:00`).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export async function downloadAttendancePdf({
  teamName,
  monthName,
  monthTrainings = [],
  visiblePlayers = [],
  allTeams = [],
  selectedTeamId = null,
}) {
  const html2pdfModule = await import('html2pdf.js')
  const html2pdf = html2pdfModule.default || html2pdfModule

  const includeTeam = selectedTeamId === null
  const teamById = new Map(allTeams.map((team) => [team.id, team]))

  // PDF: hónap eleje balra, hónap vége jobbra.
  const trainingColumns = monthTrainings
    .slice()
    .sort((a, b) => `${a.date || ''}T${a.startTime || ''}`.localeCompare(`${b.date || ''}T${b.startTime || ''}`))

  const playerRows = visiblePlayers
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'hu-HU', { sensitivity: 'base', numeric: true }))
    .map((player) => {
      const cells = trainingColumns.map((training) => {
        const status = training.attendance?.[player.id] || 'present'
        return `<td class="status status-${escapeHtml(status)}">${statusSymbol(status)}</td>`
      }).join('')

      let present = 0
      let absent = 0
      trainingColumns.forEach((training) => {
        const status = training.attendance?.[player.id] || 'present'
        if (status === 'present') present += 1
        if (status === 'absent') absent += 1
      })
      const counted = present + absent
      const percentage = counted ? Math.round((present / counted) * 100) : 0
      const team = teamById.get(player.teamId)

      return `
        <tr>
          <td class="player"><strong>${escapeHtml(player.name)}</strong></td>
          ${includeTeam ? `<td>${escapeHtml(team?.name || '—')}</td>` : ''}
          ${cells}
          <td class="total"><strong>${percentage}%</strong><span>${present}/${counted || trainingColumns.length}</span></td>
        </tr>
      `
    }).join('')

  const headerCells = trainingColumns.map((training) => `
    <th>
      <strong>${escapeHtml(formatDate(training.date).slice(0, 5))}</strong>
      <span>${escapeHtml(training.startTime || '—')}</span>
    </th>
  `).join('')

  const container = document.createElement('div')
  container.innerHTML = `
    <div class="attendance-pdf-document">
      <style>
        .attendance-pdf-document { font-family: Arial, Helvetica, sans-serif; color:#182019; background:#fff; padding:22px; width:1000px; box-sizing:border-box; }
        .attendance-pdf-document h1 { margin:0 0 5px; font-size:26px; }
        .attendance-pdf-document .meta { color:#667168; font-size:12px; margin-bottom:20px; }
        .attendance-pdf-document .legend { font-size:10px; color:#68736b; margin:0 0 14px; }
        .attendance-pdf-document table { width:100%; border-collapse:collapse; table-layout:fixed; }
        .attendance-pdf-document th, .attendance-pdf-document td { border:1px solid #dce3dd; padding:6px 4px; text-align:center; font-size:8.5px; }
        .attendance-pdf-document th { background:#f1f5f2; height:38px; }
        .attendance-pdf-document th strong, .attendance-pdf-document th span { display:block; }
        .attendance-pdf-document th span { margin-top:3px; color:#667168; font-weight:400; }
        .attendance-pdf-document th:first-child, .attendance-pdf-document td.player { width:145px; text-align:left; }
        .attendance-pdf-document th:nth-child(2), .attendance-pdf-document td:nth-child(2) { width:95px; }
        .attendance-pdf-document td.player strong { font-size:9px; }
        .attendance-pdf-document td.status { font-size:13px; font-weight:800; }
        .attendance-pdf-document td.status-absent { color:#dc3f49; }
        .attendance-pdf-document td.status-excused { color:#a06b00; }
        .attendance-pdf-document td.status-present { color:#21864b; }
        .attendance-pdf-document td.total { width:55px; }
        .attendance-pdf-document td.total strong, .attendance-pdf-document td.total span { display:block; }
        .attendance-pdf-document td.total span { color:#6a756d; margin-top:2px; }
        .attendance-pdf-document .footer { margin-top:15px; font-size:9px; color:#788279; }
      </style>
      <h1>Jelenléti ív</h1>
      <div class="meta">${escapeHtml(teamName)} · ${escapeHtml(monthName)}</div>
      <div class="legend">✓ jelen · × hiányzik · ◷ igazolt</div>
      <table>
        <thead>
          <tr>
            <th>Játékos</th>
            ${includeTeam ? '<th>Csapat</th>' : ''}
            ${headerCells}
            <th>Jelenlét</th>
          </tr>
        </thead>
        <tbody>${playerRows || '<tr><td colspan="20">Nincs rögzített adat.</td></tr>'}</tbody>
      </table>
      <div class="footer">A dokumentum a CoachOS aktuális havi jelenléti adataiból készült.</div>
    </div>
  `

  document.body.appendChild(container)

  try {
    await html2pdf().set({
      margin: [8, 8, 8, 8],
      filename: `${safeFileName(teamName)}-jelenleti-iv-${safeFileName(monthName)}.pdf`,
      image: { type: 'jpeg', quality: 0.96 },
      html2canvas: { scale: 1.6, backgroundColor: '#ffffff', logging: false, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape', compress: true },
      pagebreak: { mode: ['css', 'legacy'] },
    }).from(container.firstElementChild).save()
  } finally {
    container.remove()
  }
}
