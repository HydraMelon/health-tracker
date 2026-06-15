const TOKEN_KEY = 'auth_token'

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  // Cookie lets proxy.ts (server-side) detect auth state
  document.cookie = `auth_flag=1; path=/; max-age=604800; SameSite=Lax`
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  document.cookie = `auth_flag=; path=/; max-age=0; SameSite=Lax`
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

export function getUserId(): number | null {
  const token = getToken()
  if (!token) return null
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(b64))
    return typeof payload.userId === 'number' ? payload.userId : null
  } catch {
    return null
  }
}
