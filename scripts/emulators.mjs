// Always run the CLI with an isolated local configuration and a demo project.
// Never reuse the developer's Firebase/Google login or application credentials.
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const isolatedHome = resolve('.cache/firebase-cli')
mkdirSync(isolatedHome, { recursive: true })
const env = { ...process.env, HOME: isolatedHome, USERPROFILE: isolatedHome,
  APPDATA: isolatedHome, LOCALAPPDATA: isolatedHome, XDG_CONFIG_HOME: isolatedHome,
  CLOUDSDK_CONFIG: isolatedHome, CI: 'true', FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
  NO_GCE_CHECK: 'true', GCLOUD_PROJECT: 'demo-codebloom', GOOGLE_CLOUD_PROJECT: 'demo-codebloom' }
for (const key of ['FIREBASE_TOKEN', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_CREDENTIALS', 'CLOUDSDK_AUTH_ACCESS_TOKEN', 'CLOUDSDK_AUTH_CREDENTIAL_FILE_OVERRIDE']) delete env[key]
const command = process.argv[2] === 'test'
  ? ['emulators:exec', '--only', 'auth,firestore', 'node --test tests/firestore.rules.test.mjs']
  : ['emulators:start', '--only', 'auth,firestore']
const child = spawn(process.execPath, [resolve('node_modules/firebase-tools/lib/bin/firebase.js'), ...command, '--project', 'demo-codebloom'], { env, stdio: 'inherit' })
child.on('error', error => { console.error(error.message); process.exitCode = 1 })
child.on('exit', code => { process.exitCode = code ?? 1 })
