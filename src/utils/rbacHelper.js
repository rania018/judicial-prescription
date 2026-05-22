/**
 * Role-based access helper.
 */

export const ROLES = {
  CLERK: 'CLERK',
  JUDGE: 'JUDGE',
  PUBLIC_PROSECUTOR: 'PUBLIC_PROSECUTOR',
  ATTORNEY_GENERAL: 'ATTORNEY_GENERAL',
  // legacy aliases
  INVESTIGATING_JUDGE: 'INVESTIGATING_JUDGE',
  PROSECUTOR: 'PROSECUTOR',
}

export function normalizeRole(role) {
  if (!role) return null
  if (role === ROLES.INVESTIGATING_JUDGE) return ROLES.JUDGE
  if (role === ROLES.PROSECUTOR) return ROLES.PUBLIC_PROSECUTOR
  return role
}

const INTERRUPTION_TYPES = [
  'INVESTIGATION',
  'PROSECUTION',
  'JUDICIAL_INVESTIGATION',
  'TRIAL',
]

export const PERMISSIONS = {
  [ROLES.CLERK]: {
    canCreateCase: true,
    canViewCase: true,
    canViewData: true,
    canTakeJudicialAction: false,
    canAddInterruption: false,
    canAddSuspension: false,
    canResumeSuspension: false,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  [ROLES.JUDGE]: {
    canCreateCase: false,
    canViewCase: true,
    canViewData: true,
    canTakeJudicialAction: true,
    canAddInterruption: true,
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
    allowedInterruptionTypes: INTERRUPTION_TYPES,
  },
  [ROLES.PUBLIC_PROSECUTOR]: {
    canCreateCase: false,
    canViewCase: true,
    canViewData: true,
    canTakeJudicialAction: true,
    canAddInterruption: true,
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
    canSupervise: true,
    supervisoryScopeField: 'courtId',
    allowedInterruptionTypes: INTERRUPTION_TYPES,
  },
  [ROLES.ATTORNEY_GENERAL]: {
    canCreateCase: false,
    canViewCase: true,
    canViewData: true,
    canTakeJudicialAction: true,
    canAddInterruption: true,
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
    canSupervise: true,
    canManageUsers: true,
    supervisoryScopeField: 'councilId',
    allowedInterruptionTypes: INTERRUPTION_TYPES,
  },
}

// legacy role permission compatibility
PERMISSIONS[ROLES.INVESTIGATING_JUDGE] = {
  ...PERMISSIONS[ROLES.JUDGE],
  canAddSuspension: false,
  canResumeSuspension: false,
  allowedInterruptionTypes: ['JUDICIAL_INVESTIGATION'],
}
PERMISSIONS[ROLES.PROSECUTOR] = PERMISSIONS[ROLES.PUBLIC_PROSECUTOR]

export function hasPermission(userRole, permission) {
  const normalizedRole = normalizeRole(userRole)
  if (!normalizedRole || !PERMISSIONS[normalizedRole]) return false
  return Boolean(PERMISSIONS[normalizedRole][permission])
}

function getCaseOwnerId(caseData) {
  return caseData?.assignedTo || caseData?.createdBy || null
}

function isCaseInSupervisoryScope(caseData, userContext, normalizedRole) {
  const scopeField = PERMISSIONS[normalizedRole]?.supervisoryScopeField
  if (!scopeField) return true
  const caseScope = caseData?.[scopeField]
  const userScope = userContext?.[scopeField]
  if (!caseScope || !userScope) return true
  return caseScope === userScope
}

export function getCaseAccessLevel({ userId, userRole, caseData, userContext }) {
  const normalizedRole = normalizeRole(userRole)
  if (!normalizedRole || !caseData || !userId) return 'none'
  if (!hasPermission(normalizedRole, 'canViewCase')) return 'none'

  const ownerId = getCaseOwnerId(caseData)
  const isOwner = ownerId === userId || !ownerId

  if (normalizedRole === ROLES.CLERK) return 'read'

  if (normalizedRole === ROLES.JUDGE) {
    return isOwner ? 'edit' : 'none'
  }

  if (normalizedRole === ROLES.PUBLIC_PROSECUTOR || normalizedRole === ROLES.ATTORNEY_GENERAL) {
    if (!isCaseInSupervisoryScope(caseData, userContext, normalizedRole)) {
      return 'none'
    }
    return isOwner ? 'edit' : 'read'
  }

  return isOwner ? 'edit' : 'none'
}

export function canTakeJudicialActions(userRole, accessLevel) {
  const normalizedRole = normalizeRole(userRole)
  if (accessLevel !== 'edit') return false
  return hasPermission(normalizedRole, 'canTakeJudicialAction')
}

// Compatibility helpers used by older call sites
export function canViewCase(userProfile, caseData) {
  if (!userProfile || !caseData) return false
  return (
    getCaseAccessLevel({
      userId: userProfile.uid,
      userRole: userProfile.role,
      userContext: userProfile,
      caseData,
    }) !== 'none'
  )
}

export function canEditCase(userProfile, caseData) {
  if (!userProfile || !caseData) return false
  const accessLevel = getCaseAccessLevel({
    userId: userProfile.uid,
    userRole: userProfile.role,
    userContext: userProfile,
    caseData,
  })
  return canTakeJudicialActions(userProfile.role, accessLevel)
}

export function canPerformJudicialAction(userProfile, caseData) {
  return canEditCase(userProfile, caseData)
}

export function canManageUsers(userProfile) {
  if (!userProfile) return false
  return normalizeRole(userProfile.role) === ROLES.ATTORNEY_GENERAL
}

export function canPerformInterruptionType(userRole, interruptionType) {
  const normalizedRole = normalizeRole(userRole)
  if (!hasPermission(normalizedRole, 'canAddInterruption')) return false
  const allowedTypes = PERMISSIONS[normalizedRole]?.allowedInterruptionTypes
  if (!allowedTypes) return true
  return allowedTypes.includes(interruptionType)
}

export function getAllowedInterruptionTypes(userRole) {
  const normalizedRole = normalizeRole(userRole)
  if (!hasPermission(normalizedRole, 'canAddInterruption')) return []
  return PERMISSIONS[normalizedRole]?.allowedInterruptionTypes || []
}

export function isRole(userRole, expectedRole) {
  return normalizeRole(userRole) === normalizeRole(expectedRole)
}
