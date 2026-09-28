import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
export const AuthContext = createContext<{ user: User | null; loading: boolean; error: string }>({ user: null, loading: true, error: '' })
export const useAuth = () => useContext(AuthContext)
