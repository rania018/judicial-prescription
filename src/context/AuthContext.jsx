import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import { normalizeRole } from '../utils/rbacHelper'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setRole(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(firebaseUser)
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          const normalizedRole = normalizeRole(data.role ?? null)
          setRole(normalizedRole)
          setProfile({
            uid: firebaseUser.uid,
            role: normalizedRole,
            displayName: data.displayName ?? firebaseUser.displayName ?? null,
            courtId: data.courtId ?? null,
            councilId: data.councilId ?? null,
            active: data.active !== false,
          })
        } else {
          setRole(null)
          setProfile({ uid: firebaseUser.uid, role: null, active: true })
        }
      } catch {
        setRole(null)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = {
    user,
    role,
    profile,
    // alias for compatibility with pre-merge Phase 2 code
    userProfile: profile,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
