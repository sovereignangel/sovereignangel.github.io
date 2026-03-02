/**
 * Transcript templates for Wave.ai meeting processing.
 * Each template defines what to extract and how, based on meeting type.
 */

export type TranscriptTemplateType =
  | 'partnership'
  | 'research'
  | 'discovery'
  | 'investor'
  | 'advisor'
  | 'internal'
  | 'general'

export interface TranscriptTemplate {
  type: TranscriptTemplateType
  displayName: string
  shortCode: string // used in Telegram callback_data (≤12 chars)
  description: string
}

export const TRANSCRIPT_TEMPLATES: Record<TranscriptTemplateType, TranscriptTemplate> = {
  partnership: {
    type: 'partnership',
    displayName: 'Partnership',
    shortCode: 'partnership',
    description: 'Partnership or collaboration discussions',
  },
  research: {
    type: 'research',
    displayName: 'Research / Reading Club',
    shortCode: 'research',
    description: 'Research discussions, reading clubs, intellectual exploration',
  },
  discovery: {
    type: 'discovery',
    displayName: 'Customer Discovery',
    shortCode: 'discovery',
    description: 'Customer interviews, market research, problem discovery',
  },
  investor: {
    type: 'investor',
    displayName: 'Investor',
    shortCode: 'investor',
    description: 'Investor meetings, fundraising conversations',
  },
  advisor: {
    type: 'advisor',
    displayName: 'Advisor',
    shortCode: 'advisor',
    description: 'Advisory sessions, mentorship, strategic guidance',
  },
  internal: {
    type: 'internal',
    displayName: 'Internal',
    shortCode: 'internal',
    description: 'Team meetings, standups, internal planning',
  },
  general: {
    type: 'general',
    displayName: 'General',
    shortCode: 'general',
    description: 'Catch-all for any other meeting type',
  },
}

/**
 * Returns the extraction prompt for a given template type.
 * The prompt is injected into extractFromTranscript().
 */
export function getExtractionPrompt(templateType: TranscriptTemplateType): string {
  const base = `You are an expert analyst extracting structured intelligence from a meeting transcript.
Extract ONLY what is explicitly stated. Never hallucinate. Prefer null/empty arrays over guessing.
Return a single JSON object with NO markdown, NO code fences — raw JSON only.`

  const universalSchema = `
Universal fields (always extract):
- inferredTitle: string — infer a clear meeting title (max 60 chars)
- inferredDate: string | null — date if mentioned (YYYY-MM-DD), null otherwise
- participants: string[] — full names of all speakers/people mentioned
- contacts: Array<{ name: string; context: string }> — people worth saving (full name + how they're relevant)
- actionItems: Array<{ task: string; owner: string | null; deadline: string | null }> — explicit commitments or next steps
- keyTakeaways: string[] — 3-5 most important things discussed (concise, 1-2 sentences each)`

  const templates: Record<TranscriptTemplateType, string> = {
    partnership: `${base}

CALL TYPE: Partnership / Collaboration discussion.
Focus on: deal structure, mutual value proposition, relationship dynamics, what was committed to.

${universalSchema}

Partnership-specific fields:
- alignmentAreas: string[] — areas of clear strategic alignment between parties
- dealPoints: string[] — specific terms, conditions, or structures discussed
- dueDiligenceItems: string[] — things that need to be verified or researched before moving forward
- decisions: Array<{
    title: string;
    chosenOption: string;
    reasoning: string;
    domain: "portfolio" | "product" | "revenue" | "personal" | "thesis";
    confidenceLevel: number; // 0-100
  }> — decisions that were made or committed to
- ventureIdeas: string[] — any new business ideas or opportunities that emerged from the discussion
- insights: Array<{
    type: "process_insight" | "feature_idea" | "value_signal" | "market_pattern" | "arbitrage_opportunity";
    content: string;
    summary: string; // 1-liner max 20 words
    tags: string[];
  }> — notable insights about market, product, process, or opportunity

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    research: `${base}

CALL TYPE: Research discussion / Reading club / Intellectual exploration.
Focus on: open questions, testable beliefs, ideas worth investigating, connections to AI/markets/mind thesis.

${universalSchema}

Research-specific fields:
- hypotheses: Array<{
    question: string; // falsifiable, open question worth investigating
    context: string; // why this matters, what prompted it
    domain: "portfolio" | "product" | "revenue" | "personal" | "thesis";
    priority: "high" | "medium" | "low";
    resolution: "belief" | "blog" | "both" | null; // how this should resolve — blog post, formed belief, or both
  }> — open questions and research directions that emerged
- beliefs: Array<{
    statement: string; // "I believe that..." format, testable claim
    confidence: number; // 0-100
    domain: "portfolio" | "product" | "revenue" | "personal" | "thesis";
    evidenceFor: string[]; // evidence supporting the belief
    evidenceAgainst: string[]; // counter-arguments or challenges raised
  }> — beliefs or positions that were formed, updated, or challenged
- signals: Array<{
    title: string;
    description: string;
    thesisPillar: "ai" | "markets" | "mind" | null;
  }> — market signals, research signals, or ideas that connect to the thesis

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    discovery: `${base}

CALL TYPE: Customer discovery / Market research / Problem exploration.
Focus on: pain points, existing solutions, willingness to pay, feature requests, market dynamics.

${universalSchema}

Discovery-specific fields:
- insights: Array<{
    type: "process_insight" | "feature_idea" | "value_signal" | "market_pattern" | "arbitrage_opportunity";
    content: string;
    summary: string; // 1-liner max 20 words
    tags: string[];
  }> — process pains, desired features, value signals, market patterns
- signals: Array<{
    title: string;
    description: string;
    thesisPillar: "ai" | "markets" | "mind" | null;
  }> — market signals from the conversation

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    investor: `${base}

CALL TYPE: Investor meeting / Fundraising conversation.
Focus on: terms discussed, concerns raised, milestones required, follow-up commitments, what moved them.

${universalSchema}

Investor-specific fields:
- decisions: Array<{
    title: string;
    chosenOption: string;
    reasoning: string;
    domain: "portfolio" | "product" | "revenue" | "personal" | "thesis";
    confidenceLevel: number; // 0-100
  }> — decisions made or commitments reached
- signals: Array<{
    title: string;
    description: string;
    thesisPillar: "ai" | "markets" | "mind" | null;
  }> — market signals, investor feedback, or concerns worth tracking
- insights: Array<{
    type: "process_insight" | "feature_idea" | "value_signal" | "market_pattern" | "arbitrage_opportunity";
    content: string;
    summary: string; // 1-liner max 20 words
    tags: string[];
  }> — key learnings from the investor's perspective

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    advisor: `${base}

CALL TYPE: Advisor / Mentor / Strategic guidance session.
Focus on: strategic recommendations, frameworks or mental models shared, introductions offered, warnings given.

${universalSchema}

Advisor-specific fields:
- insights: Array<{
    type: "process_insight" | "feature_idea" | "value_signal" | "market_pattern" | "arbitrage_opportunity";
    content: string;
    summary: string; // 1-liner max 20 words
    tags: string[];
  }> — strategic insights, recommendations, and frameworks shared
- signals: Array<{
    title: string;
    description: string;
    thesisPillar: "ai" | "markets" | "mind" | null;
  }> — market signals or trends the advisor highlighted

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    internal: `${base}

CALL TYPE: Internal team meeting / Standup / Planning session.
Focus on: decisions made, blockers, priority changes, commitments, progress updates.

${universalSchema}

Internal-specific fields:
- decisions: Array<{
    title: string;
    chosenOption: string;
    reasoning: string;
    domain: "portfolio" | "product" | "revenue" | "personal" | "thesis";
    confidenceLevel: number; // 0-100
  }> — decisions or direction changes made during the meeting

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,

    general: `${base}

CALL TYPE: General meeting.
Extract whatever is most valuable from the conversation.

${universalSchema}

General fields:
- insights: Array<{
    type: "process_insight" | "feature_idea" | "value_signal" | "market_pattern" | "arbitrage_opportunity";
    content: string;
    summary: string; // 1-liner max 20 words
    tags: string[];
  }> — any notable insights
- signals: Array<{
    title: string;
    description: string;
    thesisPillar: "ai" | "markets" | "mind" | null;
  }> — market or thesis signals

Return JSON with all fields above. Use empty arrays for fields with nothing to extract.`,
  }

  return templates[templateType]
}
