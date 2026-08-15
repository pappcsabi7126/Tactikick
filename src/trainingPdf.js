function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function formatDate(date) {
  if (!date) return '—'

  return new Date(`${date}T12:00:00`).toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function safeFileName(value) {
  return String(value || 'edzes')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

export async function downloadTrainingPdf({
  team,
  training,
  plan = [],
  attendance,
}) {
  const teamName = team?.name || 'Csapat'
  const age = team?.age || ''
  const title = training?.title || 'Edzés'

  const totalMinutes = plan.reduce(
    (sum, item) => sum + (Number(item.duration) || 0),
    0,
  )

  const attendanceText = attendance
    ? `${attendance.present} jelen · ${attendance.absent} hiányzik · ${attendance.total} fő`
    : ''

  const exerciseMarkup = plan.length
    ? plan
        .map(
          (exercise, index) => `
            <section class="exercise">
              <div class="exercise-index">${String(index + 1).padStart(2, '0')}</div>

              <div class="exercise-card">
                <div class="exercise-top">
                  <div class="exercise-heading">
                    <div class="exercise-label">
                      ${
                        index === 0
                          ? 'BEMELEGÍTÉS'
                          : index === 1
                            ? 'FŐ GYAKORLAT'
                            : index === 2
                              ? 'FŐ GYAKORLAT'
                              : index === 3
                                ? 'JÁTÉKHELYZET'
                                : 'GYAKORLAT'
                      }
                    </div>

                    <h2>${escapeHtml(
                      exercise.name || 'Saját feladat',
                    )}</h2>
                  </div>

                  <div class="duration">
                    ${escapeHtml(exercise.duration || '0')}
                    <span>perc</span>
                  </div>
                </div>

                ${
                  exercise.description
                    ? `
                      <div class="description">
                        ${escapeHtml(exercise.description).replaceAll(
                          '\n',
                          '<br />',
                        )}
                      </div>
                    `
                    : ''
                }

                ${
                  exercise.image
                    ? `
                      <div class="image-wrap">
                        <img
                          class="exercise-image"
                          src="${escapeHtml(exercise.image)}"
                          alt="${escapeHtml(
                            exercise.name || 'Gyakorlat',
                          )}"
                        />
                      </div>
                    `
                    : ''
                }
              </div>
            </section>
          `,
        )
        .join('')
    : `
        <div class="empty-plan">
          Ehhez az edzéshez még nincs rögzített gyakorlat.
        </div>
      `

  const container = document.createElement('div')

  container.innerHTML = `
    <div class="pdf-document">

      <style>
        * {
          box-sizing: border-box;
        }

        .pdf-document {
          width: 794px;
          padding: 36px 46px 30px;
          background: #ffffff;
          color: #15171d;
          font-family:
            Inter,
            Arial,
            Helvetica,
            sans-serif;
        }

        .document-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 18px;
          border-bottom: 1px solid #e4e6eb;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-mark {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #8d24ed;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
        }

        .brand-name {
          color: #1c1f26;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .16em;
        }

        .brand-subtitle {
          margin-top: 2px;
          color: #969ca6;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: .13em;
        }

        .document-number {
          text-align: right;
        }

        .document-number span {
          display: block;
          margin-bottom: 2px;
          color: #9ba1aa;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .14em;
        }

        .document-number strong {
          color: #555c67;
          font-size: 8px;
          letter-spacing: .05em;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          gap: 35px;
          padding: 28px 0 22px;
        }

        .eyebrow,
        .section-kicker {
          color: #8d24ed;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .18em;
        }

        .hero h1 {
          margin: 6px 0 9px;
          color: #15171d;
          font-size: 29px;
          line-height: 1.05;
          letter-spacing: -.045em;
        }

        .team-line {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #606772;
          font-size: 10px;
        }

        .team-line strong {
          color: #252932;
        }

        .team-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #8d24ed;
        }

        .hero-meta {
          min-width: 205px;
          display: grid;
          gap: 12px;
          align-content: center;
          padding-left: 24px;
          border-left: 1px solid #e5e7eb;
        }

        .hero-meta span {
          display: block;
          margin-bottom: 3px;
          color: #9ba1aa;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: .13em;
        }

        .hero-meta strong {
          color: #2d323b;
          font-size: 10px;
          font-weight: 800;
        }

        .overview {
          display: flex;
          margin-bottom: 27px;
          border: 1px solid #e1e4e9;
          border-radius: 11px;
          overflow: hidden;
          background: #fafbfc;
        }

        .overview-item {
          flex: 1;
          min-height: 65px;
          padding: 13px 16px;
          border-right: 1px solid #e1e4e9;
        }

        .overview-item:last-child {
          border-right: 0;
        }

        .overview-item span {
          display: block;
          margin-bottom: 5px;
          color: #969da7;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .overview-item strong {
          color: #242830;
          font-size: 16px;
          font-weight: 900;
          letter-spacing: -.02em;
        }

        .overview-item strong small {
          color: #7f8791;
          font-size: 8px;
          font-weight: 700;
        }

        .overview-item.attendance strong {
          font-size: 10px;
          letter-spacing: 0;
        }

        .section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 13px;
        }

        .section-heading h2 {
          margin: 4px 0 0;
          color: #181b21;
          font-size: 16px;
          letter-spacing: -.02em;
        }

        .section-count {
          color: #9ba1aa;
          font-size: 7px;
          font-weight: 900;
          letter-spacing: .12em;
        }

        .exercise {
          display: grid;
          grid-template-columns: 32px 1fr;
          gap: 10px;
          margin-bottom: 10px;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .exercise-index {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 10px;
          border: 1px solid #eadcf7;
          border-radius: 50%;
          background: #faf5ff;
          color: #8d24ed;
          font-size: 7px;
          font-weight: 900;
        }

        .exercise-card {
          padding: 12px 14px 13px;
          border: 1px solid #dfe2e7;
          border-radius: 10px;
          background: #ffffff;
        }

        .exercise-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 15px;
        }

        .exercise-label {
          margin-bottom: 3px;
          color: #8d24ed;
          font-size: 6.5px;
          font-weight: 900;
          letter-spacing: .15em;
        }

        .exercise-heading h2 {
          margin: 0;
          color: #20232a;
          font-size: 14px;
          line-height: 1.2;
          letter-spacing: -.02em;
        }

        .duration {
          flex-shrink: 0;
          padding: 5px 8px;
          border-radius: 6px;
          background: #f4f5f7;
          color: #4f5661;
          font-size: 8px;
          font-weight: 900;
        }

        .duration span {
          color: #858c96;
          font-weight: 700;
        }

        .description {
          margin-top: 7px;
          color: #656c76;
          font-size: 8.5px;
          line-height: 1.45;
        }

        .image-wrap {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 9px;
          padding: 7px;
          border-radius: 7px;
          background: #fafafa;
        }

        .exercise-image {
          display: block;
          width: auto;
          max-width: 78%;
          max-height: 175px;
          border-radius: 5px;
          object-fit: contain;
        }

        .empty-plan {
          padding: 25px;
          border: 1px dashed #d9dde3;
          border-radius: 10px;
          color: #858c96;
          font-size: 9px;
          text-align: center;
        }

        .document-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 11px;
          border-top: 1px solid #e1e4e8;
          color: #9aa0a9;
          font-size: 7px;
        }

        .document-footer strong {
          margin-right: 6px;
          color: #6e7580;
          font-weight: 900;
          letter-spacing: .1em;
        }

        .footer-right {
          display: flex;
          gap: 5px;
        }

        @media print {
          .exercise {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      </style>

      <header class="document-header">
        <div class="brand">
          <div class="brand-mark">C</div>

          <div>
            <div class="brand-name">TACTIKICK</div>
            <div class="brand-subtitle">EDZÉSTERV</div>
          </div>
        </div>

        <div class="document-number">
          <span>EDZÉS</span>
          <strong>
            ${String(plan.length).padStart(2, '0')} GYAKORLAT
          </strong>
        </div>
      </header>

      <section class="hero">
        <div class="hero-main">
          <div class="eyebrow">EDZÉSTERV</div>

          <h1>${escapeHtml(title)}</h1>

          <div class="team-line">
            <span class="team-dot"></span>
            <strong>${escapeHtml(teamName)}</strong>

            ${age ? `<span>·</span><span>${escapeHtml(age)}</span>` : ''}
          </div>
        </div>

        <div class="hero-meta">
          <div>
            <span>DÁTUM</span>
            <strong>${escapeHtml(formatDate(training?.date))}</strong>
          </div>

          <div>
            <span>IDŐPONT</span>
            <strong>
              ${escapeHtml(training?.startTime || '—')} –
              ${escapeHtml(training?.endTime || '—')}
            </strong>
          </div>
        </div>
      </section>

      <section class="overview">
        <div class="overview-item">
          <span>EDZÉS HOSSZA</span>

          <strong>
            ${totalMinutes}
            <small>perc</small>
          </strong>
        </div>

        <div class="overview-item">
          <span>GYAKORLATOK</span>

          <strong>
            ${plan.length}
            <small>feladat</small>
          </strong>
        </div>

        ${
          attendanceText
            ? `
              <div class="overview-item attendance">
                <span>JELENLÉT</span>
                <strong>${escapeHtml(attendanceText)}</strong>
              </div>
            `
            : ''
        }
      </section>

      <div class="section-heading">
        <div>
          <div class="section-kicker">PROGRAM</div>
          <h2>Az edzés felépítése</h2>
        </div>

        <div class="section-count">
          ${plan.length} FELADAT
        </div>
      </div>

      <main class="exercise-list">
        ${exerciseMarkup}
      </main>

      <footer class="document-footer">
        <div>
          <strong>TACTIKICK</strong>
          <span>Edzői edzésterv</span>
        </div>

        <div class="footer-right">
          <span>${escapeHtml(teamName)}</span>
          <span>·</span>
          <span>${escapeHtml(training?.date || '')}</span>
        </div>
      </footer>

    </div>
  `

  const images = Array.from(container.querySelectorAll('img'))

  await Promise.all(
    images.map(
      (image) =>
        new Promise((resolve) => {
          if (image.complete) {
            resolve()
            return
          }

          image.onload = resolve
          image.onerror = resolve
        }),
    ),
  )

  const html2pdfModule = await import('html2pdf.js')
  const html2pdf = html2pdfModule.default || html2pdfModule

  const fileName = `${safeFileName(teamName)}-${safeFileName(
    title,
  )}-${training?.date || 'edzes'}.pdf`

  await html2pdf()
    .set({
      margin: [9, 10, 10, 10],

      filename: fileName,

      image: {
        type: 'jpeg',
        quality: 0.97,
      },

      html2canvas: {
        scale: 2.2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },

      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      },

      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.exercise'],
      },
    })
    .from(container.firstElementChild)
    .save()
}