/**
 * Wave.ai Transcript Auto-Forwarder (Google Apps Script)
 *
 * FALLBACK OPTION: Prefer the Wave API webhook (/api/webhooks/wave) which
 * provides direct integration with HMAC auth and speaker-attributed transcripts.
 * Use this Gmail-based approach only if the Wave API is unavailable.
 *
 * Watches Gmail for new Wave.ai transcript emails, extracts the transcript
 * text, and POSTs it to the Thesis Engine webhook for auto-processing.
 *
 * SETUP:
 * 1. Go to script.google.com (logged in as loricorpuz@gmail.com)
 * 2. Create new project: "Wave Transcript Forwarder"
 * 3. Paste this entire file
 * 4. Go to Project Settings > Script Properties, add:
 *    - WEBHOOK_URL = https://loricorpuz.com/api/webhooks/transcript
 *    - WEBHOOK_SECRET = <same value as TRANSCRIPT_WEBHOOK_SECRET in .env.local>
 * 5. Go to Triggers > Add Trigger:
 *    - Function: checkWaveEmails
 *    - Event source: Time-driven
 *    - Type: Minutes timer
 *    - Interval: Every 5 minutes
 * 6. Run testExtraction() manually first to verify email format
 *
 * NOTE: The WAVE_SEARCH_QUERY below uses a placeholder sender address.
 * Run testExtraction() after receiving a real Wave.ai email to verify
 * the actual sender and adjust if needed.
 */

// Adjust this query after checking real Wave.ai email sender address
const WAVE_SEARCH_QUERY = 'from:wave subject:transcript -label:WaveProcessed newer_than:1d'
const PROCESSED_LABEL = 'WaveProcessed'

function checkWaveEmails() {
  var props = PropertiesService.getScriptProperties()
  var webhookUrl = props.getProperty('WEBHOOK_URL')
  var webhookSecret = props.getProperty('WEBHOOK_SECRET')

  if (!webhookUrl || !webhookSecret) {
    console.error('Missing WEBHOOK_URL or WEBHOOK_SECRET in Script Properties')
    return
  }

  // Ensure the processed label exists
  var processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL)
  if (!processedLabel) {
    processedLabel = GmailApp.createLabel(PROCESSED_LABEL)
  }

  // Search for unprocessed Wave.ai emails
  var threads = GmailApp.search(WAVE_SEARCH_QUERY, 0, 10)

  if (threads.length === 0) {
    console.log('No new Wave.ai transcripts found')
    return
  }

  console.log('Found ' + threads.length + ' new Wave.ai transcript(s)')

  for (var t = 0; t < threads.length; t++) {
    var thread = threads[t]
    var messages = thread.getMessages()

    for (var m = 0; m < messages.length; m++) {
      var message = messages[m]

      try {
        var transcriptText = extractTranscriptFromEmail(message)

        if (!transcriptText || transcriptText.trim().length < 100) {
          console.warn('Skipping short/empty transcript from: ' + message.getSubject())
          continue
        }

        var response = UrlFetchApp.fetch(webhookUrl, {
          method: 'post',
          contentType: 'application/json',
          headers: {
            'Authorization': 'Bearer ' + webhookSecret,
          },
          payload: JSON.stringify({
            transcriptText: transcriptText,
            source: 'gmail_wave',
            metadata: {
              email_subject: message.getSubject(),
              email_from: message.getFrom(),
              email_date: message.getDate().toISOString(),
            },
          }),
          muteHttpExceptions: true,
        })

        var responseCode = response.getResponseCode()
        var responseBody = response.getContentText()

        if (responseCode === 200) {
          console.log('Successfully processed: ' + message.getSubject())
        } else {
          console.error('Webhook returned ' + responseCode + ': ' + responseBody)
        }
      } catch (error) {
        console.error('Failed to process email "' + message.getSubject() + '": ' + error)
      }
    }

    // Mark thread as processed (prevents re-processing)
    thread.addLabel(processedLabel)
  }
}

/**
 * Extract transcript text from a Wave.ai email.
 * Wave.ai emails may be HTML or plain text.
 * Strips headers, footers, and formatting.
 */
function extractTranscriptFromEmail(message) {
  // Try plain text body first (more reliable parsing)
  var text = message.getPlainBody()

  if (!text || text.trim().length < 50) {
    // Fall back to HTML body, strip tags
    var html = message.getBody()
    text = html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }

  // Clean up common Wave.ai boilerplate (adjust after inspecting real emails)
  text = text
    .replace(/Sent (from|via) Wave.*$/is, '')  // Remove Wave footer
    .replace(/\n{3,}/g, '\n\n')                // Collapse excessive newlines
    .trim()

  return text
}

/**
 * MANUAL TEST — Run this first to verify setup.
 * Searches for the most recent Wave.ai-like email and logs what would be extracted.
 * Adjust the search query if needed based on what you see.
 */
function testExtraction() {
  // Broad search to find Wave emails — adjust after seeing results
  var threads = GmailApp.search('from:wave newer_than:7d', 0, 5)

  if (threads.length === 0) {
    console.log('No Wave emails found in last 7 days. Try a broader search.')
    // Try even broader
    threads = GmailApp.search('wave transcript', 0, 5)
  }

  if (threads.length === 0) {
    console.log('No Wave transcript emails found at all.')
    return
  }

  for (var t = 0; t < threads.length; t++) {
    var message = threads[t].getMessages()[0]
    console.log('--- Email ' + (t + 1) + ' ---')
    console.log('Subject: ' + message.getSubject())
    console.log('From: ' + message.getFrom())
    console.log('Date: ' + message.getDate())
    console.log('Plain body length: ' + (message.getPlainBody() || '').length)
    console.log('HTML body length: ' + (message.getBody() || '').length)

    var text = extractTranscriptFromEmail(message)
    console.log('Extracted text length: ' + text.length)
    console.log('First 500 chars:\n' + text.slice(0, 500))
    console.log('')
  }
}

/**
 * MANUAL RESET — Remove the WaveProcessed label from all threads.
 * Useful for re-testing after adjusting the extraction logic.
 */
function resetProcessedLabel() {
  var label = GmailApp.getUserLabelByName(PROCESSED_LABEL)
  if (!label) {
    console.log('No ' + PROCESSED_LABEL + ' label found')
    return
  }

  var threads = label.getThreads()
  console.log('Removing ' + PROCESSED_LABEL + ' label from ' + threads.length + ' threads')

  for (var i = 0; i < threads.length; i++) {
    threads[i].removeLabel(label)
  }

  console.log('Done. All threads will be re-processed on next run.')
}
