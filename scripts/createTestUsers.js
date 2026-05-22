/**
 * Create test users in Firebase Auth and set their roles in Firestore.
 * Run once: node scripts/createTestUsers.js
 *
 * Prerequisites:
 * - Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path, e.g.:
 *   PowerShell: $env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-project-firebase-adminsdk-xxxxx.json"
 *   Bash: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-project-firebase-adminsdk-xxxxx.json"
 * - Firebase Auth must have Email/Password sign-in enabled (Console → Authentication → Sign-in method).
 */

import admin from 'firebase-admin'

const TEST_PASSWORD = 'test123'

const TEST_ACCOUNTS = [
  { email: 'clerk@test.com', role: 'CLERK' },
  { email: 'prosecutor@test.com', role: 'PROSECUTOR' },
  { email: 'attorney@test.com', role: 'ATTORNEY_GENERAL' },
]

async function run() {
  if (!admin.apps.length) {
    admin.initializeApp()
  }

  const auth = admin.auth()
  const db = admin.firestore()

  for (const { email, role } of TEST_ACCOUNTS) {
    try {
      let uid
      try {
        const userRecord = await auth.createUser({
          email,
          password: TEST_PASSWORD,
          emailVerified: true,
        })
        uid = userRecord.uid
        console.log(`Created user: ${email} (${uid})`)
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          const list = await auth.getUsersByEmail([email])
          uid = list.users[0].uid
          await auth.updateUser(uid, { password: TEST_PASSWORD })
          console.log(`User already exists, password reset: ${email} (${uid})`)
        } else {
          throw err
        }
      }

      await db.collection('users').doc(uid).set(
        { role, active: true },
        { merge: true }
      )
      console.log(`  → Firestore users/${uid} set role=${role}`)
    } catch (err) {
      console.error(`Failed for ${email}:`, err.message)
    }
  }

  console.log('Done.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
