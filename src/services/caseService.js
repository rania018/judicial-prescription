import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { calculatePrescription, getDaysRemaining } from '../utils/prescription'
import { addAuditLog } from './auditService'

const CASES_COLLECTION = 'cases'

/**
 * Compute the ACTIVE/WARNING/URGENT/CRITICAL/EXPIRED/NON_PRESCRIPTIBLE status
 * from a prescription end date.  Extracted to avoid repeating this logic in
 * every mutation function.
 *
 * @param {Date|null} prescriptionEndDate
 * @returns {string}
 */
export function computeCaseStatus(prescriptionEndDate) {
  if (prescriptionEndDate === null) return 'NON_PRESCRIPTIBLE'
  const daysRemaining = getDaysRemaining(prescriptionEndDate)
  if (daysRemaining === null) return 'NON_PRESCRIPTIBLE'
  if (daysRemaining <= 0) return 'EXPIRED'
  if (daysRemaining <= 7) return 'CRITICAL'
  if (daysRemaining <= 15) return 'URGENT'
  if (daysRemaining <= 90) return 'WARNING'
  return 'ACTIVE'
}

/**
 * Create a new case.
 *
 * @param {object} baseData  - form data from نموذج_قضية
 * @param {string} userId    - UID of the user creating the case (typically a CLERK)
 * @param {object} [userProfile] - full user profile from AuthContext; used to
 *   populate courtId / councilId scope fields on the case document.
 */
export async function createCase(baseData, userId, userProfile) {
  // Prepare data for calculation
  const { 
    prescriptionStartDate, 
    prescriptionEndDate 
  } = calculatePrescription({
    trackType: baseData.trackType,
    crimeType: baseData.crimeType,
    crimeDate: baseData.crimeDate,
    severityLevel: baseData.severityLevel,
    customPenaltyDuration: baseData.customPenaltyDuration,
    sentenceYears: baseData.sentenceYears,
    isMinor: baseData.isMinor || false,
    minorBirthDate: baseData.minorBirthDate || null,
  })

  const status = computeCaseStatus(prescriptionEndDate)

  const payload = {
    caseReference: baseData.caseReference,
    trackType: baseData.trackType,
    crimeType: baseData.crimeType,
    severityLevel: baseData.severityLevel,
    customPenaltyDuration: baseData.customPenaltyDuration,
    judicialAuthority: baseData.judicialAuthority,
    judicialOfficer: baseData.judicialOfficer,
    crimeDate: baseData.crimeDate,
    isMinor: baseData.isMinor || false,
    minorBirthDate: baseData.minorBirthDate || null,
    prescriptionStartDate,
    prescriptionEndDate,
    status,
    createdBy: userId,
    createdAt: serverTimestamp(),
    interruptionHistory: [],
    suspensionHistory: [],
    // Ownership / scope fields (Phase 1 foundation)
    // assignedTo: the UID of the judicial officer responsible for this case.
    // Defaults to null; set explicitly when a clerk assigns a case to a judge.
    assignedTo: baseData.assignedTo ?? null,
    // courtId / councilId: copied from the creating user's profile so that
    // supervisory roles (PUBLIC_PROSECUTOR, ATTORNEY_GENERAL) can query cases
    // within their organisational scope.
    courtId: userProfile?.courtId ?? null,
    councilId: userProfile?.councilId ?? null,
  }

  const ref = await addDoc(collection(db, CASES_COLLECTION), payload)
  const snapshot = await getDoc(ref)
  await addAuditLog({
    type: 'CASE_CREATED',
    userId,
    details: {
      caseId: ref.id,
      caseReference: baseData.caseReference,
      crimeType: baseData.crimeType,
    },
  })
  return { id: ref.id, ...snapshot.data() }
}

export async function listCases({ status, caseReference, crimeType, assignedTo } = {}) {
  const colRef = collection(db, CASES_COLLECTION)
  const constraints = []

  if (status && status !== 'ALL') {
    constraints.push(where('status', '==', status))
  }

  if (caseReference && caseReference.trim().length > 0) {
    constraints.push(where('caseReference', '==', caseReference.trim()))
  }

  if (crimeType && crimeType !== 'ALL') {
    constraints.push(where('crimeType', '==', crimeType))
  }

  // Scope to a specific owner when requested (e.g. JUDGE role viewing own cases)
  if (assignedTo) {
    constraints.push(where('assignedTo', '==', assignedTo))
  }

  const q = constraints.length
    ? query(colRef, ...constraints, orderBy('prescriptionEndDate', 'asc'))
    : query(colRef, orderBy('prescriptionEndDate', 'asc'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function getCaseById(caseId) {
  const ref = doc(db, CASES_COLLECTION, caseId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    return null
  }
  return { id: snapshot.id, ...snapshot.data() }
}

export async function listCaseActions(caseId) {
  const actionsRef = collection(db, CASES_COLLECTION, caseId, 'interruptions')
  const q = query(actionsRef, orderBy('actionDate', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function addCaseInterruption(caseId, baseInterruption, userId, caseData) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.');
  }

  const interruptionsRef = collection(db, CASES_COLLECTION, caseId, 'interruptions')
  const payload = {
    ...baseInterruption,
    createdBy: userId,
    createdAt: serverTimestamp(),
  }

  const interruptionRef = await addDoc(interruptionsRef, payload)
  await addAuditLog({
    type: 'INTERRUPTION_ADDED',
    userId,
    details: {
      caseId,
      caseReference: caseData.caseReference,
      interruptionId: interruptionRef.id,
      interruptionType: baseInterruption.actionType,
      actionDate: baseInterruption.actionDate,
    },
  })

  // Update the case's interruption history
  const updatedInterruptionHistory = [
    ...(caseData.interruptionHistory || []),
    {
      id: interruptionRef.id,
      type: baseInterruption.actionType,
      date: baseInterruption.actionDate,
      performedBy: userId,
      notes: baseInterruption.notes,
    }
  ]

  // Recalculate prescription dates due to interruption
  const { 
    prescriptionStartDate, 
    prescriptionEndDate 
  } = calculatePrescription({
    trackType: caseData.trackType,
    crimeType: caseData.crimeType,
    crimeDate: caseData.crimeDate,
    severityLevel: caseData.severityLevel,
    customPenaltyDuration: caseData.customPenaltyDuration,
    sentenceYears: caseData.sentenceYears,
    isMinor: caseData.isMinor || false,
    minorBirthDate: caseData.minorBirthDate || null,
    interruptionHistory: updatedInterruptionHistory,
    suspensionHistory: caseData.suspensionHistory,
  })

  // Determine new status
  const newStatus = computeCaseStatus(prescriptionEndDate)

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    interruptionHistory: updatedInterruptionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: newStatus,
  })
}

export async function addCaseSuspension(caseId, suspensionData, userId, caseData) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.');
  }

  const suspensionsRef = collection(db, CASES_COLLECTION, caseId, 'suspensions')
  const payload = {
    ...suspensionData,
    suspendedBy: userId,
    createdAt: serverTimestamp(),
  }

  const suspensionRef = await addDoc(suspensionsRef, payload)
  await addAuditLog({
    type: 'SUSPENSION_ADDED',
    userId,
    details: {
      caseId,
      caseReference: caseData.caseReference,
      suspensionId: suspensionRef.id,
      suspensionReason: suspensionData.suspensionReason,
      startDate: suspensionData.actionDate,
    },
  })

  // Update the case's suspension history
  const updatedSuspensionHistory = [
    ...(caseData.suspensionHistory || []),
    {
      id: suspensionRef.id,
      startDate: suspensionData.actionDate,
      reason: suspensionData.suspensionReason,
      suspendedBy: userId,
      notes: suspensionData.notes,
    }
  ]

  // Recalculate prescription dates due to suspension
  const { 
    prescriptionStartDate, 
    prescriptionEndDate 
  } = calculatePrescription({
    trackType: caseData.trackType,
    crimeType: caseData.crimeType,
    crimeDate: caseData.crimeDate,
    severityLevel: caseData.severityLevel,
    customPenaltyDuration: caseData.customPenaltyDuration,
    sentenceYears: caseData.sentenceYears,
    isMinor: caseData.isMinor || false,
    minorBirthDate: caseData.minorBirthDate || null,
    interruptionHistory: caseData.interruptionHistory,
    suspensionHistory: updatedSuspensionHistory,
  })

  // Determine new status
  const newStatus = computeCaseStatus(prescriptionEndDate)

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    suspensionHistory: updatedSuspensionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: newStatus,
  })
}

export async function resumeCaseFromSuspension(caseId, resumeData, userId, caseData) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.');
  }

  // Find the active suspension (without endDate) to update
  const activeSuspension = caseData.suspensionHistory.find(s => !s.endDate)
  if (!activeSuspension) {
    throw new Error('لا توجد حالة وقف نشطة لهذه القضية.')
  }

  // Update the suspension record with end date
  const suspensionRef = doc(db, CASES_COLLECTION, caseId, 'suspensions', activeSuspension.id)
  await updateDoc(suspensionRef, {
    endDate: resumeData.actionDate,
    resumedBy: userId,
  })

  // Update the local suspension history
  const updatedSuspensionHistory = [...(caseData.suspensionHistory || [])]
  const idx = updatedSuspensionHistory.findIndex(s => s.id === activeSuspension.id)
  if (idx !== -1) {
    updatedSuspensionHistory[idx] = {
      ...updatedSuspensionHistory[idx],
      endDate: resumeData.actionDate,
      resumedBy: userId,
    }
  }

  // Recalculate prescription dates
  const { 
    prescriptionStartDate, 
    prescriptionEndDate 
  } = calculatePrescription({
    trackType: caseData.trackType,
    crimeType: caseData.crimeType,
    crimeDate: caseData.crimeDate,
    severityLevel: caseData.severityLevel,
    customPenaltyDuration: caseData.customPenaltyDuration,
    sentenceYears: caseData.sentenceYears,
    isMinor: caseData.isMinor || false,
    minorBirthDate: caseData.minorBirthDate || null,
    interruptionHistory: caseData.interruptionHistory,
    suspensionHistory: updatedSuspensionHistory,
  })

  // Determine new status
  const newStatus = computeCaseStatus(prescriptionEndDate)

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    suspensionHistory: updatedSuspensionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: newStatus,
  })

  await addAuditLog({
    type: 'SUSPENSION_RESUMED',
    userId,
    details: {
      caseId,
      caseReference: caseData.caseReference,
      suspensionId: activeSuspension.id,
      endDate: resumeData.actionDate,
    },
  })
}