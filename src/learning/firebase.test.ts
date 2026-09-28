import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const calls = vi.hoisted(() => ({ initialize: vi.fn(() => ({})), auth: vi.fn(() => ({})), db: vi.fn(() => ({})), connectAuth: vi.fn(), connectDb: vi.fn() }))
vi.mock('firebase/app', () => ({ initializeApp: calls.initialize }))
vi.mock('firebase/auth', () => ({ getAuth: calls.auth, connectAuthEmulator: calls.connectAuth }))
vi.mock('firebase/firestore', () => ({ getFirestore: calls.db, connectFirestoreEmulator: calls.connectDb }))
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks()
  for (const key of ['VITE_USE_FIREBASE_EMULATORS', 'VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_APP_ID']) vi.stubEnv(key, '')
})
afterEach(() => vi.unstubAllEnvs())
describe('manual Firebase configuration', () => {
  it('does not initialize Firebase without explicit configuration', async () => {
    const { auth, db } = await import('./firebase')
    expect(auth).toBeNull(); expect(db).toBeNull()
    expect(calls.initialize).not.toHaveBeenCalled()
  })
  it('always uses the fixed demo project when emulator mode is enabled', async () => {
    vi.stubEnv('VITE_USE_FIREBASE_EMULATORS', 'true')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'do-not-use-cloud-project')
    await import('./firebase')
    expect(calls.initialize).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'demo-codebloom' }))
    expect(calls.connectAuth).toHaveBeenCalledWith({}, 'http://127.0.0.1:9099', { disableWarnings: true })
    expect(calls.connectDb).toHaveBeenCalledWith({}, '127.0.0.1', 8080)
  })
  it('uses only the manually provided web configuration for cloud mode', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'explicit-test-key')
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'manual.example.test')
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'manual-project')
    vi.stubEnv('VITE_FIREBASE_APP_ID', 'manual-app')
    await import('./firebase')
    expect(calls.initialize).toHaveBeenCalledWith({ apiKey: 'explicit-test-key', authDomain: 'manual.example.test', projectId: 'manual-project', appId: 'manual-app' })
    expect(calls.connectAuth).not.toHaveBeenCalled()
  })
})
