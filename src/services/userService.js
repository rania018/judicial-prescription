import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const USERS_COLLECTION = 'users'

export async function listUsers() {
  const snapshot = await getDocs(collection(db, USERS_COLLECTION))
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }))
}

export async function getUser(id) {
  const ref = doc(db, USERS_COLLECTION, id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function updateUserRoleAndActive(id, { role, active }) {
  const ref = doc(db, USERS_COLLECTION, id)
  const payload = {}
  if (role) payload.role = role
  if (typeof active === 'boolean') payload.active = active
  await updateDoc(ref, payload)
}

/**
 * Update extended user profile fields including organisational scope metadata.
 * Only provided (non-undefined) fields are written.
 *
 * @param {string} id - Firestore user document ID (= Firebase Auth UID)
 * @param {{ role?: string, active?: boolean, displayName?: string, courtId?: string|null, councilId?: string|null }} fields
 */
export async function updateUserProfile(id, { role, active, displayName, courtId, councilId } = {}) {
  const ref = doc(db, USERS_COLLECTION, id)
  const payload = {}
  if (role !== undefined) payload.role = role
  if (typeof active === 'boolean') payload.active = active
  if (displayName !== undefined) payload.displayName = displayName
  if (courtId !== undefined) payload.courtId = courtId
  if (councilId !== undefined) payload.councilId = councilId
  await updateDoc(ref, payload)
}

// Canonical role list for use in UI dropdowns
export const AVAILABLE_ROLES = [
  { value: 'CLERK', label: 'أمين الضبط' },
  { value: 'JUDGE', label: 'قاضٍ' },
  { value: 'PUBLIC_PROSECUTOR', label: 'وكيل الجمهورية' },
  { value: 'ATTORNEY_GENERAL', label: 'النائب العام' },
  // Legacy values kept for backward compatibility with existing user documents
  { value: 'INVESTIGATING_JUDGE', label: 'قاضي التحقيق (قديم)' },
  { value: 'PROSECUTOR', label: 'النيابة العامة (قديم)' },
]