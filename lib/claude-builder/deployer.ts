/**
 * Deployer — creates GitHub repos, pushes code, triggers Vercel deployment.
 *
 * Replaces the external venture-builder GitHub Actions workflow.
 * Does everything inline: repo creation → file push → Vercel deploy → Cloudflare DNS.
 */

import type { GeneratedFile } from '../types'

const GITHUB_API = 'https://api.github.com'

function getGitHubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN
  if (!token) throw new Error('[Deployer] GITHUB_TOKEN not configured')
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  }
}

function getOwner(): string {
  return process.env.GITHUB_OWNER || 'sovereignangel'
}

/** Check if a GitHub repo exists */
export async function repoExists(repoName: string): Promise<boolean> {
  const res = await fetch(`${GITHUB_API}/repos/${getOwner()}/${repoName}`, {
    headers: getGitHubHeaders(),
  })
  return res.ok
}

/** Create a new GitHub repository */
export async function createRepo(repoName: string, description: string): Promise<string> {
  const owner = getOwner()
  const headers = getGitHubHeaders()

  // Check if repo exists first
  const exists = await repoExists(repoName)
  if (exists) {
    return `https://github.com/${owner}/${repoName}`
  }

  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: repoName,
      description,
      private: false,
      auto_init: true, // Creates with README so we have a default branch
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`[Deployer] Failed to create repo: ${err}`)
  }

  return `https://github.com/${owner}/${repoName}`
}

/** Push files to a GitHub repo using the Git Trees API (single commit, all files at once) */
export async function pushFiles(
  repoName: string,
  files: GeneratedFile[],
  commitMessage: string
): Promise<void> {
  const owner = getOwner()
  const headers = getGitHubHeaders()

  // Get the default branch ref
  const refRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/ref/heads/main`, { headers })
  if (!refRes.ok) {
    throw new Error(`[Deployer] Could not get main branch ref: ${await refRes.text()}`)
  }
  const refData = await refRes.json()
  const latestCommitSha = refData.object.sha

  // Get the tree SHA of the latest commit
  const commitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/commits/${latestCommitSha}`, { headers })
  const commitData = await commitRes.json()
  const baseTreeSha = commitData.tree.sha

  // Create blobs for each file
  const treeItems = await Promise.all(
    files.map(async (file) => {
      const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8',
        }),
      })
      if (!blobRes.ok) {
        throw new Error(`[Deployer] Failed to create blob for ${file.path}: ${await blobRes.text()}`)
      }
      const blobData = await blobRes.json()
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        sha: blobData.sha,
      }
    })
  )

  // Create tree
  const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeItems,
    }),
  })
  if (!treeRes.ok) {
    throw new Error(`[Deployer] Failed to create tree: ${await treeRes.text()}`)
  }
  const treeData = await treeRes.json()

  // Create commit
  const newCommitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      tree: treeData.sha,
      parents: [latestCommitSha],
    }),
  })
  if (!newCommitRes.ok) {
    throw new Error(`[Deployer] Failed to create commit: ${await newCommitRes.text()}`)
  }
  const newCommitData = await newCommitRes.json()

  // Update ref to point to new commit
  const updateRefRes = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/refs/heads/main`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitData.sha }),
  })
  if (!updateRefRes.ok) {
    throw new Error(`[Deployer] Failed to update ref: ${await updateRefRes.text()}`)
  }
}

/** Get file listing from a GitHub repo */
export async function getRepoFiles(repoName: string): Promise<string[]> {
  const owner = getOwner()
  const headers = getGitHubHeaders()

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repoName}/git/trees/main?recursive=1`, { headers })
  if (!res.ok) return []

  const data = await res.json()
  return (data.tree || [])
    .filter((item: { type: string }) => item.type === 'blob')
    .map((item: { path: string }) => item.path)
}

/**
 * Configure Cloudflare DNS for a custom subdomain.
 * Maps {projectName}.loricorpuz.com → Vercel deployment.
 */
export async function configureCloudflare(projectName: string): Promise<string | null> {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN
  const cfZoneId = process.env.CLOUDFLARE_ZONE_ID
  const baseDomain = process.env.VENTURE_BASE_DOMAIN || 'loricorpuz.com'

  if (!cfToken || !cfZoneId) {
    console.warn('[Deployer] Cloudflare not configured — skipping DNS setup')
    return null
  }

  const subdomain = `${projectName}.${baseDomain}`

  try {
    // Check if record already exists
    const listRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records?name=${subdomain}`,
      {
        headers: {
          'Authorization': `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
    const listData = await listRes.json()

    if (listData.result?.length > 0) {
      // Record exists — update it
      const recordId = listData.result[0].id
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records/${recordId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: projectName,
            content: 'cname.vercel-dns.com',
            proxied: false,
          }),
        }
      )
    } else {
      // Create new record
      await fetch(
        `https://api.cloudflare.com/client/v4/zones/${cfZoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'CNAME',
            name: projectName,
            content: 'cname.vercel-dns.com',
            proxied: false,
          }),
        }
      )
    }

    return subdomain
  } catch (error) {
    console.error('[Deployer] Cloudflare DNS configuration failed:', error)
    return null
  }
}

/**
 * Add custom domain to Vercel project.
 * Requires VERCEL_TOKEN and VERCEL_TEAM_ID env vars.
 */
export async function configureVercelDomain(projectName: string): Promise<string | null> {
  const vercelToken = process.env.VERCEL_TOKEN
  const teamId = process.env.VERCEL_TEAM_ID
  const baseDomain = process.env.VENTURE_BASE_DOMAIN || 'loricorpuz.com'

  if (!vercelToken) {
    console.warn('[Deployer] Vercel token not configured — skipping domain setup')
    return null
  }

  const domain = `${projectName}.${baseDomain}`

  try {
    const params = teamId ? `?teamId=${teamId}` : ''
    const res = await fetch(
      `https://api.vercel.com/v10/projects/${projectName}/domains${params}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: domain }),
      }
    )

    if (res.ok) return domain

    // Domain might already be configured
    const errData = await res.json()
    if (errData.error?.code === 'domain_already_in_use') return domain

    console.warn('[Deployer] Vercel domain setup:', errData)
    return null
  } catch (error) {
    console.error('[Deployer] Vercel domain configuration failed:', error)
    return null
  }
}
