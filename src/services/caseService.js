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
import { calculatePrescription } from '../utils/prescription'
import { getCaseStatus, normalizeStatus } from '../utils/statusHelpers'
import {
  canPerformInterruptionType,
  canTakeJudicialActions,
  getCaseAccessLevel,
  normalizeRole,
} from '../utils/rbacHelper'
import { addAuditLog } from './auditService'

const CASES_COLLECTION = 'cases'

function normalizeCaseRecord(data) {
  if (!data) return data
  return {
    ...data,
    caseReference: data.caseReference || data.caseCode || '',
  }
}

export function computeCaseStatus(prescriptionEndDate, suspensionHistory) {
  return getCaseStatus(prescriptionEndDate, suspensionHistory)
}

function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function assertJudicialEditAllowed({ userRole, userId, caseData, userContext }) {
  const accessLevel = getCaseAccessLevel({ userId, userRole, caseData, userContext })
  if (!canTakeJudicialActions(userRole, accessLevel)) {
    throw new Error('لا تملك صلاحية اتخاذ إجراءات قضائية على هذه القضية.')
  }
}

function assertActionDateNotFuture(actionDate) {
  const date = toDate(actionDate)
  if (!date) {
    throw new Error('تاريخ الإجراء غير صالح.')
  }

  const today = new Date()
  today.setHours(23, 59, 59, 999)
  if (date > today) {
    throw new Error('لا يمكن اختيار تاريخ مستقبلي للإجراء.')
  }
}

export async function createCase(baseData, userId, userProfile = {}) {
  const normalizedRole = normalizeRole(userProfile.role)
  const assignedTo = baseData.assignedTo || userId

  const { prescriptionStartDate, prescriptionEndDate } = calculatePrescription({
    trackType: baseData.trackType,
    crimeType: baseData.crimeType,
    crimeDate: baseData.crimeDate,
    severityLevel: baseData.severityLevel,
    customPenaltyDuration: baseData.customPenaltyDuration,
    sentenceYears: baseData.sentenceYears,
    isMinor: baseData.isMinor || false,
    minorBirthDate: baseData.minorBirthDate || null,
  })

  const payload = {
    caseReference: (baseData.caseReference || '').trim(),
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
    status: computeCaseStatus(prescriptionEndDate),
    assignedTo,
    createdBy: userId,
    createdByRole: normalizedRole || null,
    courtId: baseData.courtId || userProfile.courtId || null,
    councilId: baseData.councilId || userProfile.councilId || null,
    createdAt: serverTimestamp(),
    interruptionHistory: [],
    suspensionHistory: [],
  }

  const ref = await addDoc(collection(db, CASES_COLLECTION), payload)
  const snapshot = await getDoc(ref)
  await addAuditLog({
    type: 'CASE_CREATED',
    userId,
    details: {
      caseId: ref.id,
      caseReference: payload.caseReference,
      crimeType: baseData.crimeType,
      assignedTo,
    },
  })

  return { id: ref.id, ...normalizeCaseRecord(snapshot.data()) }
}

export async function listCases({
  status,
  caseReference,
  caseCode,
  crimeType,
  assignedTo,
  userId,
  userRole,
  userContext,
} = {}) {
  const colRef = collection(db, CASES_COLLECTION)
  const baseConstraints = []

  if (crimeType && crimeType !== 'ALL') {
    baseConstraints.push(where('crimeType', '==', crimeType))
  }

  if (assignedTo) {
    baseConstraints.push(where('assignedTo', '==', assignedTo))
  }

  const normalizedReference = (caseReference || caseCode || '').trim()
  const hasReferenceFilter = normalizedReference.length > 0

  const referenceConstraints = hasReferenceFilter
    ? [...baseConstraints, where('caseReference', '==', normalizedReference)]
    : baseConstraints

  const q = referenceConstraints.length
    ? query(colRef, ...referenceConstraints, orderBy('prescriptionEndDate', 'asc'))
    : query(colRef, orderBy('prescriptionEndDate', 'asc'))

  let docs = (await getDocs(q)).docs
  if (hasReferenceFilter && docs.length === 0) {
    const legacyConstraints = [...baseConstraints, where('caseCode', '==', normalizedReference)]
    const legacyQuery = query(colRef, ...legacyConstraints, orderBy('prescriptionEndDate', 'asc'))
    docs = (await getDocs(legacyQuery)).docs
  }

  return docs
    .map((docSnap) => {
      const data = normalizeCaseRecord(docSnap.data())
      const currentStatus = getCaseStatus(data.prescriptionEndDate, data.suspensionHistory)
      const accessLevel = userId
        ? getCaseAccessLevel({
            userId,
            userRole,
            userContext,
            caseData: data,
          })
        : 'edit'
      return {
        id: docSnap.id,
        ...data,
        status: currentStatus,
        accessLevel,
        isEditable: accessLevel === 'edit',
      }
    })
    .filter((caseData) => !userId || caseData.accessLevel !== 'none')
    .filter(
      (caseData) =>
        !status ||
        status === 'ALL' ||
        normalizeStatus(caseData.status) === normalizeStatus(status),
    )
}

export async function getCaseById(caseId, accessOptions = {}) {
  const ref = doc(db, CASES_COLLECTION, caseId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    return null
  }

  const data = normalizeCaseRecord(snapshot.data())
  const currentStatus = getCaseStatus(data.prescriptionEndDate, data.suspensionHistory)
  const accessLevel = accessOptions.userId
    ? getCaseAccessLevel({
        userId: accessOptions.userId,
        userRole: accessOptions.userRole,
        userContext: accessOptions.userContext,
        caseData: data,
      })
    : 'edit'

  if (accessOptions.userId && accessLevel === 'none') {
    return null
  }

  return {
    id: snapshot.id,
    ...data,
    status: currentStatus,
    accessLevel,
    isEditable: accessLevel === 'edit',
  }
}

export async function listCaseActions(caseId) {
  const caseData = await getCaseById(caseId)
  if (!caseData) return []

  const interruptions = (caseData.interruptionHistory || []).map((entry) => ({
    id: `interrupt-${entry.id || entry.date}`,
    actionDate: entry.date,
    kind: 'INTERRUPTION',
    actionType: entry.type,
    notes: entry.notes,
    performedBy: entry.performedBy,
  }))

  const suspensions = (caseData.suspensionHistory || []).flatMap((entry) => {
    const startEntry = {
      id: `suspend-start-${entry.id || entry.startDate}`,
      actionDate: entry.startDate,
      kind: 'SUSPENSION_START',
      suspensionReason: entry.reason,
      notes: entry.notes,
      performedBy: entry.suspendedBy,
    }

    if (!entry.endDate) {
      return [startEntry]
    }

    return [
      startEntry,
      {
        id: `suspend-resume-${entry.id || entry.endDate}`,
        actionDate: entry.endDate,
        kind: 'SUSPENSION_RESUME',
        notes: 'تفعيل الأجل بعد زوال سبب الوقف',
        performedBy: entry.resumedBy,
      },
    ]
  })

  return [...interruptions, ...suspensions].sort((a, b) => {
    const aDate = toDate(a.actionDate)?.getTime() || 0
    const bDate = toDate(b.actionDate)?.getTime() || 0
    return bDate - aDate
  })
}

export async function addCaseInterruption(
  caseId,
  baseInterruption,
  userId,
  userRole,
  caseData,
  userContext,
) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.')
  }

  assertJudicialEditAllowed({ userRole, userId, caseData, userContext })
  if (!canPerformInterruptionType(userRole, baseInterruption.actionType)) {
    throw new Error('نوع إجراء الانقطاع غير مسموح لهذا الدور.')
  }
  assertActionDateNotFuture(baseInterruption.actionDate)

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

  const updatedInterruptionHistory = [
    ...(caseData.interruptionHistory || []),
    {
      id: interruptionRef.id,
      type: baseInterruption.actionType,
      date: baseInterruption.actionDate,
      performedBy: userId,
      notes: baseInterruption.notes,
    },
  ]

  const { prescriptionStartDate, prescriptionEndDate } = calculatePrescription({
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

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    interruptionHistory: updatedInterruptionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: getCaseStatus(prescriptionEndDate, updatedSuspensionHistory),
  })
}

export async function addCaseSuspension(
  caseId,
  suspensionData,
  userId,
  userRole,
  caseData,
  userContext,
) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.')
  }

  assertJudicialEditAllowed({ userRole, userId, caseData, userContext })
  assertActionDateNotFuture(suspensionData.actionDate)

  const hasActiveSuspension = (caseData.suspensionHistory || []).some(
    (suspension) => !suspension.endDate,
  )
  if (hasActiveSuspension) {
    throw new Error('لا يمكن إضافة وقف جديد قبل تفعيل الأجل للوقف النشط.')
  }

  const reason = (suspensionData.suspensionReason || '').trim()
  if (!reason) {
    throw new Error('سبب الوقف مطلوب.')
  }

  const suspensionsRef = collection(db, CASES_COLLECTION, caseId, 'suspensions')
  const payload = {
    ...suspensionData,
    suspensionReason: reason,
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
      suspensionReason: reason,
      startDate: suspensionData.actionDate,
    },
  })

  const updatedSuspensionHistory = [
    ...(caseData.suspensionHistory || []),
    {
      id: suspensionRef.id,
      startDate: suspensionData.actionDate,
      reason,
      suspendedBy: userId,
      notes: suspensionData.notes,
    },
  ]

  const { prescriptionStartDate, prescriptionEndDate } = calculatePrescription({
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

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    suspensionHistory: updatedSuspensionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: getCaseStatus(prescriptionEndDate, updatedSuspensionHistory),
  })
}

export async function resumeCaseFromSuspension(
  caseId,
  resumeData,
  userId,
  userRole,
  caseData,
  userContext,
) {
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') {
    throw new Error('لا يمكن تعديل حالة تقادم قضية منتهية أو مستثناة.')
  }

  assertJudicialEditAllowed({ userRole, userId, caseData, userContext })
  assertActionDateNotFuture(resumeData.actionDate)

  const activeSuspension = (caseData.suspensionHistory || []).find(
    (suspension) => !suspension.endDate,
  )
  if (!activeSuspension) {
    throw new Error('لا توجد حالة وقف نشطة لهذه القضية.')
  }

  const resumeDate = toDate(resumeData.actionDate)
  const suspensionStartDate = toDate(activeSuspension.startDate)
  if (resumeDate && suspensionStartDate && resumeDate < suspensionStartDate) {
    throw new Error('تاريخ التفعيل يجب أن يكون بعد تاريخ بدء الوقف.')
  }

  const suspensionRef = doc(db, CASES_COLLECTION, caseId, 'suspensions', activeSuspension.id)
  await updateDoc(suspensionRef, {
    endDate: resumeData.actionDate,
    resumedBy: userId,
  })

  const updatedSuspensionHistory = [...(caseData.suspensionHistory || [])]
  const idx = updatedSuspensionHistory.findIndex(
    (suspension) => suspension.id === activeSuspension.id,
  )
  if (idx !== -1) {
    updatedSuspensionHistory[idx] = {
      ...updatedSuspensionHistory[idx],
      endDate: resumeData.actionDate,
      resumedBy: userId,
    }
  }

  const { prescriptionStartDate, prescriptionEndDate } = calculatePrescription({
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

  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    suspensionHistory: updatedSuspensionHistory,
    prescriptionStartDate,
    prescriptionEndDate,
    status: getCaseStatus(prescriptionEndDate, updatedSuspensionHistory),
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
