import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

const AUDIT_COLLECTION = 'auditLogs'

export async function addAuditLog({ type, userId, details }) {
  try {
    await addDoc(collection(db, AUDIT_COLLECTION), {
      type,
      userId,
      details,
      createdAt: serverTimestamp(),
    })
  } catch (e) {
    // لا نمنع سير النظام إذا فشل تسجيل الأثر الرقابي
  }
}

