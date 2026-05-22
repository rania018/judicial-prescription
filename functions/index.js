const functions = require('firebase-functions')
const admin = require('firebase-admin')

admin.initializeApp()

const db = admin.firestore()

/**
 * تحديد حالة التقادم لجميع القضايا مرة كل 24 ساعة:
 * <= 0 أيام → EXPIRED
 * <= 7 أيام → CRITICAL
 * <= 15 يوم → URGENT
 * <= 90 يوم → WARNING
 * > 90 يوم → ACTIVE
 * null (غير قابل للتقادم) → NON_PRESCRIPTIBLE
 */
function getStatusFromDaysRemaining(daysRemaining) {
  if (daysRemaining === null) return 'NON_PRESCRIPTIBLE' // Non-expiring case
  if (daysRemaining <= 0) return 'EXPIRED'
  if (daysRemaining <= 7) return 'CRITICAL'
  if (daysRemaining <= 15) return 'URGENT'
  if (daysRemaining <= 90) return 'WARNING'
  return 'ACTIVE'
}

// Africa/Algiers = UTC+1 — الجزائر؛ «اليوم» يُحسب بتوقيت الجزائر
const ALGIERS_OFFSET_MS = 1 * 60 * 60 * 1000

function toUTCMidnight(date) {
  const d = date && (date.toDate ? date.toDate() : new Date(date))
  if (!d || isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** بداية اليوم التقويمي (منتصف ليل الجزائر) للمقارنة. */
function startOfDayAlgiers(utcMidnightDate) {
  if (!utcMidnightDate) return null
  const y = utcMidnightDate.getUTCFullYear()
  const m = utcMidnightDate.getUTCMonth()
  const d = utcMidnightDate.getUTCDate()
  return new Date(Date.UTC(y, m, d) - ALGIERS_OFFSET_MS)
}

function getDaysRemaining(prescriptionEndDate) {
  // If prescriptionEndDate is null, the case is non-prescriptible
  if (!prescriptionEndDate) return null
  
  const endUtc = toUTCMidnight(prescriptionEndDate.toDate ? prescriptionEndDate.toDate() : prescriptionEndDate)
  if (!endUtc) return 0
  const now = new Date()
  const algiersNow = new Date(now.getTime() + ALGIERS_OFFSET_MS)
  const todayUtc = new Date(Date.UTC(algiersNow.getUTCFullYear(), algiersNow.getUTCMonth(), algiersNow.getUTCDate()))
  const todayStart = startOfDayAlgiers(todayUtc)
  const endStart = startOfDayAlgiers(endUtc)
  if (!todayStart || !endStart) return 0
  const diffMs = endStart.getTime() - todayStart.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

async function runUpdateCaseStatuses(contextSource) {
  const casesRef = db.collection('cases')
  const snapshot = await casesRef.get()

  const batch = db.batch()
  let updated = 0
  let total = 0

  snapshot.docs.forEach((docSnap) => {
    total++
    const data = docSnap.data()
    const prescriptionEndDate = data.prescriptionEndDate
    
    // Skip non-prescriptible cases (they have null prescriptionEndDate)
    if (prescriptionEndDate === null && data.status === 'NON_PRESCRIPTIBLE') {
      return // Nothing to update for non-prescriptible cases
    }

    const daysRemaining = getDaysRemaining(prescriptionEndDate)
    const newStatus = getStatusFromDaysRemaining(daysRemaining)

    if (data.status !== newStatus) {
      batch.update(docSnap.ref, { status: newStatus })
      updated++
    }
  })

  if (updated > 0) {
    await batch.commit()
  }

  const logEntry = {
    runAt: admin.firestore.FieldValue.serverTimestamp(),
    source: contextSource,
    totalCases: total,
    updatedCases: updated,
  }

  await db.collection('systemLogs').add({
    type: 'updateCaseStatuses',
    ...logEntry,
  })

  console.log(
    `[updateCaseStatuses] source=${contextSource} total=${total} updated=${updated}`,
  )

  return logEntry
}

exports.updateCaseStatuses = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('Africa/Algiers')
  .onRun(async () => {
    await runUpdateCaseStatuses('schedule')
    return null
  })

// Callable function to trigger status update manually by an authorized admin.
exports.runUpdateCaseStatuses = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'يجب تسجيل الدخول لاستدعاء هذه الدالة.',
    )
  }

  const uid = context.auth.uid
  const userDoc = await db.collection('users').doc(uid).get()
  const role = userDoc.exists ? userDoc.data().role : null

  if (role !== 'ATTORNEY_GENERAL') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'هذه العملية متاحة فقط للمستخدمين بدور محام عام.',
    )
  }

  const result = await runUpdateCaseStatuses('callable')
  return result
})