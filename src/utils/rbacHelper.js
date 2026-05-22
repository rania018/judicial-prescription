/**
 * Role-based access helpers for case visibility and actions.
 */

export const ROLES = {
  CLERK: 'CLERK',
  JUDGE: 'JUDGE',
  PUBLIC_PROSECUTOR: 'PUBLIC_PROSECUTOR',
  ATTORNEY_GENERAL: 'ATTORNEY_GENERAL',
}

const ROLE_ALIASES = {
  INVESTIGATING_JUDGE: ROLES.JUDGE,
  PROSECUTOR: ROLES.PUBLIC_PROSECUTOR,
}

export function normalizeRole(role) {
  if (!role) return null
  return ROLE_ALIASES[role] || role
}

export const PERMISSIONS = {
  [ROLES.CLERK]: {
    canCreateCase: true,
    canViewCase: true,
    canEditOwnCase: false,
    canTakeJudicialAction: false,
  },
  [ROLES.JUDGE]: {
    canCreateCase: false,
    canViewCase: true,
    canEditOwnCase: true,
    canTakeJudicialAction: true,
  },
  [ROLES.PUBLIC_PROSECUTOR]: {
    canCreateCase: false,
    canViewCase: true,
    canEditOwnCase: true,
    canTakeJudicialAction: true,
    canSupervise: true,
    supervisoryScopeField: 'courtId',
  },
  [ROLES.ATTORNEY_GENERAL]: {
    canCreateCase: false,
    canViewCase: true,
    canEditOwnCase: true,
    canTakeJudicialAction: true,
    canSupervise: true,
    canManageUsers: true,
    supervisoryScopeField: 'councilId',
  },
}

const INTERRUPTION_TYPES = [
  'INVESTIGATION',
  'PROSECUTION',
  'JUDICIAL_INVESTIGATION',
  'TRIAL',
]

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

  if (!caseScope || !userScope) {
    // Backward compatibility with pre-scope records.
    return true
  }

  return caseScope === userScope
}

export function getCaseAccessLevel({ userId, userRole, caseData, userContext }) {
  const normalizedRole = normalizeRole(userRole)
  if (!normalizedRole || !caseData || !userId) return 'none'

  if (!hasPermission(normalizedRole, 'canViewCase')) {
    return 'none'
  }

  const ownerId = getCaseOwnerId(caseData)
  const isOwner = ownerId === userId

  if (normalizedRole === ROLES.CLERK) {
    return 'read'
  }

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

export function canPerformInterruptionType(userRole, interruptionType) {
  const normalizedRole = normalizeRole(userRole)
  if (!hasPermission(normalizedRole, 'canTakeJudicialAction')) {
    return false
  }
  return INTERRUPTION_TYPES.includes(interruptionType)
}

export function getAllowedInterruptionTypes(userRole) {
  const normalizedRole = normalizeRole(userRole)
  if (!hasPermission(normalizedRole, 'canTakeJudicialAction')) {
    return []
  }
  return INTERRUPTION_TYPES
}

export function canTakeJudicialActions(userRole, accessLevel) {
  const normalizedRole = normalizeRole(userRole)
  if (accessLevel !== 'edit') return false
  return hasPermission(normalizedRole, 'canTakeJudicialAction')
}
