const OBJECTIVE_LIBRARY = {
  Labdakihozatal: [
    ['Dinamikus bemelegítés labdával', 12, 'Labdás koordináció, orientáció és fokozatos intenzitás.'],
    ['Rondo 4v2', 15, 'Gyors labdajáratás, testhelyzet és folyamatos támogatás.'],
    ['4v3 labdakihozatal', 20, 'Hátulról történő építkezés, szélesség és harmadik ember keresése.'],
    ['Pozíciós játék 6v4', 18, 'Labdakihozatal nyomás alatt, folyamatos újraindítással.'],
    ['8v8 kisjáték', 20, 'A labdakihozatal elveinek alkalmazása játékhelyzetben.'],
    ['Levezetés és mobilizáció', 5, 'Könnyű mozgás, légzés és mobilizáció.'],
  ],
  Labdabirtoklás: [
    ['Labdás bemelegítés', 12, 'Első érintés, passz és mozgás fokozatos intenzitással.'],
    ['Rondo 4v2', 15, 'Gyors passzok, támogatási szögek és döntéshozatal.'],
    ['Pozíciós játék 5v3', 20, 'Üres területek felismerése és folyamatos labdabirtoklás.'],
    ['Játékhelyzet 6v6+2', 18, 'Labdabirtoklás létszámfölényben és átmenetek.'],
    ['8v8 kisjáték', 20, 'Labdabirtoklás megtartása mérkőzésszerű környezetben.'],
    ['Levezetés', 5, 'Könnyű mozgás és mobilizáció.'],
  ],
  Presszing: [
    ['Aktiváló bemelegítés', 12, 'Gyors lábmunka, reakció és irányváltás labdával.'],
    ['Rondo presszinggel', 15, 'Azonnali visszatámadás labdavesztés után.'],
    ['Presszing 4v4+3', 20, 'Presszingtrigger felismerése és együttmozgás.'],
    ['Magas letámadás 6v6', 18, 'Vonalak közötti távolság és labda felé történő tolódás.'],
    ['Kisjáték presszingpontokkal', 20, 'Mérkőzésszerű presszing és átmenetek.'],
    ['Levezetés', 5, 'Laza futás és mobilizáció.'],
  ],
  'Támadásépítés': [
    ['Technikai bemelegítés', 12, 'Passz, első érintés és mozgás labda után.'],
    ['Passzkapcsolatok háromszögben', 15, 'Helyezkedés, harmadik ember és időzített mozgás.'],
    ['Támadásépítés 5v4', 20, 'Szélesség, mélység és progresszív passzok.'],
    ['Befejezés előkészítéssel', 18, 'Támadásépítésből kialakított helyzetek befejezése.'],
    ['8v8 kisjáték', 20, 'Támadóelvek alkalmazása folyamatos játékban.'],
    ['Levezetés', 5, 'Könnyű labdás mozgás és mobilizáció.'],
  ],
  Védekezés: [
    ['Védekező aktiválás', 12, 'Lábmunka, testhelyzet és irányváltás.'],
    ['1v1 védekezés', 15, 'Távolságtartás, terelés és szerelési időzítés.'],
    ['2v2 védekezés', 20, 'Biztosítás, kommunikáció és együttmozgás.'],
    ['Védekezési vonal 5v5', 18, 'Tolódás, mélységi biztosítás és kompakt védekezés.'],
    ['8v8 játék védekező célokkal', 20, 'Védekezési elvek alkalmazása mérkőzésszerűen.'],
    ['Levezetés', 5, 'Laza mozgás és mobilizáció.'],
  ],
  Átmenetek: [
    ['Reakciós bemelegítés', 12, 'Gyors döntés és irányváltás labdával.'],
    ['Labdavesztés utáni visszatámadás', 15, 'Az első 5 másodpercben történő reakció és nyomás.'],
    ['Átmenet 4v3', 20, 'Labdaszerzés után gyors támadás, labdavesztés után kompakt visszarendeződés.'],
    ['Átmeneti játék 6v6', 18, 'Folyamatos váltás támadás és védekezés között.'],
    ['Kisjáték átmeneti szabályokkal', 20, 'Mérkőzésszerű döntéshozatal és gyors reakció.'],
    ['Levezetés', 5, 'Könnyű mozgás és mobilizáció.'],
  ],
  'Technikai képzés': [
    ['Labdás koordináció', 12, 'Koordináció, labdaérintések és ritmusváltás.'],
    ['Passz és első érintés', 15, 'Passzpontosság, testhelyzet és első érintés.'],
    ['1v1 technikai párharc', 20, 'Cselezés, irányváltás és labdavédelem.'],
    ['Technikai kisjáték', 18, 'Technikai elemek alkalmazása döntési helyzetben.'],
    ['8v8 szabad játék', 20, 'A tanult technikai elemek alkalmazása játékban.'],
    ['Levezetés', 5, 'Könnyű mozgás és nyújtás.'],
  ],
}

const FALLBACK_OBJECTIVE = OBJECTIVE_LIBRARY.Labdakihozatal

function normalizeIntensity(value) {
  const text = String(value || '').toLowerCase()
  if (text.includes('magas') || text.includes('high')) return 'Magas'
  if (text.includes('alacsony') || text.includes('easy') || text.includes('low')) return 'Alacsony'
  return 'Közepes'
}

function parseExtraRequest(text) {
  const value = String(text || '').toLowerCase()
  return {
    moreSmallGames: /kisjáték|small game|game/.test(value),
    lowWaiting: /kevés várakozás|kevés pihenő|low waiting|continuous/.test(value),
    moreBall: /labdás|labdával|ball/.test(value),
    finishing: /befejez|kapura|finishing|shoot/.test(value),
    oneVOne: /1v1|egy az egy/.test(value),
  }
}

function scaleDurations(items, total) {
  if (!items.length) return []
  const safeTotal = Math.max(30, Number(total) || 90)
  const base = items.map((item) => Math.max(4, Number(item[1]) || 10))
  const baseSum = base.reduce((sum, value) => sum + value, 0)
  const scaled = base.map((value) => Math.max(4, Math.round((value / baseSum) * safeTotal)))
  let diff = safeTotal - scaled.reduce((sum, value) => sum + value, 0)
  let index = scaled.length - 1
  while (diff !== 0 && scaled.length) {
    if (diff > 0) {
      scaled[index] += 1
      diff -= 1
    } else if (scaled[index] > 4) {
      scaled[index] -= 1
      diff += 1
    }
    index = index <= 0 ? scaled.length - 1 : index - 1
  }
  return items.map((item, itemIndex) => ({
    name: item[0],
    duration: scaled[itemIndex],
    description: item[2],
  }))
}

export function generateSmartTraining({ team, duration = 90, objective = 'Labdakihozatal', intensity = 'Közepes', extraRequest = '' }) {
  const settings = {
    duration: Number(duration) || 90,
    objective: objective || 'Labdakihozatal',
    intensity: normalizeIntensity(intensity),
    extraRequest: String(extraRequest || '').trim(),
  }

  const request = parseExtraRequest(settings.extraRequest)
  let source = OBJECTIVE_LIBRARY[settings.objective] || FALLBACK_OBJECTIVE
  let items = [...source]

  if (request.moreSmallGames) {
    const game = items.find((item) => /kisjáték|játék/i.test(item[0]))
    if (game) items = [...items.filter((item) => item !== game), game]
  }

  if (request.finishing) {
    items = items.map((item) =>
      item[0] === 'Levezetés' ? item : [item[0], item[1], `${item[2]} A végrehajtás után legyen gyors kapura játék vagy befejezési opció.`],
    )
  }

  if (request.oneVOne) {
    const one = ['1v1 szituációs párharc', 15, '1v1 döntések, testcselek és védekező távolság gyakorlása.']
    items.splice(Math.max(1, items.length - 2), 0, one)
  }

  if (settings.intensity === 'Alacsony') {
    items = items.map((item) => [item[0], item[1], `${item[2]} Alacsonyabb tempóval, több technikai korrekcióval.`])
  } else if (settings.intensity === 'Magas') {
    items = items.map((item) => [item[0], item[1], `${item[2]} Magas tempóval, rövid megszakításokkal és gyors újraindítással.`])
  }

  if (request.lowWaiting) {
    items = items.map((item) => [item[0], item[1], `${item[2]} A szervezés legyen párhuzamos és folyamatos, hogy kevés legyen a várakozás.`])
  }

  const exercises = scaleDurations(items, settings.duration)
  return {
    title: `${settings.objective} – ${team?.name || 'Edzés'}`,
    duration: settings.duration,
    objective: settings.objective,
    intensity: settings.intensity,
    players: Number(team?.players || 0),
    age: team?.age || '',
    extraRequest: settings.extraRequest,
    exercises,
    generatedAt: new Date().toISOString(),
    source: 'smart-fallback',
  }
}
