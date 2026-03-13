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
const MAX_REPO_SYNC_FILES = 12
const MAX_REPO_SYNC_PATH_LENGTH = 180
const MAX_REPOSITORY_LENGTH = 240
const MAX_BRANCH_LENGTH = 160
const MAX_COMMIT_SHA_LENGTH = 120
const MAX_FILE_CONTENT_LENGTH = 250_000

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
    if (filePath.length > MAX_REPO_SYNC_PATH_LENGTH) continue
    if (content.length > MAX_FILE_CONTENT_LENGTH) continue
    if (!isRelevantRepoSyncFile(filePath)) continue
    unique.set(filePath, content)
  }

  return [...unique.entries()].map(([path, content]) => ({ path, content }))
}

export function validateRepoSyncPayload(payload: unknown): RepoSyncPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload-ul de repo sync trebuie sa fie un obiect JSON valid.")
  }

  const body = payload as Record<string, unknown>
  const provider = normalizeProvider(body.provider)
  const repository = normalizeString(body.repository, MAX_REPOSITORY_LENGTH)
  const branch = normalizeString(body.branch, MAX_BRANCH_LENGTH)
  const commitSha = normalizeString(body.commitSha, MAX_COMMIT_SHA_LENGTH)
  const files = normalizeFilesArray(body.files)

  return {
    provider,
    repository,
    branch,
    commitSha,
    files,
  }
}

export function validateProviderRepoSyncPayload(
  provider: "github" | "gitlab",
  payload: unknown
): ProviderRepoSyncPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Payload-ul providerului trebuie sa fie un obiect JSON valid.")
  }

  const body = payload as Record<string, unknown>
  const files = normalizeFilesArray(body.files)
  const manifests =
    body.manifests && typeof body.manifests === "object" && !Array.isArray(body.manifests)
      ? Object.fromEntries(
          Object.entries(body.manifests as Record<string, unknown>)
            .map(([path, content]) => [normalizeString(path, MAX_REPO_SYNC_PATH_LENGTH), normalizeString(content, MAX_FILE_CONTENT_LENGTH)])
            .filter((entry): entry is [string, string] => Boolean(entry[0] && entry[1]))
        )
      : undefined

  return {
    repository: normalizeString(body.repository, MAX_REPOSITORY_LENGTH),
    projectPath: normalizeString(body.projectPath, MAX_REPOSITORY_LENGTH),
    branch: normalizeString(body.branch, MAX_BRANCH_LENGTH),
    refName: normalizeString(body.refName, MAX_BRANCH_LENGTH),
    commitSha: normalizeString(body.commitSha, MAX_COMMIT_SHA_LENGTH),
    sha: normalizeString(body.sha, MAX_COMMIT_SHA_LENGTH),
    files,
    manifests: manifests && Object.keys(manifests).length > 0 ? manifests : undefined,
  }
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

function normalizeProvider(value: unknown) {
  if (value === "github" || value === "gitlab" || value === "manual") return value
  return undefined
}

function normalizeString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

function normalizeFilesArray(value: unknown): RepoSyncFileInput[] | undefined {
  if (value == null) return undefined
  if (!Array.isArray(value)) {
    throw new Error("Campul files trebuie sa fie o lista de fisiere.")
  }
  if (value.length > MAX_REPO_SYNC_FILES) {
    throw new Error(`Repo sync accepta maxim ${MAX_REPO_SYNC_FILES} fisiere per request.`)
  }

  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Fiecare fisier de repo sync trebuie sa fie un obiect valid.")
    }

    return {
      path: normalizeString((item as Record<string, unknown>).path, MAX_REPO_SYNC_PATH_LENGTH),
      content: normalizeString((item as Record<string, unknown>).content, MAX_FILE_CONTENT_LENGTH),
    }
  })
}
