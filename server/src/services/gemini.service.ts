import { GoogleGenAI } from '@google/genai'

export async function generateAISummary(
  statistics: object
) {

  if (
    process.env.AI_SUMMARY_ENABLED !== 'true' ||
    process.env.AI_DEMO_ONLY !== 'true'
  ) {
    throw new Error('Demo AI service is disabled')
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('Gemini API key is missing')
  }

  const model =
    process.env.GEMINI_MODEL ||
    'gemini-3.1-flash-lite'

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({

    model,

    contents: JSON.stringify(statistics),

    config: {

      systemInstruction: `
You are the reporting assistant for MediConnect,
an experimental patient monitoring prototype.

The input contains statistics from fictional
demonstration records.

Generate a concise descriptive summary using
only the supplied data.

Use these sections:

1. Monitoring overview
2. Recorded vital measurements
3. Doctor-defined target comparison
4. Self-reported medication intake
5. Recorded health alerts
6. Data limitations and clinician review points

Rules:
- Never invent measurements or missing information.
- Preserve the supplied numerical values.
- Do not diagnose diseases.
- Do not recommend medication or dosage changes.
- Do not claim that treatment is effective.
- Do not classify the patient as medically safe.
- Acknowledge unavailable measurements.
- Temperature is experimental sensor temperature,
  not validated core body temperature.
- Explain that measurements are periodic snapshots.
- Medication intake is self-reported.
- Keep the response under 350 words.
- Use plain text.
- End with: Requires review by the treating doctor.
      `,

      temperature: 0.2,
      maxOutputTokens: 1800,
    },
  })

  const content = response.text?.trim()

  if (!content || content.length > 10000) {
    throw new Error('Invalid AI response')
  }

  return {
    content,
    model,
  }
}