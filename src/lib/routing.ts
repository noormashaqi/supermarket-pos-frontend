import type { RouteKey } from '../types/routing'

const validRoutes: RouteKey[] = [
  'login',
  'dashboard',
  'users',
  'reports',
  'profile',
]

export function getRouteFromHash(): RouteKey {
  const route = window.location.hash.replace('#/', '').replace('#', '')
  return validRoutes.includes(route as RouteKey) ? (route as RouteKey) : 'login'
}

export function navigateTo(route: RouteKey) {
  window.location.hash = `/${route}`
}
