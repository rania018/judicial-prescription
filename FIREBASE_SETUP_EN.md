# Firebase project setup

Step-by-step guide to connect the **Judicial Prescription Deadlines System** to Firebase.

---

## 1. Create a Firebase project

1. Go to the Firebase Console: `https://console.firebase.google.com/`.
2. Click **Add project**.
3. Enter a project name (e.g. `judicial-prescription`) and follow the wizard.
4. You can disable Google Analytics if you don't need it.
5. Click **Create project**, then **Continue**.

---

## 2. Register the web app

1. In your project overview, click the **Web app** icon (</>).
2. Enter an **App nickname** (e.g. `Prescription System`).
3. You do **not** need to enable Hosting at this step (we'll configure it later via CLI).
4. Click **Register app**.
5. Copy the `firebaseConfig` object that appears (it will look like this):

```javascript
const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abc...',
}
```

6. In your codebase, open **`src/firebase/config.js`** and replace the placeholder values in `firebaseConfig` with your real values from the console.

---

## 3. Enable Authentication (Email/Password)

1. In the left menu: **Build → Authentication**.
2. Click **Get started**.
3. Open the **Sign-in method** tab.
4. Enable **Email/Password** and click **Save**.
5. Make sure **Anonymous** sign-in is **disabled** (we don't allow anonymous access).

---

## 4. Create the Firestore database

1. In the left menu: **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** and continue.
4. Choose a region (for example `europe-west1`) and click **Enable**.
5. After the database is created, go to the **Rules** tab.
6. Copy the content of the **`firestore.rules`** file from the project root and paste it into the Rules editor, then click **Publish**.

---

## 5. Set up the `users` collection and roles

The app expects a `users` collection where each document:

- Has the document ID = user UID (from Authentication).
- Has a `role` field with one of:
  - `CLERK`
  - `JUDGE`
  - `PUBLIC_PROSECUTOR`
  - `ATTORNEY_GENERAL`

### Option A: Create test users with the script (recommended)

The project includes a script that creates four test accounts in Firebase Auth and sets their profiles in Firestore (password: `test123`).

1. Download your Firebase service account key: **Project settings** → **Service accounts** → **Generate new private key**.
2. Set the environment variable to the JSON file path:
   - **PowerShell:**  
     `$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-project-firebase-adminsdk-xxxxx.json"`
   - **Bash:**  
     `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-project-firebase-adminsdk-xxxxx.json"`
3. From the project root run:
   ```bash
   npm run create-test-users
   ```
4. The script creates (or resets password for) `clerk@test.com`, `judge@test.com`, `prosecutor@test.com`, `attorney@test.com` with password `test123` and writes role/profile fields to Firestore (`displayName`, `active`, `courtId`, `councilId`). You can then log in from the app.

### Option B: Create users manually

1. In Firestore, click **Start collection**.
2. Collection ID: `users` → **Next**.
3. Document ID: use the **UID** of a user (you will get it from Authentication after creating the first user, see section 6).
4. Add a field:
   - **Field**: `role`
   - **Type**: string
   - **Value**: one of `CLERK`, `JUDGE`, `PUBLIC_PROSECUTOR`, or `ATTORNEY_GENERAL`.
5. Save the document.
6. Repeat to create additional user documents (each with ID = UID from Authentication).

---

## 6. Create the first user

1. Run the app locally: `npm run dev`.
2. Open the login page in your browser.
3. There is **no self-signup** in the UI; you must create users from the Firebase Console:
   - Go to **Authentication → Users → Add user**.
   - Enter an email and password, then click **Add user**.
4. Copy the **User UID** that appears.
5. In Firestore, create a new document in the **`users`** collection:
   - Document ID = the same UID.
   - Field `role` = `CLERK` (or `JUDGE` / `PUBLIC_PROSECUTOR` / `ATTORNEY_GENERAL` depending on the user).
6. You can now log in to the app using this email and password.

---

## 7. Cloud Functions (daily prescription status update)

The scheduled Cloud Function updates the `status` field of every case once every 24 hours according to the remaining days until `prescriptionEndDate`.

1. Install the Firebase CLI if you don't have it:

```bash
npm install -g firebase-tools
```

2. Log in and initialize Firebase in your local project:

```bash
firebase login
cd C:\\Users\\Mouez\\Desktop\\dev\\judicial-prescription
firebase init
```

3. During `firebase init`:
   - Select **Functions** and **Firestore** (and optionally **Hosting** if you want to deploy the frontend).
   - When asked for the project, choose the Firebase project you created earlier.
   - Functions language: **JavaScript**.
   - ESLint: optional.
   - Install dependencies: **Yes**.

4. Replace the content of **`functions/index.js`** with the one in this repository (it defines the scheduled `updateCaseStatuses` function).

5. Deploy the functions:

```bash
firebase deploy --only functions
```

The function `updateCaseStatuses` is scheduled with a daily Pub/Sub cron (`0 0 * * *`, time zone `Africa/Algiers`) and updates case `status` based on remaining days:

- `<= 0` days → `EXPIRED`
- `<= 7` days → `CRITICAL`
- `<= 15` days → `URGENT`
- `<= 90` days → `WARNING`
- `> 90` days → `ACTIVE`

---

## 8. Deploy so you can access the app online

To put the app on the web and open it from any browser:

### One-time setup (if not done yet)

1. **Install Firebase CLI** (if needed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Log in and select project**:
   ```bash
   firebase login
   firebase use <your-project-id>
   ```
   Get your project ID from [Firebase Console](https://console.firebase.google.com) → Project settings.

3. **Fill in `src/firebase/config.js`** with your project’s config (same as in the console).

### Deploy

1. **Build the React app** (creates the `dist` folder):
   ```bash
   npm run build
   ```

2. **Deploy to Firebase Hosting** (and optionally Firestore rules + Functions):
   ```bash
   firebase deploy --only hosting
   ```
   Or deploy everything (hosting + Firestore rules + Cloud Functions):
   ```bash
   firebase deploy
   ```

3. **Open the site**  
   After deploy, the CLI prints the Hosting URL, for example:
   - `https://your-project-id.web.app`
   - `https://your-project-id.firebaseapp.com`

Use that URL to access the app online. Hosting is already set to use the `dist` folder and SPA rewrites to `index.html`.

---

## 9. Important project files (Firebase-related)

| File | Purpose |
|------|---------|
| `src/firebase/config.js` | Frontend Firebase configuration (must be filled from the console). |
| `firestore.rules` | Firestore security rules (deployed from the console or with `firebase deploy --only firestore:rules`). |
| `firebase.json` | Firebase Hosting and Functions config. |
| `functions/index.js` | Cloud Function to update case prescription status daily. |

---

## 10. Troubleshooting

- **Cannot log in**  
  - Check that the email/password pair exists in **Authentication → Users**.  
  - Make sure there is a matching document in the `users` collection with the same UID and a valid `role` value.

- **Insufficient permissions in the UI**  
  - Verify that `role` in the `users/{uid}` document is one of: `CLERK`, `JUDGE`, `PUBLIC_PROSECUTOR`, `ATTORNEY_GENERAL`.

- **Firestore permission errors**  
  - Open the **Rules** tab in Firestore and verify that the deployed rules match the contents of the `firestore.rules` file in this project.  
