export type RepoSyncFileInput = {
  path?: string
  content?: string
}

export type NormalizedRepoSyncFile = {
  path: string
  content: string
}

export type RepoSyncPayload = {
  provider?: "github" | "gitlab" | "manual"
  repository?: string
  branch?: string
  commitSha?: string
  files?: RepoSyncFileInput[]
}

export type NormalizedRepoSyncPayload = Omit<RepoSyncPayload, "files"> & {
  files: NormalizedRepoSyncFile[]
}

export type ProviderRepoSyncPayload = {
  repository?: string
  projectPath?: string
  branch?: string
  refName?: string
  commitSha?: string
  sha?: string
  files?: RepoSyncFileInput[]
  manifests?: Record<string, string>
}

export const REPO_SYNC_HEADER = "x-compliscan-sync-key"

const RELEVANT_FILE_PATTERNS = [
  /(^|\/)compliscan\.(yaml|yml)$/i,
  /(^|\/)package\.json$/i,
  /(^|\/)package-lock\.json$/i,
  /(^|\/)pnpm-lock\.yaml$/i,
  /(^|\/)yarn\.lock$/i,
  /(^|\/)requirements\.txt$/i,
  /(^|\/)pyproject\.toml$/i,
  /(^|\/)poetry\.lock$/i,
]

export function isRelevantRepoSyncFile(filePath: string) {
  const normalized = filePath.trim()
  return RELEVANT_FILE_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function normalizeRepoSyncFiles(payload: RepoSyncPayload): NormalizedRepoSyncFile[] {
  const unique = new Map<string, string>()

  for (const item of payload.files ?? []) {
    const filePath = item.path?.trim()
    const content = item.content?.trim()
    if (!filePath || !content) continue
    if (!isRelevantRepoSyncFile(filePath)) continue
    unique.set(filePath, content)
  }

  return [...unique.entries()].map(([path, content]) => ({ path, content }))
}

export function normalizeProviderRepoSyncPayload(
  provider: "github" | "gitlab",
  payload: ProviderRepoSyncPayload
): RepoSyncPayload {
  const filesFromArray = payload.files ?? []
  const filesFromRecord = Object.entries(payload.manifests ?? {}).map(([path, content]) => ({
    path,
    content,
  }))

  return {
    provider,
    repository: payload.repository?.trim() || payload.projectPath?.trim(),
    branch: payload.branch?.trim() || payload.refName?.trim(),
    commitSha: payload.commitSha?.trim() || payload.sha?.trim(),
    files: [...filesFromArray, ...filesFromRecord],
  }
}

export function isLocalRequest(request: Request) {
  const url = new URL(request.url)
  const hostHeader = request.headers.get("host")?.toLowerCase() ?? ""
  const hostname = url.hostname.toLowerCase()

  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostHeader.startsWith("localhost:") ||
    hostHeader.startsWith("127.0.0.1:")
  )
}

export function canUseRepoSync(request: Request) {
  const configuredKey = process.env.COMPLISCAN_SYNC_KEY?.trim()
  const providedKey = request.headers.get(REPO_SYNC_HEADER)?.trim()

  if (configuredKey) return configuredKey === providedKey
  if (process.env.NODE_ENV === "development") return true
  return isLocalRequest(request)
}

export function buildRepoSyncStatus(request: Request) {
  const url = new URL(request.url)
  const origin = `${url.protocol}//${url.host}`
  const configuredKey = process.env.COMPLISCAN_SYNC_KEY?.trim()
  const requiresKey = Boolean(configuredKey)
  const localAllowedWithoutKey = !configuredKey && isLocalRequest(request)

  return {
    headerName: REPO_SYNC_HEADER,
    requiresKey,
    localAllowedWithoutKey,
    genericEndpoint: `${origin}/api/integrations/repo-sync`,
    githubEndpoint: `${origin}/api/integrations/repo-sync/github`,
    gitlabEndpoint: `${origin}/api/integrations/repo-sync/gitlab`,
    curlExample: [
      `curl -X POST ${origin}/api/integrations/repo-sync \\`,
      `  -H "Content-Type: application/json" \\`,
      `  -H "${REPO_SYNC_HEADER}: \${COMPLISCAN_SYNC_KEY}" \\`,
      `  -d @repo-sync.json`,
    ].join("\n"),
  }
}
