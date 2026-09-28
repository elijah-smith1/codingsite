import { useEffect, useState, type FormEvent } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, validatePassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import App from '../App'
import { auth, db, firebaseMode } from './firebase'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './auth-context'
import { safeReturnPath } from './navigation'
import type { CourseOutline, Lesson } from './types'
import './learning.css'

function SetupMessage() {
  return <section className="learning-card"><span className="section-kicker">A little setup first</span><h1>Connect your learning space.</h1><p>The homepage is ready. Accounts and lessons need a Firebase connection.</p><p>For local development, copy <code>.env.example</code> to <code>.env.local</code>, start the emulators, seed the sample course, and restart Vite. Follow the setup guide in the README.</p><Link to="/">Back to CodeBloom</Link></section>
}

function Shell() {
  const { user } = useAuth()
  const location = useLocation()
  useEffect(() => { window.scrollTo?.(0, 0) }, [location.pathname])
  return <><a className="skip-link" href="#learning-main">Skip to main content</a><header className="learning-header"><Link className="brand" to="/">✳ CodeBloom</Link><nav aria-label="Learning navigation"><Link to="/courses/javascript">Course</Link>{user ? <><Link to="/dashboard">My learning</Link><Link to="/account">Account</Link></> : <Link to="/login">Sign in</Link>}</nav></header><main className="learning-shell" id="learning-main"><Outlet /></main><footer className="learning-footer">Small steps. Real progress.{firebaseMode === 'emulator' && ' · Local practice environment'}</footer></>
}

export function ProtectedRoute() {
  const { user, loading, error } = useAuth()
  const location = useLocation()
  if (!auth) return <SetupMessage />
  if (loading) return <p role="status">Opening your learning space…</p>
  if (error) return <p role="alert">{error}</p>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  return <div key={user.uid}><Outlet /></div>
}

function accountError(error: unknown) {
  const code = (error as { code?: string }).code
  if (code === 'auth/network-request-failed') return 'We could not connect. Check your connection and try again.'
  if (code === 'auth/too-many-requests') return 'Too many attempts. Please wait a little before trying again.'
  if (code === 'auth/weak-password' || code === 'auth/password-does-not-meet-requirements') return 'Your password does not meet the account password requirements.'
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  return 'We could not complete that request. Check your details, try signing in, or reset your password.'
}

function CredentialsPage({ mode }: { mode: 'login' | 'signup' | 'reset' }) {
  const { user, loading } = useAuth()
  const [params] = useSearchParams()
  const destination = safeReturnPath(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const title = mode === 'signup' ? 'Your next chapter starts here.' : mode === 'reset' ? 'Let’s get you back in.' : 'Welcome back, builder.'
  if (!auth) return <SetupMessage />
  if (loading) return <p role="status">Checking your session…</p>
  if (user && mode !== 'reset' && !busy) return <Navigate to={destination} replace />

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!auth || busy) return
    setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'reset') {
        try { await sendPasswordResetEmail(auth, email.trim()) } catch (cause) {
          if ((cause as { code?: string }).code !== 'auth/user-not-found') throw cause
        }
        setMessage('If an account exists for that address, you’ll receive a password-reset email. Check your inbox and spam folder.')
      } else if (mode === 'signup') {
        const policy = await validatePassword(auth, password)
        if (!policy.isValid) {
          const requirements = [`at least ${policy.passwordPolicy.customStrengthOptions.minPasswordLength ?? 6} characters`]
          if (policy.containsLowercaseLetter === false) requirements.push('a lowercase letter')
          if (policy.containsUppercaseLetter === false) requirements.push('an uppercase letter')
          if (policy.containsNumericCharacter === false) requirements.push('a number')
          if (policy.containsNonAlphanumericCharacter === false) requirements.push('a symbol')
          setError(`Choose a password with ${requirements.join(', ')}.`)
          return
        }
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
        // Verification is optional; its delivery must never block the new learner.
        await sendEmailVerification(credential.user).catch(() => undefined)
        navigate(destination, { replace: true })
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
        navigate(destination, { replace: true })
      }
    } catch (cause) { setError(accountError(cause)) } finally { setBusy(false) }
  }

  return <section className="learning-card auth-card"><span className="section-kicker">{mode === 'signup' ? 'Start small. Build brave.' : 'Your learning space'}</span><h1>{title}</h1><p>{mode === 'reset' ? 'Enter your account email and we’ll help you reset your password.' : 'A little curiosity is all you need. Your progress will have a place to grow.'}</p><form onSubmit={submit}><label htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />{mode !== 'reset' && <><label htmlFor="password">Password</label><input id="password" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 6 : undefined} aria-describedby={mode === 'signup' ? 'password-help' : undefined} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} />{mode === 'signup' && <small id="password-help">Use at least 6 characters. Additional account requirements are checked before signup.</small>}</>}{error && <p className="form-error" role="alert">{error}</p>}{message && <p className="form-success" role="status">{message}</p>}<button className="button learning-primary" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset email' : 'Sign in'}</button></form><div className="auth-links">{mode === 'login' ? <><Link to={`/signup?next=${encodeURIComponent(destination)}`}>New here? Create an account</Link><Link to="/forgot-password">Forgot your password?</Link></> : <Link to={`/login?next=${encodeURIComponent(destination)}`}>Back to sign in</Link>}</div></section>
}

function useDocument<T>(path: string) {
  const [state, setState] = useState<{ path: string; data?: T; error?: string; missing?: boolean }>({ path: '' })
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    if (!db) return
    getDoc(doc(db, path)).then(snapshot => {
      if (active) setState({ path, data: snapshot.exists() ? snapshot.data() as T : undefined, missing: !snapshot.exists() })
    }).catch(() => { if (active) setState({ path, error: 'We couldn’t load this content. Check your connection and try again.' }) })
    return () => { active = false }
  }, [path, retry])
  return { ...(state.path === path ? state : {}), reload: () => { setState({ path: '' }); setRetry(n => n + 1) } }
}

function Outline() {
  const result = useDocument<CourseOutline>('courses/javascript')
  return <section className="learning-card"><span className="section-kicker">Your JavaScript path · 18 lessons</span><h1>Think in JavaScript.</h1><p>From your first variable to a small app of your own. Learn one idea, try it, and keep growing.</p>{!db ? <p role="status">The syllabus will appear when the learning service is connected. See the README for manual setup.</p> : result.error ? <LoadError message={result.error} retry={result.reload} /> : result.missing ? <p>No course has been published yet. In local development, run the emulator seed command.</p> : !result.data ? <p role="status">Loading the syllabus…</p> : <><ol className="syllabus">{result.data.lessons.map((lesson, index) => <li key={lesson.id}><span className="lesson-number">{String(index + 1).padStart(2, '0')}</span><span>{lesson.title}</span>{index === 0 ? <Link to={`/learn/javascript/${lesson.id}`}>Open sample →</Link> : <small>Coming soon</small>}</li>)}</ol><p className="learning-note">The first lesson is a preview of the learning platform. Interactive exercises and the remaining lessons arrive in the next milestones.</p></>}</section>
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert"><p>{message}</p><button className="button" onClick={retry}>Try again</button></div>
}

function LessonPage() {
  const { lessonId = '' } = useParams()
  const result = useDocument<Lesson>(`courses/javascript/lessons/${lessonId}`)
  if (result.error) return <LoadError message={result.error} retry={result.reload} />
  if (result.missing) return <NotFound />
  if (!result.data) return <p role="status">Opening your lesson…</p>
  return <article className="learning-card"><Link to="/courses/javascript">← Course outline</Link><span className="section-kicker lesson-kicker">JavaScript · Sample lesson</span><h1>{result.data.title}</h1><p className="lesson-objective">{result.data.objective}</p><p>{result.data.explanation}</p><pre className="lesson-code"><code>{result.data.example}</code></pre><aside className="learning-note">This milestone introduces the lesson reader. The runnable editor and progress tracking are next.</aside></article>
}

function VerificationNotice() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [verified, setVerified] = useState(user?.emailVerified)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  if (!user || verified || dismissed) return null
  async function action(refresh: boolean) {
    if (!user) return
    setBusy(true)
    try {
      if (refresh) { await user.reload(); await user.getIdToken(true); setVerified(user.emailVerified); setMessage(user.emailVerified ? 'Email verified.' : 'Your email is not verified yet. You can keep learning.') }
      else { await sendEmailVerification(user); setMessage('Verification email sent. Check your inbox.') }
    } catch (cause) { setMessage(accountError(cause)) } finally { setBusy(false) }
  }
  return <aside className="verification-notice"><strong>One small account check</strong><p>Verify your email when you have a moment. You can start learning now.</p><div className="inline-actions"><button disabled={busy} onClick={() => action(false)}>Resend email</button><button disabled={busy} onClick={() => action(true)}>I’ve verified my email</button><button onClick={() => setDismissed(true)}>Dismiss</button></div><p role="status">{message}</p></aside>
}

function Dashboard() {
  return <><VerificationNotice /><section className="learning-card"><span className="section-kicker">Your learning space</span><h1>A small step starts here.</h1><p>Your account is ready. Explore the JavaScript syllabus and read the first sample lesson.</p><Link className="button learning-primary" to="/learn/javascript/hello-javascript">Open the first lesson →</Link><p className="learning-note">Saved exercises and a progress overview will arrive with the lesson workspace.</p></section></>
}

function Account() {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function logout() {
    if (!auth) return
    setBusy(true)
    try { await signOut(auth) } catch (cause) { setError(accountError(cause)); setBusy(false) }
  }
  return <><VerificationNotice /><section className="learning-card"><span className="section-kicker">Account</span><h1>A place for your progress.</h1><p>Signed in as <strong>{user?.email}</strong></p><p>{user?.emailVerified ? 'Your email is verified.' : 'Email verification is optional. Your lessons are available now.'}</p><div className="inline-actions"><Link to="/forgot-password">Reset password</Link><button className="button" disabled={busy} onClick={logout}>{busy ? 'Signing out…' : 'Sign out'}</button></div>{error && <p role="alert">{error}</p>}</section></>
}

function NotFound() {
  return <section className="learning-card"><h1>This page hasn’t bloomed yet.</h1><p>That lesson or page isn’t available. Find your next step in the course outline.</p><Link to="/courses/javascript">Explore JavaScript →</Link></section>
}

export function LearningRoutes() {
  return <Routes><Route path="/" element={<App />} /><Route element={<Shell />}><Route path="courses/javascript" element={<Outline />} /><Route path="login" element={<CredentialsPage key="login" mode="login" />} /><Route path="signup" element={<CredentialsPage key="signup" mode="signup" />} /><Route path="forgot-password" element={<CredentialsPage key="reset" mode="reset" />} /><Route element={<ProtectedRoute />}><Route path="dashboard" element={<Dashboard />} /><Route path="account" element={<Account />} /><Route path="learn/javascript/:lessonId" element={<LessonPage />} /></Route><Route path="*" element={<NotFound />} /></Route></Routes>
}

export default function LearningApp() {
  return <BrowserRouter><AuthProvider><LearningRoutes /></AuthProvider></BrowserRouter>
}
