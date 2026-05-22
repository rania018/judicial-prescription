/**
 * Role-based access control helper for the criminal case statute of limitations management platform.
 *
 * Role hierarchy (Phase 1 canonical roles):
 *   CLERK            (أمين الضبط)       – registration and extraction only; no judicial actions
 *   JUDGE            (قاضٍ)             – view and act on own assigned cases only
 *   PUBLIC_PROSECUTOR (وكيل الجمهورية)  – supervisory read on court cases; full edit on own cases
 *   ATTORNEY_GENERAL  (النائب العام)    – supervisory read on council cases; full edit on own cases
 *
 * Legacy role aliases preserved for backward compatibility with existing Firestore data:
 *   INVESTIGATING_JUDGE  → treated as JUDGE
 *   PROSECUTOR           → treated as PUBLIC_PROSECUTOR
 */

// Canonical role constants
export const ROLES = {
  CLERK: 'CLERK',
  JUDGE: 'JUDGE',
  PUBLIC_PROSECUTOR: 'PUBLIC_PROSECUTOR',
  ATTORNEY_GENERAL: 'ATTORNEY_GENERAL',
  // Legacy aliases – kept so existing user documents continue to work
  INVESTIGATING_JUDGE: 'INVESTIGATING_JUDGE',
  PROSECUTOR: 'PROSECUTOR',
}

/**
 * Normalise a stored role value to its canonical equivalent.
 * Call this wherever role comparisons are made so legacy data is handled transparently.
 */
export function normalizeRole(role) {
  if (role === ROLES.INVESTIGATING_JUDGE) return ROLES.JUDGE
  if (role === ROLES.PROSECUTOR) return ROLES.PUBLIC_PROSECUTOR
  return role
}

/** Returns true when the (raw or canonical) role represents a judicial officer. */
export function isJudgeRole(role) {
  const r = normalizeRole(role)
  return r === ROLES.JUDGE
}

/** Returns true when the role has supervisory (read-only) oversight capability. */
export function isSupervisoryRole(role) {
  const r = normalizeRole(role)
  return r === ROLES.PUBLIC_PROSECUTOR || r === ROLES.ATTORNEY_GENERAL
}

// ---------------------------------------------------------------------------
// Ownership-aware permission helpers
//
// userProfile shape: { uid, role, courtId, councilId, displayName, active }
// caseData shape:    { id, assignedTo, courtId, councilId, status, ... }
//
// Backward-compat note: legacy cases may not have an `assignedTo` field (null
// or undefined). Such unassigned cases are treated as accessible to all roles
// with appropriate access level to avoid breaking existing data.
// ---------------------------------------------------------------------------

/**
 * Returns true when the given user is allowed to view (read) the case.
 *
 * - CLERK: all cases (needed for data entry and printing)
 * - JUDGE: only own cases (assignedTo == uid); unassigned cases are accessible
 *   for backward compat
 * - PUBLIC_PROSECUTOR: own cases + all cases sharing the same courtId scope
 * - ATTORNEY_GENERAL: own cases + all cases sharing the same councilId scope
 */
export function canViewCase(userProfile, caseData) {
  if (!userProfile || !caseData) return false
  const role = normalizeRole(userProfile.role)
  const isUnassigned = !caseData.assignedTo

  if (role === ROLES.CLERK) return true

  if (role === ROLES.JUDGE) {
    return isUnassigned || caseData.assignedTo === userProfile.uid
  }

  if (role === ROLES.PUBLIC_PROSECUTOR) {
    if (caseData.assignedTo === userProfile.uid) return true
    if (isUnassigned) return true
    return Boolean(
      userProfile.courtId && caseData.courtId && userProfile.courtId === caseData.courtId,
    )
  }

  if (role === ROLES.ATTORNEY_GENERAL) {
    if (caseData.assignedTo === userProfile.uid) return true
    if (isUnassigned) return true
    return Boolean(
      userProfile.councilId &&
        caseData.councilId &&
        userProfile.councilId === caseData.councilId,
    )
  }

  return false
}

/**
 * Returns true when the user is allowed to edit (update) the case.
 *
 * Rules:
 *   - CLERK never edits judicial case actions
 *   - Judges and supervisory roles can edit only their own cases (assignedTo == uid)
 *   - Backward compat: if no assignedTo is set, non-CLERK roles retain edit access
 *   - Expired / non-prescriptible cases are never editable
 */
export function canEditCase(userProfile, caseData) {
  if (!userProfile || !caseData) return false
  if (caseData.status === 'EXPIRED' || caseData.status === 'NON_PRESCRIPTIBLE') return false
  const role = normalizeRole(userProfile.role)
  if (role === ROLES.CLERK) return false

  // Backward compat: unassigned legacy cases remain editable for judges/supervisory roles
  if (!caseData.assignedTo) {
    return role === ROLES.JUDGE || role === ROLES.PUBLIC_PROSECUTOR || role === ROLES.ATTORNEY_GENERAL
  }

  return caseData.assignedTo === userProfile.uid
}

/**
 * Returns true when the user is allowed to perform judicial actions
 * (add interruption / suspension) on the case.
 * CLERK is explicitly excluded; all other roles require case ownership.
 */
export function canPerformJudicialAction(userProfile, caseData) {
  if (!userProfile || !caseData) return false
  if (normalizeRole(userProfile.role) === ROLES.CLERK) return false
  return canEditCase(userProfile, caseData)
}

/** Returns true when the user is allowed to manage (create/update) other user accounts. */
export function canManageUsers(userProfile) {
  if (!userProfile) return false
  return userProfile.role === ROLES.ATTORNEY_GENERAL
}

// ---------------------------------------------------------------------------
// Per-role static permission tables (kept for backward compatibility and for
// cases where a case-context is not yet available).
// ---------------------------------------------------------------------------
export const PERMISSIONS = {
  [ROLES.CLERK]: {
    canCreateCase: true,
    canViewData: true,
    canAddInterruption: false,
    canAddSuspension: false,
    canResumeSuspension: false,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  [ROLES.JUDGE]: {
    canCreateCase: false,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['INVESTIGATION', 'PROSECUTION', 'JUDICIAL_INVESTIGATION', 'TRIAL'],
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  // Legacy alias entry – delegates to the same capabilities as JUDGE
  [ROLES.INVESTIGATING_JUDGE]: {
    canCreateCase: false,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['JUDICIAL_INVESTIGATION'],
    canAddSuspension: false,
    canResumeSuspension: false,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  [ROLES.PUBLIC_PROSECUTOR]: {
    canCreateCase: false,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['INVESTIGATION', 'PROSECUTION', 'JUDICIAL_INVESTIGATION', 'TRIAL'],
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  // Legacy alias entry – delegates to the same capabilities as PUBLIC_PROSECUTOR
  [ROLES.PROSECUTOR]: {
    canCreateCase: false,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['INVESTIGATION', 'PROSECUTION', 'JUDICIAL_INVESTIGATION', 'TRIAL'],
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  [ROLES.ATTORNEY_GENERAL]: {
    canCreateCase: false,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['INVESTIGATION', 'PROSECUTION', 'JUDICIAL_INVESTIGATION', 'TRIAL'],
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
    canManageUsers: true,
  },
}

// Legacy helpers preserved for backward compatibility with existing call sites

export function hasPermission(userRole, permission) {
  if (!PERMISSIONS[userRole]) return false
  return Boolean(PERMISSIONS[userRole][permission])
}

export function canPerformInterruptionType(userRole, interruptionType) {
  if (!hasPermission(userRole, 'canAddInterruption')) return false
  const allowedTypes = PERMISSIONS[userRole]?.allowedInterruptionTypes
  if (!allowedTypes) return true
  return allowedTypes.includes(interruptionType)
}

export function getAllowedInterruptionTypes(userRole) {
  if (!hasPermission(userRole, 'canAddInterruption')) return []
  return PERMISSIONS[userRole]?.allowedInterruptionTypes || []
}

export function isRole(userRole, expectedRole) {
  return userRole === expectedRole
}