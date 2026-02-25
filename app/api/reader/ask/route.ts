import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { verifyAuth } from '@/lib/api-auth'

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { question, context, documentTitle } = await req.json()

    if (!question || !context) {
      return NextResponse.json({ error: 'Missing question or context' }, { status: 400 })
    }

    const prompt = `You are a research assistant helping analyze an academic document.

Document: "${documentTitle || 'Unknown'}"

The user is reading this section of the document:
---
${context.slice(0, 6000)}
---

User's question: ${question}

Provide a clear, concise answer based on the document content above. If the answer requires information not present in the provided context, say so. Reference specific parts of the text when relevant. Keep the response under 300 words.`

    const answer = await callLLM(prompt, { temperature: 0.2, maxTokens: 2000 })

    return NextResponse.json({ answer })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to process question' },
      { status: 500 }
    )
  }
}
