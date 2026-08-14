import type { ViewKey } from '../types/app'

export function labelForView(view: ViewKey) {
  if (view === 'auth') return 'Auth'
  if (view === 'reports') return 'Reports'
  return 'Printing'
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred.'
}

export function withQuery(basePath: string, values: Record<string, string>) {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(values)) {
    if (value !== '') {
      query.set(key, value)
    }
  }

  const suffix = query.toString()
  return suffix ? `${basePath}?${suffix}` : basePath
}

export function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

export function formatDateTime(value: string) {
  return new Date(value).toLocaleString()
}
