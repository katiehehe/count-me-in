import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'
import OpenAI from 'openai'

/**
 * Server-side proxy for AI Challenge Mode. The OpenAI API key is a real secret,
 * so it lives only here (set via `firebase functions:secrets:set OPENAI_API_KEY`)
 * and is never shipped to the browser. The client sends a grounded prompt + an
 * action; this function runs OpenAI with the matching strict JSON schema and
 * returns typed structured output.
 */

const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY')

const MODEL = 'gpt-4o'

// OpenAI Structured Outputs (strict) require every property to be listed in
// `required` and `additionalProperties: false`. Optional fields are expressed as
// nullable types instead of being omitted.
const questionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['question', 'expectedConcepts', 'feedbackStyle', 'companionMessage'],
  properties: {
    question: { type: 'string' },
    expectedConcepts: { type: 'array', items: { type: 'string' } },
    feedbackStyle: { type: 'string', enum: ['encouraging', 'corrective', 'socratic'] },
    companionMessage: { type: 'string' },
  },
}

const evaluationSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'understanding',
    'feedback',
    'followUpQuestion',
    'misconceptionDetected',
    'recommendedNextAction',
    'xpAwarded',
  ],
  properties: {
    understanding: { type: 'string', enum: ['strong', 'developing', 'needs_review'] },
    feedback: { type: 'string' },
    followUpQuestion: { type: ['string', 'null'] },
    misconceptionDetected: { type: ['string', 'null'] },
    recommendedNextAction: {
      type: 'string',
      enum: ['continue', 'review_lesson', 'try_practice'],
    },
    xpAwarded: { type: 'integer' },
  },
}

const shiftSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['companionMessage'],
  properties: {
    companionMessage: { type: 'string' },
  },
}

const SCHEMAS: Record<string, Record<string, unknown>> = {
  question: questionSchema,
  evaluate: evaluationSchema,
  shift: shiftSchema,
}

export const challengeAi = onCall(
  { secrets: [OPENAI_API_KEY], maxInstances: 10 },
  async (request) => {
    // Auth-gated: only signed-in learners can spend the project's OpenAI budget.
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be signed in to use Challenge Mode.')
    }

    const data = (request.data ?? {}) as { action?: string; prompt?: string }
    const action = data.action ?? ''
    const prompt = data.prompt ?? ''
    const schema = SCHEMAS[action]

    if (!schema) {
      throw new HttpsError('invalid-argument', `Unknown action: ${action}`)
    }
    if (!prompt || prompt.length > 8000) {
      throw new HttpsError('invalid-argument', 'Missing or oversized prompt.')
    }

    const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() })
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a structured tutoring assistant for a counting & probability app. ' +
              'Always reply with JSON that matches the provided schema, and never include ' +
              'any text outside the JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: { name: action, schema, strict: true },
        },
        temperature: 0.6,
        max_tokens: 1024,
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new HttpsError('internal', 'Empty response from the model.')
      }
      return JSON.parse(content)
    } catch (err) {
      if (err instanceof HttpsError) throw err
      console.error('OpenAI request failed:', err)
      throw new HttpsError('internal', 'AI request failed.')
    }
  },
)
