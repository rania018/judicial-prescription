# إعداد المشروع مع Firebase

دليل خطوة بخطوة لربط تطبيق «نظام متابعة آجال التقادم» بـ Firebase.

---

## 1. إنشاء مشروع Firebase

1. ادخل إلى [Firebase Console](https://console.firebase.google.com/).
2. انقر **إضافة مشروع** (أو **Add project**).
3. أدخل اسم المشروع (مثلاً: `judicial-prescription`) واتبع الخطوات.
4. يمكنك تعطيل Google Analytics إذا لم تحتجه.
5. انقر **إنشاء المشروع** ثم **متابعة**.

---

## 2. تسجيل تطبيق ويب

1. في لوحة المشروع، انقر أيقونة **ويب** (</>).
2. أدخل **اسم التطبيق** (مثلاً: `نظام التقادم`).
3. لا تفعّل Firebase Hosting الآن (سنضيفه لاحقاً).
4. انقر **تسجيل التطبيق**.
5. انسخ كائن `firebaseConfig` الذي يظهر (سيشبه التالي):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

6. في المشروع، افتح الملف **`src/firebase/config.js`** واستبدل قيم `firebaseConfig` بالقيم الحقيقية من وحدة التحكم.

---

## 3. تفعيل المصادقة (Authentication)

1. من القائمة الجانبية: **Build** → **Authentication**.
2. انقر **البدء** (Get started).
3. في تبويب **Sign-in method**، انقر **البريد الإلكتروني/كلمة المرور** (Email/Password).
4. فعّل **البريد الإلكتروني/كلمة المرور** ثم **حفظ**.
5. تأكد أن **الوصول المجهول** (Anonymous) معطّل إذا كنت تريد منع الدخول بدون حساب.

---

## 4. إنشاء قاعدة بيانات Firestore

1. من القائمة: **Build** → **Firestore Database**.
2. انقر **إنشاء قاعدة بيانات** (Create database).
3. اختر **وضع الإنتاج** (Production mode) ثم **التالي**.
4. اختر منطقة (مثلاً: `europe-west1`) ثم **تفعيل**.
5. بعد إنشاء القاعدة، اذهب إلى **قواعد** (Rules) والصق محتوى الملف **`firestore.rules`** الموجود في جذر المشروع، ثم **نشر**.

---

## 5. إعداد مجموعة المستخدمين والأدوار

التطبيق يتوقع مجموعة باسم **`users`**، كل مستند فيها معرّف المستخدم (UID) وحقل **`role`**.

1. في Firestore، انقر **ابدأ مجموعة** (Start collection).
2. **معرّف المجموعة**: `users` → **التالي**.
3. **معرّف المستند**: أدخل **UID** لأول مستخدم (تحصل عليه من Authentication بعد تسجيل المستخدم الأول، انظر الخطوة 6).
4. أضف حقل:
   - **الحقل**: `role`
   - **النوع**: string
   - **القيمة**: واحدة من: `CLERK` أو `JUDGE` أو `PUBLIC_PROSECUTOR` أو `ATTORNEY_GENERAL`
5. احفظ المستند.
6. كرر لإضافة مستخدمين آخرين (كل مستند معرّفه = UID من Authentication).

---

## 6. إنشاء أول مستخدم

1. شغّل التطبيق محلياً: `npm run dev`.
2. افتح صفحة تسجيل الدخول.
3. **لا يوجد تسجيل ذاتي في الواجهة**؛ أنت تحتاج إنشاء المستخدم من وحدة تحكم Firebase:
   - **Authentication** → **Users** → **Add user**.
   - أدخل بريداً إلكترونياً وكلمة مرور ثم **Add user**.
4. انسخ **User UID** المعروض.
5. في Firestore، أنشئ مستنداً جديداً داخل مجموعة **`users`**:
   - **معرّف المستند** = نفس الـ UID.
   - حقل `role` = `CLERK` (أو `JUDGE` / `PUBLIC_PROSECUTOR` / `ATTORNEY_GENERAL`).
6. بعد ذلك يمكنك تسجيل الدخول من الواجهة بهذا البريد وكلمة المرور.

---

## 7. Cloud Functions (تحديث حالة التقادم يومياً)

الدالة المجدولة تُحدّث حقل **`status`** في كل القضايا مرة كل 24 ساعة.

1. ثبّت Firebase CLI إن لم يكن مثبتاً:

```bash
npm install -g firebase-tools
```

2. تسجيل الدخول وربط المشروع:

```bash
firebase login
cd C:\Users\Mouez\Desktop\dev\judicial-prescription
firebase init
```

3. في `firebase init`:
   - اختر **Functions** و **Firestore** (واختيارياً **Hosting** للنشر لاحقاً).
   - المشروع: اختر المشروع الذي أنشأته.
   - لغة الدوال: **JavaScript**.
   - ESLint: حسب رغبتك.
   - تثبيت التبعيات: **نعم**.

4. استبدل محتوى **`functions/index.js`** بالمحتوى الموجود في مشروعك (دالة `updateCaseStatuses` المجدولة).

5. نشر الدوال:

```bash
firebase deploy --only functions
```

---

## 8. (اختياري) النشر على Firebase Hosting

1. في `firebase init` اختر **Hosting**.
2. مجلد النشر: `dist` (لأن Vite يبني في `dist`).
3. صفحة واحدة (SPA): **نعم**.
4. بعد بناء التطبيق:

```bash
npm run build
firebase deploy --only hosting
```

الرابط سيكون من نوع: `https://your-project-id.web.app`

---

## ملخص الملفات المهمة

| الملف | الغرض |
|--------|--------|
| `src/firebase/config.js` | إعدادات المشروع (يجب تعبئتها من Console) |
| `firestore.rules` | قواعد أمان Firestore (ينشر عبر Console أو `firebase deploy --only firestore:rules`) |
| `firebase.json` | إعدادات Hosting و Functions |
| `functions/index.js` | دالة تحديث حالة التقادم (كل 24 ساعة) |

---

## استكشاف الأخطاء

- **لا أستطيع تسجيل الدخول**: تأكد أن البريد/كلمة المرور صحيحان في Authentication، وأن مستند المستخدم في `users` موجود وبه حقل `role`.
- **صلاحية غير كافية**: تحقق أن قيمة `role` في Firestore هي واحدة من: `CLERK`, `JUDGE`, `PUBLIC_PROSECUTOR`, `ATTORNEY_GENERAL`.
- **أخطاء Firestore**: راجع تبويب **Rules** في Firestore وتأكد أن القواعد المطبقة هي نفس ملف `firestore.rules` في المشروع.
