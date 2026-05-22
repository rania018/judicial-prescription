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

// Export available roles for use in UI
export const AVAILABLE_ROLES = [
  { value: 'CLERK', label: 'أمين الضبط' },
  { value: 'JUDGE', label: 'قاضٍ' },
  { value: 'PUBLIC_PROSECUTOR', label: 'وكيل الجمهورية' },
  { value: 'ATTORNEY_GENERAL', label: 'المحامي العام' },
]