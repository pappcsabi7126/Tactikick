const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const fallback = (body: any) => ({
  title: `${body.objective || 'Edzés'} – ${body.team?.name || 'Edzés'}`,
  duration: Number(body.duration) || 90,
  objective: body.objective || 'Labdakihozatal',
  intensity: body.intensity || 'Közepes',
  players: Number(body.team?.players || 0),
  age: body.team?.age || '',
  exercises: [],
  source: 'edge-fallback',
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ training: fallback(body), configured: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const model = Deno.env.get('OPENAI_MODEL') || 'gpt-5-mini'
    const prompt = `Készíts futballedzést magyarul. Csak JSON-t adj vissza az alábbi struktúrában:
{"title":"string","duration":number,"objective":"string","intensity":"string","players":number,"age":"string","exercises":[{"name":"string","duration":number,"description":"string"}]}
A teljes gyakorlatidő pontosan egyezzen a duration értékkel. Legyen benne bemelegítés, fő rész és játék/levezetés. Legyen korosztályhoz és játékosszámhoz igazított.
Csapat: ${JSON.stringify(body.team || {})}
Időtartam: ${body.duration}
Cél: ${body.objective}
Intenzitás: ${body.intensity}
Extra kérés: ${body.extraRequest || 'nincs'}`

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenAI API ${response.status}: ${text}`)
    }

    const result = await response.json()
    const text = result.output_text || result.output?.flatMap((item: any) => item.content || []).find((item: any) => item.type === 'output_text')?.text
    if (!text) throw new Error('Az AI nem adott vissza értelmezhető választ.')

    const training = JSON.parse(text)
    return new Response(JSON.stringify({ training, configured: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'AI hiba' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
