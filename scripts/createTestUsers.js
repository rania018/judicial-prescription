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
const SHARED_COURT_ID = 'COURT-01'
const SHARED_COUNCIL_ID = 'COUNCIL-01'

const TEST_ACCOUNTS = [
  {
    email: 'clerk@test.com',
    role: 'CLERK',
    displayName: 'أمين الضبط (تجريبي)',
    courtId: SHARED_COURT_ID,
    councilId: SHARED_COUNCIL_ID,
  },
  {
    email: 'judge@test.com',
    role: 'JUDGE',
    displayName: 'قاضٍ (تجريبي)',
    courtId: SHARED_COURT_ID,
    councilId: SHARED_COUNCIL_ID,
  },
  {
    email: 'prosecutor@test.com',
    role: 'PUBLIC_PROSECUTOR',
    displayName: 'وكيل الجمهورية (تجريبي)',
    courtId: SHARED_COURT_ID,
    councilId: SHARED_COUNCIL_ID,
  },
  {
    email: 'attorney@test.com',
    role: 'ATTORNEY_GENERAL',
    displayName: 'النائب العام (تجريبي)',
    courtId: SHARED_COURT_ID,
    councilId: SHARED_COUNCIL_ID,
  },
]

async function run() {
  if (!admin.apps.length) {
    admin.initializeApp()
  }

  const auth = admin.auth()
  const db = admin.firestore()

  console.log(`Seeding ${TEST_ACCOUNTS.length} Firebase test accounts...`)

  for (const { email, role, displayName, courtId, councilId } of TEST_ACCOUNTS) {
    try {
      let uid
      try {
        const userRecord = await auth.createUser({
          email,
          password: TEST_PASSWORD,
          emailVerified: true,
        })
        uid = userRecord.uid
        console.log(`✓ Created auth user: ${email} (${uid})`)
      } catch (err) {
        if (err.code === 'auth/email-already-exists') {
          const userRecord = await auth.getUserByEmail(email)
          uid = userRecord.uid
          await auth.updateUser(uid, { password: TEST_PASSWORD })
          console.log(`↺ Existing auth user updated (password reset): ${email} (${uid})`)
        } else {
          throw err
        }
      }

      await db.collection('users').doc(uid).set(
        {
          role,
          displayName,
          active: true,
          courtId,
          councilId,
        },
        { merge: true }
      )
      console.log(`  → Firestore users/${uid} updated: role=${role}, courtId=${courtId}, councilId=${councilId}`)
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
