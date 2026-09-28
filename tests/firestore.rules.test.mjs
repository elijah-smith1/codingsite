import { readFileSync } from 'node:fs'
import { after, before, beforeEach, test } from 'node:test'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { initializeApp, deleteApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, setPersistence, inMemoryPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, sendEmailVerification, applyActionCode, confirmPasswordReset } from 'firebase/auth'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

let env
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-codebloom', firestore: { host: '127.0.0.1', port: 8080, rules: readFileSync('firestore.rules', 'utf8') } })
})
beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'courses/javascript'), { title: 'JavaScript' })
    await setDoc(doc(context.firestore(), 'courses/javascript/lessons/hello-javascript'), { title: 'Hello' })
  })
})
after(async () => { await env?.cleanup() })
const progressPath = 'users/alice/courses/javascript/lessons/hello-javascript'
const progress = () => ({ completed: false, code: 'console.log("hi")', updatedAt: serverTimestamp() })
test('public outline, protected lessons, and no client curriculum writes', async () => {
  const guest = env.unauthenticatedContext().firestore()
  const member = env.authenticatedContext('alice', { email_verified: false }).firestore()
  await assertSucceeds(getDoc(doc(guest, 'courses/javascript')))
  await assertFails(getDoc(doc(guest, 'courses/javascript/lessons/hello-javascript')))
  await assertSucceeds(getDoc(doc(member, 'courses/javascript/lessons/hello-javascript')))
  await assertFails(setDoc(doc(member, 'courses/javascript'), { title: 'Changed' }))
  await assertFails(setDoc(doc(member, 'courses/javascript/lessons/hello-javascript'), { title: 'Changed' }))
})
test('owner can save progress; other accounts and guests cannot access it', async () => {
  const alice = env.authenticatedContext('alice').firestore()
  await assertSucceeds(setDoc(doc(alice, progressPath), progress()))
  await assertSucceeds(getDoc(doc(alice, progressPath)))
  for (const context of [env.authenticatedContext('bob'), env.unauthenticatedContext()]) {
    await assertFails(getDoc(doc(context.firestore(), progressPath)))
    await assertFails(setDoc(doc(context.firestore(), progressPath), progress()))
  }
})
test('reject malformed, oversized, unknown-lesson, and completion rollback writes', async () => {
  const db = env.authenticatedContext('alice').firestore()
  for (const data of [{ ...progress(), admin: true }, { ...progress(), completed: 'yes' }, { ...progress(), code: 'x'.repeat(50001) }, { completed: false, code: '' }, { ...progress(), updatedAt: 'yesterday' }]) {
    await assertFails(setDoc(doc(db, progressPath), data))
  }
  await assertFails(setDoc(doc(db, 'users/alice/courses/javascript/lessons/unknown'), progress()))
  await assertSucceeds(setDoc(doc(db, progressPath), { ...progress(), completed: true }))
  await assertFails(setDoc(doc(db, progressPath), progress()))
})
test('last lesson pointer is validated and unspecified documents are denied', async () => {
  const db = env.authenticatedContext('alice').firestore()
  const pointer = doc(db, 'users/alice/courses/javascript')
  await assertSucceeds(setDoc(pointer, { lastLessonId: 'hello-javascript', updatedAt: serverTimestamp() }))
  await assertFails(setDoc(pointer, { lastLessonId: 'unknown', updatedAt: serverTimestamp() }))
  await assertFails(setDoc(doc(db, 'admin/settings'), { enabled: true }))
  await assertFails(getDoc(doc(db, 'users/bob/courses/javascript')))
})
test('real local authentication supports signup, verification, reset, and sign-out', async () => {
  const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-codebloom' }, 'auth-integration')
  const auth = getAuth(app)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  await setPersistence(auth, inMemoryPersistence)
  const email = `learner-${Date.now()}@example.test`
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, 'initial-password-123')
    assert.equal(credential.user.emailVerified, false)
    await sendEmailVerification(credential.user)
    await sendPasswordResetEmail(auth, email)
    const response = await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-codebloom/oobCodes')
    assert.equal(response.ok, true)
    const { oobCodes } = await response.json()
    const verification = oobCodes.find(code => code.email === email && code.requestType === 'VERIFY_EMAIL')
    const reset = oobCodes.find(code => code.email === email && code.requestType === 'PASSWORD_RESET')
    assert.ok(verification)
    assert.ok(reset)
    await applyActionCode(auth, verification.oobCode)
    await credential.user.reload()
    assert.equal(credential.user.emailVerified, true)
    await confirmPasswordReset(auth, reset.oobCode, 'new-password-456')
    await signOut(auth)
    assert.equal(auth.currentUser, null)
    await signInWithEmailAndPassword(auth, email, 'new-password-456')
    assert.equal(auth.currentUser.email, email)
    await signOut(auth)
    assert.equal(auth.currentUser, null)
  } finally { await deleteApp(app) }
})
test('localhost seed publishes the full outline and protected sample lesson', async () => {
  await promisify(execFile)(process.execPath, ['scripts/seed-emulator.mjs'])
  const guest = env.unauthenticatedContext().firestore()
  const outline = await getDoc(doc(guest, 'courses/javascript'))
  assert.equal(outline.data().lessons.length, 18)
  assert.equal(outline.data().lessons[0].id, 'hello-javascript')
  const db = env.authenticatedContext('sample-reader').firestore()
  const sample = await getDoc(doc(db, 'courses/javascript/lessons/hello-javascript'))
  assert.equal(sample.data().title, 'Hello, JavaScript.')
  await assertFails(getDoc(doc(guest, 'courses/javascript/lessons/hello-javascript')))
})
