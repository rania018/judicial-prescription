import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// استبدل هذه القيم من إعدادات مشروع Firebase الخاص بك
const firebaseConfig = {
  apiKey: "AIzaSyAVZIxoijoHCk4DmEExJf0Y40Tv82pzJIU",
  authDomain: "judicial-prescription.firebaseapp.com",
  projectId: "judicial-prescription",
  storageBucket: "judicial-prescription.firebasestorage.app",
  messagingSenderId: "875635952776",
  appId: "1:875635952776:web:307f734db011b1d420233d"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app

