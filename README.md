# CodeBloom

React + TypeScript + Vite. Milestone 1 adds email/password accounts, protected lesson reading, a public syllabus, and tested Firestore access rules. The editor and progress UI come in later milestones.

## Local development — no Firebase credentials

Requirements: Node.js 20.19+ and Java 21 for the Firebase emulators.

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`. Leave `VITE_USE_FIREBASE_EMULATORS=true`.
3. Run `npm run emulators` in a terminal. The first run downloads emulator binaries.
4. In another terminal, run `npm run seed:emulator`.
5. Run `npm run dev` and open the address Vite prints.
6. Open the JavaScript course, create a test account, and read the sample lesson.

The emulator UI is at http://127.0.0.1:4000. Authentication runs on port 9099 and Firestore on 8080. Verification and reset links appear in emulator terminal output; no real email is sent. Data is temporary and must be seeded again after restarting the emulators.

The emulator wrapper uses only the `demo-codebloom` project, isolates CLI configuration inside `.cache/firebase-cli`, and removes credential environment overrides. It does not use your stored Firebase login. The seed script can write only to localhost. Do not use cloud project IDs for emulator development.

Without environment configuration, the landing page remains available and account-dependent pages show setup instructions. Restart Vite after changing environment variables.

## Connect Firebase yourself

No login, project discovery, cloud creation, or deployment is performed by this project’s scripts.

1. In the Firebase console, create or select your project and register a web app.
2. Enable **Authentication → Email/Password**. Enable email-enumeration protection and configure your password policy. The app validates that policy at signup. Email verification does not gate learning.
3. Add your website domain under Authentication’s authorized domains. Add localhost manually if you want cloud-auth development there.
4. Create Cloud Firestore in production mode and choose your region deliberately.
5. Copy the contents of `firestore.rules` into the console’s Firestore Rules editor and publish them. Do not enable open/test-mode rules.
6. Set `VITE_USE_FIREBASE_EMULATORS=false` in `.env.local` and fill in the four `VITE_FIREBASE_*` values from your web-app configuration. These are browser configuration values, not service-account secrets. Never add admin credentials to a `VITE_` variable.
7. To publish the sample manually, use the Firestore console to create `courses/javascript` with `title` and `description` strings, numeric `version: 1`, and a `lessons` array containing `{ id: "hello-javascript", title: "Running JavaScript and console output" }`. Add `courses/javascript/lessons/hello-javascript` with string fields `title`, `objective`, `explanation`, `example`, and numeric `version: 1`. The full local syllabus and sample text are in `scripts/seed-emulator.mjs`; its localhost-only script must not be repointed at production.
8. Configure verification and password-reset email templates in Authentication. Firebase-hosted email action pages handle those links; learners can refresh verification status on the account page.
9. Set the same browser configuration variables in your existing host’s build environment, rebuild, and configure SPA fallback to `index.html` for application routes. Firebase Hosting is not used.

Lesson content is protected by Firestore rules, not just frontend routing. Account data is not persisted to a custom collection. Firestore uses its default in-memory cache. No code execution or progress writes are performed by the milestone 1 UI.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:rules` — starts isolated Auth/Firestore emulators, runs security tests, and shuts them down. Stop any existing emulators first to avoid port conflicts.

Manual acceptance: register, reload a protected lesson, sign out, verify that the lesson redirects to login, sign in with another account, request a password reset, resend verification, and inspect the emulator links. Also check mobile layouts and keyboard focus.
