/**
 * SEC EDGAR ETL
 * Fetches recent 10-K and 10-Q filings from tracked companies
 * Uses EDGAR FULL-TEXT search API (efts.sec.gov)
 * Scores relevance via Gemini AI, stores as ExternalSignal
 */

import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { scoreArticleRelevance } from '@/lib/ai-extraction'

const DEFAULT_THESIS = 'How does intelligence structure itself to expand agency over time? Portfolio construction, capital markets, venture building, and complex systems.'

const EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index'
const EDGAR_FILING_URL = 'https://www.sec.gov/cgi-bin/browse-edgar'
const FULL_TEXT_SEARCH = 'https://efts.sec.gov/LATEST/search-index'

/**
 * Company CIK mappings for tracking
 * Add companies to track in Settings
 */
const DEFAULT_COMPANIES = [
  { name: 'Alphabet', cik: '0001652044', ticker: 'GOOG' },
  { name: 'Microsoft', cik: '0000789019', ticker: 'MSFT' },
  { name: 'NVIDIA', cik: '0001045810', ticker: 'NVDA' },
]

interface EdgarFiling {
  accessionNo: string
  companyName: string
  formType: string
  filedAt: string
  reportUrl: string
  title: string
}

/**
 * Fetch recent filings from SEC EDGAR full-text search
 */
async function fetchRecentFilings(companyName: string, formTypes: string[] = ['10-K', '10-Q']): Promise<EdgarFiling[]> {
  const filings: EdgarFiling[] = []

  for (const formType of formTypes) {
    try {
      const url = `https://efts.sec.gov/LATEST/search-index?q=%22${encodeURIComponent(companyName)}%22&dateRange=custom&startdt=${getDateNDaysAgo(30)}&enddt=${getToday()}&forms=${formType}`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'ThesisEngine/1.0 (lori@sovereignangel.com)',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) continue
      const data = await response.json()

      if (data.hits?.hits) {
        for (const hit of data.hits.hits.slice(0, 3)) {
          const source = hit._source
          filings.push({
            accessionNo: source.file_num || hit._id,
            companyName: source.display_names?.[0] || companyName,
            formType: source.form_type || formType,
            filedAt: source.file_date || new Date().toISOString().split('T')[0],
            reportUrl: `https://www.sec.gov/Archives/edgar/data/${source.file_num}/${hit._id}`,
            title: `${companyName} ${formType} Filing`,
          })
        }
      }
    } catch (error) {
      console.error(`EDGAR: Error fetching ${formType} for ${companyName}:`, error)
    }
  }

  return filings
}

/**
 * Sync EDGAR filings for all tracked companies
 */
export async function syncEdgarFilings(uid: string, companies?: typeof DEFAULT_COMPANIES): Promise<number> {
  const trackedCompanies = companies || DEFAULT_COMPANIES
  let savedCount = 0

  for (const company of trackedCompanies) {
    const filings = await fetchRecentFilings(company.name)

    for (const filing of filings) {
      try {
        // Score relevance
        const relevance = await scoreArticleRelevance(
          `${filing.companyName} ${filing.formType}`,
          `${filing.companyName} filed a ${filing.formType} report with the SEC on ${filing.filedAt}. This is a ${filing.formType === '10-K' ? 'annual' : 'quarterly'} financial report.`,
          DEFAULT_THESIS,
          ['markets']
        )

        if (relevance.relevanceScore < 0.5) continue

        const signalRef = doc(collection(db, 'users', uid, 'external_signals'))
        await setDoc(signalRef, {
          title: `${filing.companyName} ${filing.formType} (${filing.filedAt})`,
          source: 'edgar',
          sourceUrl: filing.reportUrl,
          sourceName: `SEC EDGAR - ${company.ticker}`,
          content: relevance.summary || `${filing.companyName} ${filing.formType} filing`,
          publishedAt: filing.filedAt,
          relevanceScore: relevance.relevanceScore,
          thesisPillars: relevance.matchedPillars || ['markets'],
          aiSummary: relevance.summary || '',
          keyTakeaway: relevance.keyTakeaway || '',
          valueBullets: relevance.valueBullets || [],
          readStatus: 'unread',
          convertedToSignal: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        savedCount++
      } catch (error) {
        console.error(`EDGAR: Error processing filing for ${company.name}:`, error)
      }
    }

    // Rate limit between companies
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log(`EDGAR: Saved ${savedCount} filings`)
  return savedCount
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getDateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}
