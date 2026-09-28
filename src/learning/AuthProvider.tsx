import { useEffect, useState, type ReactNode } from 'react'
import { onIdTokenChanged, type User } from 'firebase/auth'
import { auth } from './firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User | null; loading: boolean; error: string }>({ user: null, loading: Boolean(auth), error: '' })
  useEffect(() => {
    if (!auth) return
    return onIdTokenChanged(auth, (user) => { setSession({ user, loading: false, error: '' }) }, () => {
      setSession({ user: null, loading: false, error: 'We could not load your session. Please reload and try again.' })
    })
  }, [])
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>
}
