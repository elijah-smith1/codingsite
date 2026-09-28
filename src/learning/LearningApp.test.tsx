import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import type { User } from 'firebase/auth'
import { AuthContext } from './auth-context'
import { safeReturnPath } from './navigation'
import { LearningRoutes } from './LearningApp'

const api = vi.hoisted(() => ({ login: vi.fn(), signup: vi.fn(), reset: vi.fn(), verify: vi.fn(), logout: vi.fn(), policy: vi.fn(), getDoc: vi.fn() }))
vi.mock('./firebase', () => ({ auth: {}, db: {}, firebaseMode: 'emulator' }))
vi.mock('firebase/auth', () => ({ signInWithEmailAndPassword: api.login, createUserWithEmailAndPassword: api.signup, sendPasswordResetEmail: api.reset, sendEmailVerification: api.verify, signOut: api.logout, validatePassword: api.policy }))
vi.mock('firebase/firestore', () => ({ doc: (_db: unknown, path: string) => path, getDoc: api.getDoc }))
const learner = { uid: 'alice', email: 'alice@example.test', emailVerified: false } as User
function page(path: string, user: User | null = null, loading = false) {
  return render(<MemoryRouter initialEntries={[path]}><AuthContext.Provider value={{ user, loading, error: '' }}><LearningRoutes /></AuthContext.Provider></MemoryRouter>)
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
  api.getDoc.mockResolvedValue({ exists: () => true, data: () => ({ title: 'Hello, JavaScript.', objective: 'Print a message.', explanation: 'Use console.log.', example: 'console.log("hi")', version: 1 }) })
  api.policy.mockResolvedValue({ isValid: true })
  api.signup.mockResolvedValue({ user: learner })
  api.verify.mockResolvedValue(undefined)
})
afterEach(cleanup)

describe('account and lesson routes', () => {
  it('waits for the initial session before redirecting', () => {
    page('/learn/javascript/hello-javascript', null, true)
    expect(screen.getByRole('status')).toHaveTextContent('Opening your learning space')
    expect(screen.queryByLabelText('Email address')).not.toBeInTheDocument()
  })
  it('redirects a signed-out lesson visitor to sign-in', () => {
    page('/learn/javascript/hello-javascript')
    expect(screen.getByRole('heading', { name: 'Welcome back, builder.' })).toBeInTheDocument()
    expect(screen.getByText('New here? Create an account')).toHaveAttribute('href', '/signup?next=%2Flearn%2Fjavascript%2Fhello-javascript')
    expect(api.getDoc).not.toHaveBeenCalled()
  })
  it('loads the sample lesson for an unverified learner', async () => {
    page('/learn/javascript/hello-javascript', learner)
    expect(await screen.findByRole('heading', { name: 'Hello, JavaScript.' })).toBeInTheDocument()
    expect(api.getDoc).toHaveBeenCalledWith('courses/javascript/lessons/hello-javascript')
  })
  it('reports missing lessons without crashing', async () => {
    api.getDoc.mockResolvedValue({ exists: () => false })
    page('/learn/javascript/missing', learner)
    expect(await screen.findByRole('heading', { name: 'This page hasn’t bloomed yet.' })).toBeInTheDocument()
  })
  it('shows load errors and permits retry', async () => {
    api.getDoc.mockRejectedValueOnce(new Error('offline'))
    page('/learn/javascript/hello-javascript', learner)
    fireEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Hello, JavaScript.' })).toBeInTheDocument()
  })
  it('sends login credentials and reports failures', async () => {
    api.login.mockRejectedValue({ code: 'auth/invalid-credential' })
    page('/login')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alice@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Check your details')
    expect(api.login).toHaveBeenCalledWith({}, 'alice@example.test', 'wrong-password')
  })
  it('validates password policy before creating an account', async () => {
    api.policy.mockResolvedValue({ isValid: false, passwordPolicy: { customStrengthOptions: { minPasswordLength: 10 } }, containsNumericCharacter: false })
    page('/signup')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alice@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weakpass' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('at least 10 characters, a number')
    expect(api.signup).not.toHaveBeenCalled()
  })
  it('creates an account and requests optional verification', async () => {
    page('/signup')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'alice@example.test' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'valid-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
    await waitFor(() => expect(api.verify).toHaveBeenCalledWith(learner))
    expect(api.signup).toHaveBeenCalledWith({}, 'alice@example.test', 'valid-password')
  })
  it('uses a neutral reset response even for nonexistent accounts', async () => {
    api.reset.mockRejectedValue({ code: 'auth/user-not-found' })
    page('/forgot-password')
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'unknown@example.test' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send reset email' }))
    expect(await screen.findByRole('status')).toHaveTextContent('If an account exists')
  })
  it('resends verification without preventing access to the dashboard', async () => {
    page('/dashboard', learner)
    fireEvent.click(screen.getByRole('button', { name: 'Resend email' }))
    expect(await screen.findByText('Verification email sent. Check your inbox.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open the first lesson →' })).toBeInTheDocument()
  })
  it('signs out through Firebase', async () => {
    page('/account', learner)
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(api.logout).toHaveBeenCalledWith({}))
  })
})

describe('return paths', () => {
  it('permits internal learning destinations only', () => {
    expect(safeReturnPath('/learn/javascript/hello-javascript')).toBe('/learn/javascript/hello-javascript')
    for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '', '/courses/javascript']) expect(safeReturnPath(path)).toBe('/dashboard')
  })
})
