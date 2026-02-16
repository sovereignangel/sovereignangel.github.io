// @ts-nocheck
/**
 * GitHub API ETL
 * Syncs daily coding activity: commits, PRs, issues, lines changed
 * Runs at 6am daily via cron
 *
 * API Docs: https://docs.github.com/en/rest
 */

import { createClient } from '@supabase/supabase-js'
import { Octokit } from '@octokit/rest'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
})

interface GitHubActivity {
  date: string
  commits: number
  pull_requests: number
  issues_closed: number
  lines_added: number
  lines_deleted: number
  repositories_active: number
  raw_data: any
}

/**
 * Sync GitHub activity for a given date
 */
export async function syncGitHubActivity(date: string): Promise<GitHubActivity | null> {
  const startTime = Date.now()

  try {
    // Log sync attempt
    await supabase.from('sync_status').insert({
      date,
      source: 'github',
      status: 'pending',
      started_at: new Date().toISOString()
    })

    const username = process.env.GITHUB_USERNAME!

    // Date range for the query
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const dateQuery = `${startOfDay.toISOString()}..${endOfDay.toISOString()}`

    // Search for commits by author on this date
    const commitsSearch = await octokit.rest.search.commits({
      q: `author:${username} author-date:${date}`,
      per_page: 100
    })

    const commits = commitsSearch.data.items

    // Get unique repositories
    const repositories = new Set(commits.map(c => c.repository.full_name))

    // Calculate lines changed from commits
    let totalAdditions = 0
    let totalDeletions = 0

    for (const commit of commits) {
      try {
        const [owner, repo] = commit.repository.full_name.split('/')
        const commitDetail = await octokit.rest.repos.getCommit({
          owner,
          repo,
          ref: commit.sha
        })

        totalAdditions += commitDetail.data.stats?.additions || 0
        totalDeletions += commitDetail.data.stats?.deletions || 0

        // Rate limit: wait 100ms between detailed commit fetches
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Could not fetch commit details for ${commit.sha}`)
      }
    }

    // Search for PRs created on this date
    const prsSearch = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:pr created:${date}`,
      per_page: 100
    })

    // Search for issues closed on this date
    const issuesSearch = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${username} type:issue closed:${date}`,
      per_page: 100
    })

    const activity: GitHubActivity = {
      date,
      commits: commits.length,
      pull_requests: prsSearch.data.total_count,
      issues_closed: issuesSearch.data.total_count,
      lines_added: totalAdditions,
      lines_deleted: totalDeletions,
      repositories_active: repositories.size,
      raw_data: {
        commits: commits.map(c => ({
          sha: c.sha,
          message: c.commit.message,
          repo: c.repository.full_name
        })),
        pull_requests: prsSearch.data.items.map(pr => ({
          number: pr.number,
          title: pr.title,
          url: pr.html_url
        })),
        issues: issuesSearch.data.items.map(issue => ({
          number: issue.number,
          title: issue.title,
          url: issue.html_url
        }))
      }
    }

    // Insert to database
    const { error } = await supabase
      .from('github_activity')
      .insert(activity)

    if (error) throw error

    // Log success
    await supabase.from('sync_status').insert({
      date,
      source: 'github',
      status: 'success',
      records_synced: 1,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    console.log(`✅ GitHub synced for ${date}: ${commits.length} commits, ${totalAdditions}+ ${totalDeletions}- lines`)
    return activity

  } catch (error: any) {
    console.error(`❌ GitHub sync failed for ${date}:`, error)

    // Log failure
    await supabase.from('sync_status').insert({
      date,
      source: 'github',
      status: 'failed',
      error_message: error.message,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString()
    })

    return null
  }
}

/**
 * Backfill last N days of GitHub data
 */
export async function backfillGitHubData(days: number = 90) {
  const results = []

  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const activity = await syncGitHubActivity(dateStr)
    results.push({ date: dateStr, success: !!activity })

    // Rate limit: GitHub allows 5000 requests/hour, wait 1 second to be safe
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const successful = results.filter(r => r.success).length
  console.log(`Backfilled ${successful}/${days} days of GitHub data`)

  return results
}

/**
 * Get current week's activity (useful for dashboard)
 */
export async function getWeekActivity() {
  const activities = []

  for (let i = 0; i < 7; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const { data } = await supabase
      .from('github_activity')
      .select('*')
      .eq('date', dateStr)
      .single()

    if (data) activities.push(data)
  }

  return activities
}
