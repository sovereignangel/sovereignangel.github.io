/**
 * GET /api/ventures/skills — List user's builder skills
 * POST /api/ventures/skills — Create a new builder skill
 * PUT /api/ventures/skills — Update an existing skill
 * DELETE /api/ventures/skills — Delete a skill
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { adminDb } = await import('@/lib/firebase-admin')
    const snap = await adminDb.collection('users').doc(auth.uid).collection('builder_skills')
      .orderBy('name', 'asc').get()
    const skills = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    // Also include built-in defaults that aren't in user collection
    const { DEFAULT_SKILLS } = await import('@/lib/claude-builder/default-skills')
    const userNames = new Set(skills.map(s => (s as unknown as { name: string }).name))
    const builtins = DEFAULT_SKILLS
      .filter(s => !userNames.has(s.name))
      .map(s => ({ ...s, id: `builtin-${s.name}`, builtin: true }))

    return NextResponse.json({ skills: [...skills, ...builtins] })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { name, label, category, description, systemPrompt, dependencies, techStack, filePatterns, isDefault } = body

    if (!name || !label || !systemPrompt) {
      return NextResponse.json({ error: 'Missing required fields: name, label, systemPrompt' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ref = adminDb.collection('users').doc(auth.uid).collection('builder_skills').doc()
    await ref.set({
      name: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, ''),
      label,
      category: category || 'custom',
      description: description || '',
      systemPrompt,
      dependencies: dependencies || [],
      techStack: techStack || [],
      filePatterns: filePatterns || [],
      isDefault: isDefault ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({ success: true, id: ref.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create skill' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const body = await req.json()
    const { skillId, ...updates } = body

    if (!skillId) {
      return NextResponse.json({ error: 'Missing skillId' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    const ref = adminDb.collection('users').doc(auth.uid).collection('builder_skills').doc(skillId)
    await ref.update({ ...updates, updatedAt: new Date() })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update skill' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (auth instanceof NextResponse) return auth

  try {
    const { skillId } = await req.json()

    if (!skillId) {
      return NextResponse.json({ error: 'Missing skillId' }, { status: 400 })
    }

    const { adminDb } = await import('@/lib/firebase-admin')
    await adminDb.collection('users').doc(auth.uid).collection('builder_skills').doc(skillId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete skill' },
      { status: 500 }
    )
  }
}
