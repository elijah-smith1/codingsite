export function safeReturnPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return '/dashboard'
  const path = value.split(/[?#]/)[0]
  return path === '/dashboard' || path === '/account' || path.startsWith('/learn/javascript/') ? value : '/dashboard'
}
