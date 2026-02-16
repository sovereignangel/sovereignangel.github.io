// @ts-nocheck
/**
 * Dropbox Folder Watcher
 * Monitors Wave.ai transcript folder and processes new files automatically
 * File naming conventions:
 * - daily-YYYY-MM-DD.txt → Daily reflection
 * - signal-YYYY-MM-DD-HHmm.txt → Signal capture
 * - goal-GOAL_NAME-YYYY-MM-DD.txt → Goal-specific note
 */

import { Dropbox } from 'dropbox'
import { processReflection } from './process-reflection'
import { processSignal } from './process-signal'

const dropbox = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN!
})

const WAVE_AI_FOLDER = process.env.WAVE_AI_FOLDER_PATH || '/Apps/Wave/transcripts'

interface ProcessedFile {
  name: string
  type: 'daily' | 'signal' | 'goal' | 'unknown'
  processed: boolean
  error?: string
}

/**
 * List files in Wave.ai folder
 */
async function listTranscripts(): Promise<string[]> {
  try {
    const response = await dropbox.filesListFolder({
      path: WAVE_AI_FOLDER
    })

    return response.result.entries
      .filter(entry => entry['.tag'] === 'file' && entry.name.endsWith('.txt'))
      .map(entry => entry.name)

  } catch (error: any) {
    console.error('Failed to list Dropbox files:', error)
    return []
  }
}

/**
 * Download transcript content
 */
async function downloadTranscript(fileName: string): Promise<string | null> {
  try {
    const response = await dropbox.filesDownload({
      path: `${WAVE_AI_FOLDER}/${fileName}`
    })

    // @ts-ignore - Dropbox SDK types are imperfect
    const blob = response.result.fileBlob
    const text = await blob.text()

    return text

  } catch (error: any) {
    console.error(`Failed to download ${fileName}:`, error)
    return null
  }
}

/**
 * Parse file name to extract type and metadata
 */
function parseFileName(fileName: string): {
  type: 'daily' | 'signal' | 'goal' | 'unknown'
  date?: string
  timestamp?: string
  goalName?: string
} {
  // daily-2026-02-12.txt
  const dailyMatch = fileName.match(/^daily-(\d{4}-\d{2}-\d{2})\.txt$/)
  if (dailyMatch) {
    return { type: 'daily', date: dailyMatch[1] }
  }

  // signal-2026-02-12-1430.txt
  const signalMatch = fileName.match(/^signal-(\d{4}-\d{2}-\d{2})-(\d{4})\.txt$/)
  if (signalMatch) {
    const date = signalMatch[1]
    const time = signalMatch[2]
    const hour = time.substring(0, 2)
    const min = time.substring(2, 4)
    const timestamp = `${date}T${hour}:${min}:00Z`
    return { type: 'signal', date, timestamp }
  }

  // goal-chess-2026-02-12.txt
  const goalMatch = fileName.match(/^goal-([^-]+)-(\d{4}-\d{2}-\d{2})\.txt$/)
  if (goalMatch) {
    return { type: 'goal', goalName: goalMatch[1], date: goalMatch[2] }
  }

  return { type: 'unknown' }
}

/**
 * Process a single transcript file
 */
async function processTranscriptFile(fileName: string): Promise<ProcessedFile> {
  const parsed = parseFileName(fileName)

  if (parsed.type === 'unknown') {
    return {
      name: fileName,
      type: 'unknown',
      processed: false,
      error: 'Unknown file naming format'
    }
  }

  const content = await downloadTranscript(fileName)

  if (!content) {
    return {
      name: fileName,
      type: parsed.type,
      processed: false,
      error: 'Failed to download file'
    }
  }

  try {
    if (parsed.type === 'daily' && parsed.date) {
      await processReflection(content, parsed.date)
    } else if (parsed.type === 'signal' && parsed.timestamp) {
      await processSignal(content, parsed.timestamp)
    } else if (parsed.type === 'goal' && parsed.date && parsed.goalName) {
      // Process goal-specific note (could create separate handler)
      console.log(`Goal note captured: ${parsed.goalName} on ${parsed.date}`)
      // For now, treat as a high-priority signal
      await processSignal(
        content,
        `${parsed.date}T12:00:00Z`,
        `Goal: ${parsed.goalName}`
      )
    }

    return {
      name: fileName,
      type: parsed.type,
      processed: true
    }

  } catch (error: any) {
    return {
      name: fileName,
      type: parsed.type,
      processed: false,
      error: error.message
    }
  }
}

/**
 * Scan folder and process all new transcripts
 */
export async function scanAndProcessTranscripts(): Promise<ProcessedFile[]> {
  console.log(`🔍 Scanning Wave.ai folder: ${WAVE_AI_FOLDER}`)

  const files = await listTranscripts()

  if (files.length === 0) {
    console.log('No transcript files found')
    return []
  }

  console.log(`Found ${files.length} transcript files`)

  const results: ProcessedFile[] = []

  for (const file of files) {
    console.log(`Processing: ${file}`)
    const result = await processTranscriptFile(file)
    results.push(result)

    // Rate limit: wait 1 second between files
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const successful = results.filter(r => r.processed).length
  console.log(`✅ Processed ${successful}/${files.length} files`)

  return results
}

/**
 * Move processed file to archive folder
 */
export async function archiveTranscript(fileName: string): Promise<boolean> {
  try {
    const archivePath = `${WAVE_AI_FOLDER}/processed/${fileName}`

    await dropbox.filesMoveV2({
      from_path: `${WAVE_AI_FOLDER}/${fileName}`,
      to_path: archivePath
    })

    return true

  } catch (error: any) {
    console.error(`Failed to archive ${fileName}:`, error)
    return false
  }
}
