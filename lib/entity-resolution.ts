/**
 * Entity Resolution Engine
 *
 * Three-tier cascade for matching extracted names to canonical contacts:
 *   Tier 1: Exact normalized match (canonical name + aliases) — zero cost
 *   Tier 2: Jaro-Winkler fuzzy match, threshold ≥0.92 — zero cost
 *   Tier 3: LLM disambiguation for ambiguous cases — uses callLLM()
 *   Fallback: Create new contact, flag needsReview if close candidates exist
 */

import type { UnifiedContact, ResolutionResult, ContactAlias, ContactInteraction } from './types'
import {
  getAllUnifiedContacts,
  saveUnifiedContact,
  addAliasToContact,
  addInteractionToContact,
} from './firestore'
import { callLLM } from './llm'

// ─── NAME NORMALIZATION ──────────────────────────────────────────────

const TITLE_PREFIXES = /^(dr|mr|mrs|ms|prof|sir|rev|hon)\.?\s+/i
const PARENTHETICAL = /\s*\(.*?\)\s*/g
const SUFFIXES = /,?\s+(jr|sr|ii|iii|iv|esq|phd|md)\.?$/i

export function normalizeName(name: string): string {
  return name
    .trim()
    .replace(TITLE_PREFIXES, '')
    .replace(PARENTHETICAL, ' ')
    .replace(SUFFIXES, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

// ─── JARO-WINKLER SIMILARITY ────────────────────────────────────────

/**
 * Jaro-Winkler string similarity — returns 0-1 where 1 is exact match.
 * Weights common prefix up to 4 chars (good for names like "John"/"John S.")
 */
export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1

  const len1 = s1.length
  const len2 = s2.length
  if (len1 === 0 || len2 === 0) return 0

  const matchWindow = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0)
  const s1Matches = new Array(len1).fill(false)
  const s2Matches = new Array(len2).fill(false)

  let matches = 0
  let transpositions = 0

  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow)
    const end = Math.min(i + matchWindow + 1, len2)
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue
      s1Matches[i] = true
      s2Matches[j] = true
      matches++
      break
    }
  }

  if (matches === 0) return 0

  let k = 0
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue
    while (!s2Matches[k]) k++
    if (s1[i] !== s2[k]) transpositions++
    k++
  }

  const jaro = (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3

  // Winkler modification: boost score for common prefix (up to 4 chars)
  let prefix = 0
  for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
    if (s1[i] === s2[i]) prefix++
    else break
  }

  return jaro + prefix * 0.1 * (1 - jaro)
}

// ─── INITIAL MATCH (checks if first initial matches full first name) ──

function initialMatchScore(extracted: string, canonical: string): number {
  const eParts = extracted.split(/\s+/)
  const cParts = canonical.split(/\s+/)

  // "S. Chen" vs "sarah chen" — check first initial + last name exact
  if (eParts.length >= 2 && cParts.length >= 2) {
    const eFirst = eParts[0].replace('.', '')
    const cFirst = cParts[0]
    const eRest = eParts.slice(1).join(' ')
    const cRest = cParts.slice(1).join(' ')

    if (eFirst.length === 1 && cFirst.startsWith(eFirst) && eRest === cRest) {
      return 0.95
    }
    if (cFirst.length === 1 && eFirst.startsWith(cFirst) && eRest === cRest) {
      return 0.95
    }
  }

  return 0
}

// ─── TIER 1: EXACT MATCH ─────────────────────────────────────────────

function findExactMatch(
  normalizedName: string,
  contacts: UnifiedContact[]
): UnifiedContact | null {
  return contacts.find(c =>
    c.normalizedName === normalizedName
    || c.aliases?.some(a => a.normalizedName === normalizedName)
  ) ?? null
}

// ─── TIER 2: FUZZY MATCH ─────────────────────────────────────────────

interface FuzzyCandidate {
  contact: UnifiedContact
  score: number
}

const FUZZY_AUTO_THRESHOLD = 0.92
const FUZZY_REVIEW_THRESHOLD = 0.80

function findFuzzyMatches(
  normalizedName: string,
  contacts: UnifiedContact[]
): FuzzyCandidate[] {
  const candidates: FuzzyCandidate[] = []

  for (const contact of contacts) {
    // Check canonical name
    let bestScore = jaroWinkler(normalizedName, contact.normalizedName)

    // Check initial match pattern
    const initScore = initialMatchScore(normalizedName, contact.normalizedName)
    if (initScore > bestScore) bestScore = initScore

    // Check all aliases
    for (const alias of contact.aliases || []) {
      const aliasScore = jaroWinkler(normalizedName, alias.normalizedName)
      if (aliasScore > bestScore) bestScore = aliasScore
      const aliasInitScore = initialMatchScore(normalizedName, alias.normalizedName)
      if (aliasInitScore > bestScore) bestScore = aliasInitScore
    }

    if (bestScore >= FUZZY_REVIEW_THRESHOLD) {
      candidates.push({ contact, score: bestScore })
    }
  }

  return candidates.sort((a, b) => b.score - a.score)
}

// ─── TIER 3: LLM DISAMBIGUATION ──────────────────────────────────────

async function llmDisambiguate(
  extractedName: string,
  context: string,
  candidates: FuzzyCandidate[]
): Promise<{ contactId: string; confidence: number } | null> {
  const candidateDescriptions = candidates.map((c, i) => {
    const topics = c.contact.topics?.slice(0, 5).join(', ') || 'none'
    const company = c.contact.company || 'unknown'
    const role = c.contact.role || 'unknown'
    return `${i + 1}. "${c.contact.canonicalName}" (${role} at ${company}, topics: ${topics}, match score: ${c.score.toFixed(2)})`
  }).join('\n')

  const prompt = `You are resolving a person's identity from a text mention.

Extracted name: "${extractedName}"
Context: "${context.slice(0, 500)}"

Candidate contacts:
${candidateDescriptions}

Which candidate (if any) is this person? Reply with ONLY a JSON object:
{"match": <number 1-${candidates.length} or 0 if none match>, "confidence": <0.0-1.0>}

If the name clearly refers to one candidate, match it. If unsure, return 0.`

  try {
    const response = await callLLM(prompt, { temperature: 0.1, maxTokens: 100 })
    const cleaned = response.replace(/```json\n?|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (parsed.match > 0 && parsed.match <= candidates.length && parsed.confidence > 0.6) {
      return {
        contactId: candidates[parsed.match - 1].contact.id!,
        confidence: parsed.confidence,
      }
    }
  } catch {
    // LLM failed — fall through to create new
  }

  return null
}

// ─── MAIN RESOLUTION FUNCTION ─────────────────────────────────────────

export async function resolveContact(
  uid: string,
  extractedName: string,
  context: string,
  source: 'journal' | 'transcript' | 'note' | 'screenshot' | 'manual',
  date: string,
  allContacts?: UnifiedContact[]
): Promise<ResolutionResult> {
  const normalized = normalizeName(extractedName)
  if (!normalized) {
    throw new Error(`Cannot resolve empty name: "${extractedName}"`)
  }

  const contacts = allContacts ?? await getAllUnifiedContacts(uid)

  // Tier 1: Exact match on canonical name or alias
  const exactMatch = findExactMatch(normalized, contacts)
  if (exactMatch) {
    // Add alias if the raw form is new
    if (normalized !== exactMatch.normalizedName
        && !exactMatch.aliases?.some(a => a.normalizedName === normalized)) {
      await addAliasToContact(uid, exactMatch.id!, {
        name: extractedName.trim(),
        normalizedName: normalized,
        source,
        addedAt: date,
      })
    }
    return { contact: exactMatch, contactId: exactMatch.id!, method: 'exact', confidence: 1.0, isNew: false }
  }

  // Tier 2: Fuzzy match
  const fuzzyCandidates = findFuzzyMatches(normalized, contacts)

  if (fuzzyCandidates.length > 0) {
    const best = fuzzyCandidates[0]

    // Auto-match if high confidence and only one strong candidate
    if (best.score >= FUZZY_AUTO_THRESHOLD) {
      const secondBest = fuzzyCandidates[1]
      if (!secondBest || secondBest.score < FUZZY_REVIEW_THRESHOLD) {
        // Clear winner — auto-match and add alias
        await addAliasToContact(uid, best.contact.id!, {
          name: extractedName.trim(),
          normalizedName: normalized,
          source,
          addedAt: date,
        })
        return {
          contact: best.contact,
          contactId: best.contact.id!,
          method: 'fuzzy',
          confidence: best.score,
          isNew: false,
        }
      }
    }

    // Tier 3: LLM disambiguation for ambiguous cases
    if (fuzzyCandidates.length >= 1 && fuzzyCandidates[0].score >= FUZZY_REVIEW_THRESHOLD) {
      const llmResult = await llmDisambiguate(extractedName, context, fuzzyCandidates.slice(0, 5))
      if (llmResult) {
        const matched = contacts.find(c => c.id === llmResult.contactId)
        if (matched) {
          await addAliasToContact(uid, matched.id!, {
            name: extractedName.trim(),
            normalizedName: normalized,
            source,
            addedAt: date,
          })
          return {
            contact: matched,
            contactId: matched.id!,
            method: 'llm',
            confidence: llmResult.confidence,
            isNew: false,
          }
        }
      }
    }
  }

  // Fallback: Create new contact
  const hasCloseCandidates = fuzzyCandidates.some(c => c.score >= FUZZY_REVIEW_THRESHOLD)
  const newContact: Partial<UnifiedContact> = {
    canonicalName: extractedName.trim(),
    normalizedName: normalized,
    aliases: [],
    tier: 'acquaintance',
    relationshipStrength: 1,
    trustStage: 1 as const,
    isTop30: false,
    connectedTo: [],
    warmIntrosGenerated: 0,
    touchCount: 1,
    lastTouchDate: date,
    interactions: [],
    interactionCount: 0,
    topics: [],
    painPoints: [],
    thesisPillars: [],
    nextAction: '',
    whatTheyControl: '',
    yourValueToThem: '',
    needsReview: hasCloseCandidates,
  }

  const contactId = await saveUnifiedContact(uid, newContact)
  const savedContact = { ...newContact, id: contactId } as UnifiedContact

  return {
    contact: savedContact,
    contactId,
    method: 'new',
    confidence: hasCloseCandidates ? 0.5 : 1.0,
    isNew: true,
  }
}

// ─── BATCH RESOLUTION (for processing multiple names from one text) ────

export async function resolveContactsBatch(
  uid: string,
  names: { name: string; context: string }[],
  source: 'journal' | 'transcript' | 'note' | 'screenshot' | 'manual',
  date: string
): Promise<ResolutionResult[]> {
  // Load contacts once for the batch
  let allContacts = await getAllUnifiedContacts(uid)
  const results: ResolutionResult[] = []

  for (const { name, context } of names) {
    const result = await resolveContact(uid, name, context, source, date, allContacts)
    results.push(result)
    // Refresh list if a new contact was created (so subsequent resolutions see it)
    if (result.isNew) {
      allContacts = await getAllUnifiedContacts(uid)
    }
  }

  return results
}
