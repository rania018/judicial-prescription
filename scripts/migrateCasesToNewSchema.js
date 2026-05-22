// scripts/migrateCasesToNewSchema.js (ES module)
// Run once with: node scripts\migrateCasesToNewSchema.js
//
// IMPORTANT:
// - Requires firebase-admin installed: `npm install firebase-admin`
// - Requires GOOGLE_APPLICATION_CREDENTIALS env var or inline service account config.

import admin from 'firebase-admin'

// Option A: rely on GOOGLE_APPLICATION_CREDENTIALS
admin.initializeApp()

// Option B: explicit service account JSON
// import serviceAccount from 'C:/secure/serviceAccountKey.json' assert { type: 'json' }
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// })

const db = admin.firestore()

// Updated durations to match new requirements
const PROSECUTION_YEARS = {
  FELONY: 15,
  MISDEMEANOR: 5, // Updated from 3 to 5 as per new requirements
  VIOLATION: 2,
}

function toDate(value) {
  if (!value) return null
  if (value.toDate) return value.toDate()
  return new Date(value)
}

function addYears(date, years) {
  const d = new Date(date.getTime())
  d.setFullYear(d.getFullYear() + years)
  return d
}

/**
 * Compute prescriptionStartDate / prescriptionEndDate according to new rules.
 * This migration converts old schema to new dual-track system.
 */
function computePrescriptionForExisting(data) {
  const crimeType = data.crimeType
  let years
  
  // Map old crime types to new ones and determine duration
  switch (crimeType) {
    case 'FELONY':
      years = PROSECUTION_YEARS.FELONY
      break
    case 'MISDEMEANOR':
      years = PROSECUTION_YEARS.MISDEMEANOR
      break
    case 'VIOLATION':
      years = PROSECUTION_YEARS.VIOLATION
      break
    default:
      console.log(
        `Skipping case ${data.caseCode || ''} – unsupported crimeType: ${crimeType}`,
      )
      return null
  }

  const lastActionDate = toDate(data.lastActionDate)
  const prosecutionStartDate = toDate(data.prosecutionStartDate)

  let base = lastActionDate || prosecutionStartDate
  if (!base) {
    const createdAt = toDate(data.createdAt) || new Date()
    base = createdAt
  }

  const prescriptionStartDate = base
  const prescriptionEndDate = addYears(base, years)

  return { prescriptionStartDate, prescriptionEndDate }
}

async function migrate() {
  console.log('Starting cases migration to new dual-track prescription schema...')

  const snapshot = await db.collection('cases').get()
  console.log(`Found ${snapshot.size} case(s).`)

  let migrated = 0
  let skipped = 0

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data()

    // If already migrated (has trackType and new fields), skip
    if (data.trackType) {
      skipped++
      continue
    }

    const result = computePrescriptionForExisting(data)
    if (!result) {
      skipped++
      continue
    }

    const { prescriptionStartDate, prescriptionEndDate } = result

    // Convert old crime types to new ones
    let newCrimeType = data.crimeType
    if (data.crimeType === 'MISDEMEANOR') {
      // According to requirements, we need to differentiate between simple and aggravated misdemeanors
      // For now, default to SIMPLE_MISDEMEANOR, but this might need manual adjustment
      newCrimeType = 'SIMPLE_MISDEMEANOR'
    }

    const updatePayload = {
      // New fields
      trackType: data.caseStage || 'PROSECUTION', // Default to prosecution track
      crimeType: newCrimeType,
      caseReference: data.caseCode, // Map old caseCode to new caseReference
      
      // Keep old fields for compatibility during transition
      caseCode: data.caseCode, // Keep for backward compatibility temporarily
      
      // Update dates
      crimeDate: data.prosecutionStartDate || data.createdAt,
      
      // Set default values for new fields
      judicialAuthority: 'COURT', // Default value
      judicialOfficer: 'PROSECUTOR', // Default value
      
      // Set prescription dates
      prescriptionStartDate,
      prescriptionEndDate,
      
      // Initialize history arrays
      interruptionHistory: [],
      suspensionHistory: [],
      
      // Preserve original data for reference
      migratedFromOldSchema: true,
      oldCreatedAt: data.createdAt,
    }

    await docSnap.ref.update(updatePayload)
    migrated++
    console.log(
      `Migrated case ${data.caseCode || docSnap.id}: track=PROSECUTION, crimeType=${newCrimeType}, start=${prescriptionStartDate
        .toISOString()
        .slice(0, 10)}, end=${prescriptionEndDate
        .toISOString()
        .slice(0, 10)}`,
    )
  }

  console.log(`Migration complete. Migrated: ${migrated}, Skipped: ${skipped}.`)
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})