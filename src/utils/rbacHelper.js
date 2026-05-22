/**
 * Role-based access control helper for the criminal case statute of limitations management platform
 */

// Define user roles
export const ROLES = {
  CLERK: 'CLERK',               // أمين الضبط
  INVESTIGATING_JUDGE: 'INVESTIGATING_JUDGE', // قاضي التحقيق
  PROSECUTOR: 'PROSECUTOR',     // النيابة العامة
  ATTORNEY_GENERAL: 'ATTORNEY_GENERAL', // المحامي العام
}

// Define permissions for each role
export const PERMISSIONS = {
  // Clerk: Create file, view data. NO access to انقطاع/وقف buttons.
  [ROLES.CLERK]: {
    canCreateCase: true,
    canViewData: true,
    canAddInterruption: false, // NO interruption access
    canAddSuspension: false,   // NO suspension access
    canResumeSuspension: false,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  
  // Investigating Judge: Can ONLY trigger انقطاع type 3 (إجراءات التحقيق القضائي) on assigned files.
  [ROLES.INVESTIGATING_JUDGE]: {
    canCreateCase: false, // Judges typically don't create cases
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['JUDICIAL_INVESTIGATION'], // Only judicial investigation
    canAddSuspension: false,
    canResumeSuspension: false,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  
  // Prosecutor: Full access: create, view, suspend, trigger all 4 انقطاع types.
  [ROLES.PROSECUTOR]: {
    canCreateCase: true,
    canViewData: true,
    canAddInterruption: true,
    allowedInterruptionTypes: ['INVESTIGATION', 'PROSECUTION', 'JUDICIAL_INVESTIGATION', 'TRIAL'],
    canAddSuspension: true,
    canResumeSuspension: true,
    canViewInterruptions: true,
    canViewSuspensions: true,
  },
  
  // Attorney General: Administrative access
  [ROLES.ATTORNEY_GENERAL]: {
    canCreateCase: false, // Usually admins don't create cases
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

// Helper function to check if a user has a specific permission
export function hasPermission(userRole, permission) {
  if (!PERMISSIONS[userRole]) {
    return false;
  }
  
  return Boolean(PERMISSIONS[userRole][permission]);
}

// Helper function to check if a user can perform a specific interruption type
export function canPerformInterruptionType(userRole, interruptionType) {
  if (!hasPermission(userRole, 'canAddInterruption')) {
    return false;
  }
  
  const allowedTypes = PERMISSIONS[userRole].allowedInterruptionTypes;
  if (!allowedTypes) {
    // If no specific types defined, allow all types that user has general permission for
    return true;
  }
  
  return allowedTypes.includes(interruptionType);
}

// Helper function to get allowed interruption types for a role
export function getAllowedInterruptionTypes(userRole) {
  if (!hasPermission(userRole, 'canAddInterruption')) {
    return [];
  }
  
  return PERMISSIONS[userRole].allowedInterruptionTypes || [];
}

// Helper function to check user role
export function isRole(userRole, expectedRole) {
  return userRole === expectedRole;
}