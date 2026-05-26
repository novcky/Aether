interface ApiFormatPathDefinition {
  value: string
  default_path: string
}

export function normalizeEndpointApiFormat(apiFormat: string): string {
  switch (apiFormat.trim().toLowerCase()) {
    default:
      return apiFormat.trim().toLowerCase()
  }
}

function isCodexUrl(baseUrl: string): boolean {
  const url = baseUrl.replace(/\/+$/, '')
  return url.includes('/backend-api/codex') || url.endsWith('/codex')
}

function baseUrlEndsWithApiRoot(baseUrl?: string | null): boolean {
  const raw = (baseUrl || '').trim()
  if (!raw) return false
  try {
    const parsed = new URL(raw)
    return parsed.pathname.replace(/\/+$/, '').toLowerCase().endsWith('/api')
  } catch {
    return raw.split('?')[0].replace(/\/+$/, '').toLowerCase().endsWith('/api')
  }
}

function stripV1PrefixForApiRoot(path: string): string {
  return path.replace(/^\/v1(?=\/)/i, '')
}

function isOpenAiCompatibleFormat(apiFormat: string): boolean {
  return apiFormat.startsWith('openai:') || apiFormat.startsWith('jina:')
}

export function getDefaultEndpointPath(params: {
  apiFormat: string
  providerType?: string | null
  baseUrl?: string
  apiFormats: ApiFormatPathDefinition[]
}): string {
  const providerType = (params.providerType || '').toLowerCase()
  const normalizedApiFormat = normalizeEndpointApiFormat(params.apiFormat)
  if (providerType === 'vertex_ai') {
    if (normalizedApiFormat === 'gemini:generate_content') {
      return '/v1/projects/{project_id}/locations/{region}/publishers/google/models/{model}:{action}'
    }
    if (normalizedApiFormat === 'gemini:embedding') {
      return '/v1/projects/{project_id}/locations/{region}/publishers/google/models/{model}:predict'
    }
    if (normalizedApiFormat === 'claude:messages') {
      return '/v1/projects/{project_id}/locations/{region}/publishers/anthropic/models/{model}:{action}'
    }
  }

  const format = params.apiFormats.find(f => f.value === normalizedApiFormat)
  const defaultPath = format?.default_path || ''
  const isCodex = providerType
    ? providerType === 'codex'
    : (!!params.baseUrl && isCodexUrl(params.baseUrl))
  if (normalizedApiFormat === 'openai:responses' && isCodex) {
    return '/responses'
  }
  if (baseUrlEndsWithApiRoot(params.baseUrl) && isOpenAiCompatibleFormat(normalizedApiFormat)) {
    return stripV1PrefixForApiRoot(defaultPath)
  }
  return defaultPath
}
