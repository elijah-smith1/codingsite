import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { User } from 'firebase/auth'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './auth-context'

const listener = vi.hoisted(() => ({ next: null as null | ((user: User | null) => void), unsubscribe: vi.fn() }))
vi.mock('./firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({ onIdTokenChanged: (_auth: unknown, next: (user: User | null) => void) => { listener.next = next; return listener.unsubscribe } }))
function Session() { const { user, loading } = useAuth(); return <p>{loading ? 'Loading' : user?.email ?? 'Signed out'}</p> }
afterEach(cleanup)
it('replaces learner data on sign-out and account switching, and detaches the listener', () => {
  const view = render(<AuthProvider><Session /></AuthProvider>)
  expect(screen.getByText('Loading')).toBeInTheDocument()
  act(() => listener.next?.({ uid: 'alice', email: 'alice@example.test' } as User))
  expect(screen.getByText('alice@example.test')).toBeInTheDocument()
  act(() => listener.next?.(null))
  expect(screen.queryByText('alice@example.test')).not.toBeInTheDocument()
  expect(screen.getByText('Signed out')).toBeInTheDocument()
  act(() => listener.next?.({ uid: 'bob', email: 'bob@example.test' } as User))
  expect(screen.getByText('bob@example.test')).toBeInTheDocument()
  view.unmount()
  expect(listener.unsubscribe).toHaveBeenCalled()
})
