// Test script for AI extraction with Gemini
// Run with: npx tsx scripts/test-ai-extraction.ts

import { extractInsightsFromTranscript, scoreArticleRelevance } from '../lib/ai-extraction'

const SAMPLE_TRANSCRIPT = `
Lori: Hey Uzo! Thanks for meeting with me. I bought you a latte.

Uzo: Oh thanks! So what's this about?

Lori: I'm building a tool to help job seekers speed up their application process. I heard you're actively looking, so I wanted to understand your workflow.

Uzo: Yeah, I've been applying for like 3 months now. It's brutal. I spend like 2-3 hours per application just tailoring my resume and cover letter.

Lori: Wow, 2-3 hours per application? What takes the longest?

Uzo: Honestly, figuring out what keywords to use. Each job posting wants different things, and I have to rewrite my bullet points to match. Then the cover letter is another 45 minutes.

Lori: If there was a tool that could do that automatically, what would you pay for it?

Uzo: If it actually worked? Easily $50/month. I'm applying to 20+ jobs a month, so that's like 60 hours saved. Totally worth it.

Lori: That's super helpful. Would you be open to testing an early version and giving feedback?

Uzo: Definitely! And if it works, I'd tell everyone in my cohort. We have like 200 people all job hunting right now.

Lori: Amazing. I'll send you a link next week. And I'll connect you with Sarah at Google - she's hiring for PM roles.

Uzo: That would be incredible, thank you!
`

const SAMPLE_ARTICLE = {
  title: 'AI Agents Are Changing How Markets Operate',
  content:
    'Autonomous AI agents are increasingly being deployed in financial markets, making split-second trading decisions and optimizing capital allocation. This represents a fundamental shift in market microstructure, with implications for liquidity, price discovery, and systemic risk. Early adopters are seeing 20-30% improvements in execution quality...',
  thesis:
    'I am an AI-native builder who spots market inefficiencies at the intersection of AI + capital markets, ships solutions rapidly through public learning, captures value through products and capital leverage.',
}

async function testExtraction() {
  console.log('🧪 Testing AI Extraction with Gemini API...\n')

  try {
    // Test 1: Transcript Extraction
    console.log('📝 Test 1: Extracting insights from conversation transcript...')
    const insights = await extractInsightsFromTranscript(
      SAMPLE_TRANSCRIPT,
      'customer_discovery',
      ['Lori', 'Uzo']
    )

    console.log('\n✅ Extraction complete!')
    console.log('\n📊 Results:')
    console.log('─────────────────────────────────────')
    console.log('\n🔍 Process Insights:')
    insights.processInsights.forEach((insight, i) => {
      console.log(`  ${i + 1}. ${insight}`)
    })

    console.log('\n💡 Feature Ideas:')
    insights.featureIdeas.forEach((idea, i) => {
      console.log(`  ${i + 1}. ${idea}`)
    })

    console.log('\n✓ Action Items:')
    insights.actionItems.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action}`)
    })

    console.log('\n💰 Value Signals:')
    insights.valueSignals.forEach((signal, i) => {
      console.log(`  ${i + 1}. ${signal}`)
    })

    console.log('\n👥 Suggested Contacts:')
    console.log(`  ${insights.suggestedContacts.join(', ')}`)

    // Test 2: Article Relevance Scoring
    console.log('\n\n📰 Test 2: Scoring article relevance to thesis...')
    const score = await scoreArticleRelevance(
      SAMPLE_ARTICLE.title,
      SAMPLE_ARTICLE.content,
      SAMPLE_ARTICLE.thesis,
      ['ai', 'markets', 'mind']
    )

    console.log('\n✅ Scoring complete!')
    console.log('─────────────────────────────────────')
    console.log(`Relevance Score: ${Math.round(score.relevanceScore * 100)}%`)
    console.log(`Matched Pillars: ${score.matchedPillars.join(', ')}`)
    console.log(`Summary: ${score.summary}`)

    console.log('\n\n✨ All tests passed! Gemini API is working correctly.\n')
  } catch (error) {
    console.error('\n❌ Error during testing:', error)
    console.log(
      '\n💡 Make sure GEMINI_API_KEY is set in .env.local and you have internet connection.\n'
    )
  }
}

testExtraction()
