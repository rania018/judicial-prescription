# Project Context: Judicial Prescription System

**Last Updated:** May 23, 2026

---

## Project Overview

### Project Name
**Judicial Prescription System** (نظام متابعة آجال التقادم)

### Main Purpose
A comprehensive web-based platform for managing and tracking the statute of limitations (prescription periods) for criminal cases in Algeria. The system implements complex Algerian criminal law requirements for prescription period calculations, interruptions, and suspensions.

### Business Goals
1. Automate criminal case limitation period tracking
2. Ensure legal compliance with Algerian criminal law
3. Provide role-based access control for different judicial authorities
4. Maintain complete audit trails for all case actions
5. Alert users when prescription periods approach expiration
6. Enable interruption and suspension of prescription timers
7. Support post-judgment penalty execution limitation tracking

### Main Features
1. **Dual-Track Prescription Management**
   - Track A: Pre-judgment limitation (تقادم الدعوى العمومية)
   - Track B: Post-judgment penalty execution limitation (تقادم العقوبة)

2. **Prescription Calculation Engine**
   - Calculates prescription duration based on crime type, severity, and track
   - Handles special conditions (hidden crimes, exempted crimes)
   - Supports custom penalty durations
   - Handles non-prescriptible crimes (terrorism, organized crime, corruption, state security)

3. **Interruption Management** (انقطاع)
   - Resets prescription clock to zero
   - Four procedural types:
     - Investigation procedures (البحث والتحري)
     - Prosecution procedures (مباشرة الدعوى)
     - Judicial investigation (التحقيق القضائي)
     - Trial procedures (المحاكمة)

4. **Suspension Management** (وقف)
   - Pauses prescription clock temporarily
   - Stores freeze timestamp and reason
   - Tracks multiple suspension periods
   - Can be resumed (continues from frozen value)

5. **Role-Based Access Control (RBAC)**
   - Clerk (أمين الضبط): Create cases, view data
   - Judge (قاضٍ): View assigned cases, trigger interruptions/suspensions
   - Public Prosecutor (وكيل الجمهورية): Full supervisory access, manage all case actions
   - Attorney General (النائب العام): System-wide administration, user management

6. **Case Status Management**
   - ACTIVE: >90 days remaining
   - WARNING: 15-90 days remaining
   - URGENT: 7-15 days remaining
   - CRITICAL: ≤7 days remaining
   - SUSPENDED: Prescription paused
   - EXPIRED: Prescription period expired
   - NON_PRESCRIPTIBLE: Not subject to limitation periods

7. **Notifications & Alerts**
   - Bell notification component for case updates
   - Prescription approaching expiration warnings
   - Status-based alerts

8. **Audit Logging**
   - Complete audit trail for all case modifications
   - Action logging for interruptions and suspensions
   - User activity tracking

### Target Users
- **Clerks (أمناء الضبط)**: Judicial office administrators who register new cases
- **Judges (قضاة)**: Judicial officers managing assigned cases
- **Public Prosecutors (وكلاء الجمهورية)**: Prosecution authority with supervisory powers
- **Attorney General (النائب العام)**: System administrator with full access

---

## Tech Stack

### Frontend Technologies
- **React** 19.2.0 - UI framework
- **TypeScript** 5.9.3 - Type safety
- **React Router DOM** 7.13.1 - Client-side routing
- **Vite** 7.3.1 - Build tool and dev server
- **CSS** (Global + Component styles) - Styling

### Backend/API Technologies
- **Firebase** 12.10.0 - Backend-as-a-Service
- **Firebase Authentication** - User authentication (email/password)
- **Cloud Firestore** - NoSQL database
- **Firebase Admin SDK** 13.7.0 - Server-side Firebase operations

### Database
- **Cloud Firestore** - Real-time NoSQL database
  - Collections: `cases`, `users`, `auditLogs`
  - Subcollections: `interruptions`, `suspensions` (under cases)
  - Security rules in `firestore.rules`

### State Management
- **React Context API** - Global state management
  - `AuthContext` - Authentication state
  - `ToastContext` - Toast notifications

### Authentication
- **Firebase Authentication** with email/password
- User profiles stored in Firestore `users` collection
- Role normalization for legacy role compatibility

### APIs
- **Firebase REST API** (through SDK)
- **Cloud Firestore API** - Direct database operations
- **Cloud Functions API** - Scheduled daily status updates

### Libraries and Frameworks
- **dayjs** 1.11.19 - Date/time handling (with Arabic locale)
- **firebase-admin** 13.7.0 - Backend Firebase operations
- **react-dom** 19.2.0 - React DOM rendering
- **firebase-functions** - Cloud Functions runtime

### Build Tools & Development
- **Vite** 7.3.1 - Fast build tool
- **TypeScript** 5.9.3 - Type checking
- **ESLint** 9.39.1 - Code linting
- **ESLint Plugins** - React-specific linting
- **Firebase CLI** - Deployment and management

---

## Project Structure

```
judicial-prescription/
├── src/
│   ├── components/
│   │   ├── جرس_التنبيهات.jsx                    → Bell notification component
│   │   ├── سجل_إجراءات_التقادم.jsx              → Interruption/suspension log
│   │   ├── شارة_الحالة.jsx                      → Status badge component
│   │   ├── شريط_الإشعارات.jsx                  → Notification bar
│   │   ├── مسار_محمي.jsx                       → Protected route component
│   │   ├── نموذج_إجراء.jsx                     → Interruption/suspension form
│   │   └── نموذج_قضية.jsx                     → Case creation/edit form
│   ├── context/
│   │   ├── AuthContext.jsx                     → Authentication context & hooks
│   │   └── ToastContext.jsx                    → Toast notification context
│   ├── pages/
│   │   ├── إدارة_المستخدمين.jsx                → User management (Attorney General only)
│   │   ├── إنشاء_قضية.jsx                      → New case creation
│   │   ├── القضايا.jsx                        → Cases list view
│   │   ├── تسجيل_الدخول.jsx                    → Login page
│   │   ├── تفاصيل_القضية.jsx                   → Case detail view & management
│   │   ├── طباعة_القضية.jsx                    → Case print view
│   │   ├── لوحة_التحكم.jsx                     → Dashboard with statistics
│   │   └── معلومات_التقادم.jsx                  → Prescription information page
│   ├── services/
│   │   ├── auditService.js                     → Audit logging operations
│   │   ├── caseService.js                      → Case CRUD & business logic
│   │   └── userService.js                      → User management operations
│   ├── styles/
│   │   ├── global.css                          → Global application styles
│   │   └── (component-specific styles in src/App.css)
│   ├── utils/
│   │   ├── dashboardAlerts.js                  → Dashboard alert logic
│   │   ├── prescription.js                     → Prescription calculation engine
│   │   ├── rbacHelper.js                       → Role-based access control
│   │   └── statusHelpers.js                    → Status labels and metadata
│   ├── firebase/
│   │   └── config.js                           → Firebase initialization
│   ├── App.tsx                                 → Main app component & routing
│   ├── App.css                                 → App component styles
│   ├── main.tsx                                → React app entry point
│   ├── index.css                               → Global styles
│   └── types.d.ts                              → TypeScript type definitions
├── functions/
│   ├── index.js                                → Cloud Functions (scheduled status updates)
│   └── package.json                            → Cloud Functions dependencies
├── public/                                     → Static assets
├── scripts/
│   ├── createTestUsers.js                      → Firebase test user creation script
│   └── migrateCasesToNewSchema.js              → Data migration script
├── firebase.json                               → Firebase project configuration
├── firestore.rules                             → Firestore security rules
├── vite.config.ts                              → Vite build configuration
├── tsconfig.json                               → TypeScript configuration
├── package.json                                → Project dependencies
└── README.md                                   → Project setup guide

```

---

## Architecture

### Application Flow
1. **Authentication Flow**
   - User enters email/password on login page
   - Firebase Authentication validates credentials
   - User document loaded from Firestore `users` collection
   - User role is normalized and stored in context
   - User redirected to dashboard or previous page

2. **Navigation & Routing**
   - React Router DOM handles client-side routing
   - Protected routes check authentication status
   - Navigation header shows different menu items based on user role
   - Role-based visibility of "User Management" menu item (Attorney General only)

3. **Case Management Flow**
   - Clerk creates new case via form with dynamic fields based on track type
   - Case assigned to judicial officer (judge/prosecutor)
   - Case data calculated for prescription duration
   - Case status updated daily via Cloud Function
   - Judges/Prosecutors can trigger interruptions/suspensions
   - All actions logged in audit trail

4. **Prescription Calculation Flow**
   - Crime date + crime type + track type → prescription duration calculation
   - Duration may be null for non-prescriptible crimes
   - Prescription end date = crime date + calculated duration
   - Daily Cloud Function calculates days remaining
   - Status updated based on days remaining
   - Interruptions reset timer to 0
   - Suspensions pause timer

### State Management Flow
- **AuthContext**: Manages user authentication state, role, and profile
- **ToastContext**: Manages toast notification display
- Component local state for forms and UI interactions
- Firestore real-time listeners for case data updates

### API Communication Flow
1. **Frontend to Firebase**
   - Uses Firebase SDK (not REST API)
   - Direct Firestore operations: `addDoc`, `getDoc`, `updateDoc`, `getDocs`
   - Query operations with `where`, `orderBy` for filtering
   - Real-time listeners via `onSnapshot` (where applicable)

2. **Cloud Functions to Firestore**
   - Cloud Function runs daily (scheduled via Cloud Scheduler)
   - Reads all cases from Firestore
   - Calculates remaining days for each case
   - Updates case status if changed
   - Logs operation to `systemLogs` collection

### Authentication Flow
```
User Credentials → Firebase Auth → Auth State Change
                                     ↓
                         Fetch user doc from Firestore
                                     ↓
                         Extract & normalize role
                                     ↓
                         Update AuthContext
                                     ↓
                         Update UI based on role
```

### Prescription Calculation Flow
```
Crime Data (type, date, severity) → calculatePrescriptionDuration()
                                          ↓
                        Duration (years) or null (non-prescriptible)
                                          ↓
                        calculatePrescriptionEndDate()
                                          ↓
                        prescriptionEndDate (Date or null)
                                          ↓
            Daily Cloud Function: getDaysRemaining()
                                          ↓
                        daysRemaining (number or null)
                                          ↓
                        getStatusFromDaysRemaining()
                                          ↓
                        status (ACTIVE/WARNING/URGENT/CRITICAL/EXPIRED/etc.)
```

### Routing Logic
```
/                          → Dashboard (protected)
/القضايا                   → Cases list (protected)
/قضية/:id                  → Case detail (protected)
/إنشاء-قضية               → New case form (protected, clerk only)
/إدارة-المستخدمين         → User management (protected, attorney general only)
/طباعة-قضية/:id           → Case print view (protected)
/معلومات-التقادم          → Prescription info page (protected)
/تسجيل-الدخول             → Login (public)
```

### Important Design Patterns
1. **Context Pattern**: Authentication and Toast notifications
2. **RBAC Pattern**: Role-based access at UI level and Firestore security rules level
3. **Service Layer**: `caseService`, `userService`, `auditService` abstract business logic
4. **Utility Functions**: Pure functions for calculations and status determination
5. **Component Composition**: Nested components with conditional rendering based on permissions

---

## Main Features

### 1. Case Registration & Management
- **Purpose**: Register new criminal cases and track their prescription periods
- **Related Files**: 
  - `src/pages/إنشاء_قضية.jsx` (creation)
  - `src/pages/تفاصيل_القضية.jsx` (detail view)
  - `src/components/نموذج_قضية.jsx` (form)
  - `src/services/caseService.js` (business logic)

- **Main Components**:
  - Case creation form with dynamic field rendering
  - Case detail view with edit capability
  - Prescription information display

- **Key Fields**:
  - `caseReference` - Unique case identifier
  - `trackType` - PROSECUTION or PENALTY_EXECUTION
  - `crimeType` - FELONY, SIMPLE_MISDEMEANOR, AGGRAVATED_MISDEMEANOR, VIOLATION, EXEMPTED
  - `crimeDate` - When the crime occurred
  - `severityLevel` - HIDDEN, EQUAL_TO_SENTENCE, CUSTOM
  - `prescriptionEndDate` - Calculated end of prescription period

### 2. Prescription Calculation Engine
- **Purpose**: Accurately calculate prescription periods according to Algerian law
- **Related Files**: 
  - `src/utils/prescription.js` (core calculations)
  - `src/services/caseService.js` (integration)
  - `functions/index.js` (daily updates)

- **Business Rules Implemented**:
  - Track A (PROSECUTION):
    - Felony: 15y default | 25y if hidden | 30y if death/life penalty | 20y if special provision
    - Simple misdemeanor: 5y base
    - Aggravated misdemeanor: 10y base
    - Violation: 2y
    - Hidden bonus: +5 years
  - Track B (PENALTY_EXECUTION):
    - Felony: 20y
    - Simple misdemeanor: 5y
    - Aggravated misdemeanor: = sentenced years
    - Violation: 2y
  - Non-prescriptible (null duration): Terrorism, organized crime, state security, corruption

### 3. Interruption Management
- **Purpose**: Reset prescription clock when procedural actions occur
- **Related Files**:
  - `src/components/سجل_إجراءات_التقادم.jsx` (log & interface)
  - `src/components/نموذج_إجراء.jsx` (form)
  - `src/services/caseService.js` (operations)

- **Main Components**:
  - Interruption form with 4 procedural types
  - Interruption history log
  - Date validation (no future dates)

- **Allowed Types**:
  1. INVESTIGATION (إجراءات البحث والتحري)
  2. PROSECUTION (إجراءات مباشرة الدعوى)
  3. JUDICIAL_INVESTIGATION (إجراءات التحقيق القضائي)
  4. TRIAL (إجراءات المحاكمة)

### 4. Suspension Management
- **Purpose**: Temporarily pause prescription clock
- **Related Files**:
  - `src/components/سجل_إجراءات_التقادم.jsx`
  - `src/components/نموذج_إجراء.jsx`
  - `src/services/caseService.js`

- **Main Features**:
  - Create suspension with start date and reason
  - Resume suspension (adds end date)
  - Track multiple suspension periods
  - Stores performer name and ID

### 5. Dashboard & Alerts
- **Purpose**: Provide overview of cases and status alerts
- **Related Files**:
  - `src/pages/لوحة_التحكم.jsx` (dashboard page)
  - `src/utils/dashboardAlerts.js` (alert logic)
  - `src/components/جرس_التنبيهات.jsx` (notification bell)

- **Dashboard Features**:
  - Case statistics by status
  - Recent cases
  - Approaching expiration warnings
  - User role-based alerts

### 6. User Management
- **Purpose**: Manage system users and their roles
- **Related Files**:
  - `src/pages/إدارة_المستخدمين.jsx` (admin page)
  - `src/services/userService.js` (operations)

- **Allowed Roles**:
  - CLERK (أمين الضبط)
  - JUDGE (قاضٍ)
  - PUBLIC_PROSECUTOR (وكيل الجمهورية)
  - ATTORNEY_GENERAL (النائب العام)

- **Legacy Roles** (still supported):
  - INVESTIGATING_JUDGE (normalized to JUDGE)
  - PROSECUTOR (normalized to PUBLIC_PROSECUTOR)

### 7. Case List & Filtering
- **Purpose**: View and filter all cases
- **Related Files**: `src/pages/القضايا.jsx`
- **Filter Capabilities**: By status, track type, crime type, date range
- **Role-Based Visibility**: Users see cases based on their permissions

### 8. Case Printing
- **Purpose**: Generate printable case reports
- **Related Files**: `src/pages/طباعة_القضية.jsx`
- **Content**: Complete case information with calculations and history

### 9. Audit Logging
- **Purpose**: Track all case modifications for compliance
- **Related Files**: `src/services/auditService.js`
- **Logged Actions**: Case creation, interruption, suspension, status updates
- **Retention**: Complete historical record in Firestore

---

## Database Structure

### Collections

#### `cases` Collection
Main collection storing criminal case records.

**Document Structure**:
```
{
  id: string (auto-generated)
  caseReference: string              // Unique case identifier
  trackType: 'PROSECUTION' | 'PENALTY_EXECUTION'
  crimeType: 'FELONY' | 'SIMPLE_MISDEMEANOR' | 'AGGRAVATED_MISDEMEANOR' | 'VIOLATION' | 'EXEMPTED'
  crimeDate: Date                    // When crime occurred
  severityLevel?: 'HIDDEN' | 'EQUAL_TO_SENTENCE' | 'CUSTOM'
  customPenaltyDuration?: number     // 1-30 years for custom track
  sentenceYears?: number             // For aggravated misdemeanor penalty track
  appearanceDate?: Date              // For hidden crimes
  nonPrescriptibleCategory?: string  // If EXEMPTED
  judicialAuthority: string          // Court/Council name
  judicialOfficer: string            // Judge/Prosecutor title
  
  prescriptionStartDate: Date        // Calculated
  prescriptionEndDate: Date | null   // Calculated (null if non-prescriptible)
  status: 'ACTIVE' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'SUSPENDED' | 'EXPIRED' | 'NON_PRESCRIPTIBLE'
  lastActionDate?: Date              // Last interruption/suspension
  
  createdBy: string (user UID)       // Who created the case
  createdAt: Timestamp               // Server timestamp
  assignedTo: string (user UID)      // Judge/Prosecutor assigned to case
  
  // Embedded history (for reference)
  interruptionHistory?: InterruptionRecord[]
  suspensionHistory?: SuspensionRecord[]
}
```

**Subcollection: `interruptions`**
Stores interruption records for a case.

```
{
  id: string (auto-generated)
  type: 'INVESTIGATION' | 'PROSECUTION' | 'JUDICIAL_INVESTIGATION' | 'TRIAL'
  date: Date                         // When interruption occurred
  performedBy: string (user UID)
  performedByName: string            // User display name for audit
  notes?: string                     // Optional notes
  createdAt: Timestamp
}
```

**Subcollection: `suspensions`**
Stores suspension records for a case.

```
{
  id: string (auto-generated)
  startDate: Date                    // When suspension started
  endDate?: Date                     // When suspension ended (null if active)
  reason: string                     // Why suspended
  suspendedBy: string (user UID)
  suspendedByName: string
  resumedBy?: string (user UID)      // Who resumed it
  resumedByName?: string
  createdAt: Timestamp
}
```

#### `users` Collection
Stores user profiles and role information.

```
{
  id: string (Firebase Auth UID)     // Must match auth UID
  role: 'CLERK' | 'JUDGE' | 'PUBLIC_PROSECUTOR' | 'ATTORNEY_GENERAL'
  displayName: string                // Full name
  courtId?: string                   // Court assignment (for judges)
  councilId?: string                 // Council assignment (for prosecutors)
  active: boolean                    // Is account active
  createdAt: Timestamp
  lastLogin?: Timestamp
}
```

#### `auditLogs` Collection
Stores audit trail of all system actions.

```
{
  id: string (auto-generated)
  type: string                       // Action type (CREATE_CASE, ADD_INTERRUPTION, etc.)
  userId: string (user UID)          // Who performed action
  details: {
    caseId?: string
    actionType?: string
    reason?: string
    // Additional context
  }
  createdAt: Timestamp
}
```

#### `systemLogs` Collection (Generated by Cloud Function)
Stores scheduled task execution logs.

```
{
  id: string (auto-generated)
  type: string                       // e.g., 'updateCaseStatuses'
  runAt: Timestamp
  source: string                     // Where function was triggered from
  totalCases: number
  updatedCases: number
}
```

### Key Relationships
- **Case → User**: `assignedTo` references user in `users` collection
- **Case → Interruptions**: Subcollection relationship
- **Case → Suspensions**: Subcollection relationship
- **AuditLog → User**: `userId` references user in `users` collection

### Indexes Required
- `cases`: compound index on (status, createdAt)
- `cases`: compound index on (assignedTo, status)
- `interruptions`: compound index on (date, performedBy)
- `suspensions`: compound index on (startDate, active)

---

## API Documentation

### Firebase SDK Operations (No REST API)
The application uses Firebase JavaScript SDK directly. Key operations:

#### Case Operations

**Create Case**
- Function: `createCase(baseData, userId, userProfile)`
- File: `src/services/caseService.js`
- Parameters:
  - `baseData`: Case creation data object
  - `userId`: Current user's UID
  - `userProfile`: User's profile with role
- Returns: `{ id, prescriptionStartDate, prescriptionEndDate, status }`
- Validation: Clerk role only, future dates rejected

**Get Case**
- Function: `getCaseById(caseId)`
- Returns: Case object with all fields
- Real-time: Firestore returns current server state

**Update Case**
- Function: `updateCase(caseId, updates, userId, userProfile)`
- Parameters: Case ID, update object, user context
- Validation: Role-based access control via Firestore security rules
- Non-expired cases only

**List Cases**
- Function: `getAllCases()` or with filters
- Returns: Array of case objects
- Filtering: Application layer (role-based visibility)

#### Interruption Operations

**Add Interruption**
- Function: `addInterruption(caseId, { type, date, performedBy, notes })`
- File: `src/services/caseService.js`
- Creates subcollection document
- Validates: Date not in future
- Effect: Resets prescription timer (tracked in history)

**Get Interruptions**
- Returns: Array of all interruptions for a case
- From subcollection: `cases/{caseId}/interruptions`

#### Suspension Operations

**Add Suspension**
- Function: `addSuspension(caseId, { startDate, reason, suspendedBy })`
- Creates suspension record with null `endDate`
- Effect: Pauses prescription clock

**Resume Suspension**
- Function: `resumeSuspension(caseId, suspensionId, { endDate, resumedBy })`
- Updates suspension document with `endDate`
- Effect: Resumes prescription timer from paused value

**Get Suspensions**
- Returns: Array of all suspensions for a case
- From subcollection: `cases/{caseId}/suspensions`

#### User Operations

**Get User**
- Function: `getUser(userId)`
- File: `src/services/userService.js`
- Returns: User profile object

**List Users**
- Function: `listUsers()`
- Returns: Array of all users
- Accessible: Attorney General role only

**Update User Role**
- Function: `updateUserRoleAndActive(userId, { role, active })`
- Parameters: Role value, active status
- Accessible: Attorney General role only

**Update User Profile**
- Function: `updateUserProfile(userId, { role, active, displayName, courtId, councilId })`
- More comprehensive update function

#### Audit Operations

**Add Audit Log**
- Function: `addAuditLog({ type, userId, details })`
- File: `src/services/auditService.js`
- Parameters: Action type, user ID, action details
- Async: Non-blocking, errors don't stop main operation

**Query Audit Logs**
- Firestore security rules: Attorney General only
- Query: By userId, type, date range (application layer)

### Cloud Functions

**Schedule Daily Status Update**
- Trigger: Daily via Cloud Scheduler
- Function: `updateCaseStatuses()`
- File: `functions/index.js`
- Operations:
  1. Fetch all cases from Firestore
  2. Calculate days remaining for each
  3. Determine new status
  4. Batch update changed statuses
  5. Log operation to systemLogs

---

## Important Business Rules

### Prescription Period Calculation Rules

#### Track A: تقادم الدعوى العمومية (Pre-Judgment)
| Crime Type | Base Duration | Variations |
|-----------|-----------|-----------|
| جناية (Felony) | 15y | Hidden: 25y, Death/Life: 30y, Custom: 1-30y per input |
| جنحة بسيطة (Simple Misdemeanor) | 5y | Hidden: +5y |
| جنحة مشددة (Aggravated Misdemeanor) | 10y | Hidden: +5y |
| مخالفة (Violation) | 2y | Never hidden |
| مستثناة (Exempted) | ∞ (non-prescriptible) | Never expires |

#### Track B: تقادم العقوبة (Post-Judgment)
| Crime Type | Duration |
|-----------|-----------|
| جناية (Felony) | 20y |
| جنحة بسيطة (Simple Misdemeanor) | 5y |
| جنحة مشددة (Aggravated Misdemeanor) | = sentenced years (5-20y) |
| مخالفة (Violation) | 2y |
| مستثناة (Exempted) | ∞ (non-prescriptible) |

#### Non-Prescriptible Categories
- Terrorism and sabotage crimes
- State security felonies
- Cross-border organized crime
- All corruption crimes
- Embezzlement with foreign transfer

**Legal Effect**: These crimes never expire. Timer remains **disabled permanently**. Status is `NON_PRESCRIPTIBLE`.

### Interruption Rules
- **Definition**: Resets prescription clock to 0
- **Trigger**: One of 4 procedural types only
- **Effect**: Immediately cancels previous progress
- **Recording**: All interruptions logged with date, type, performer
- **Multiplicity**: Multiple interruptions allowed, each resets the clock
- **Restriction**: Clerks cannot trigger (judges/prosecutors only)

### Suspension Rules
- **Definition**: Pauses clock temporarily
- **Trigger**: Any time (judges/prosecutors only)
- **Effect**: Clock stops incrementing
- **Recording**: Stores start date, end date, reason, performer
- **Resume**: End date added, clock resumes from frozen value
- **Multiplicity**: Multiple overlapping suspensions allowed
- **Restriction**: Clerks cannot trigger

### Status Determination Rules

**Days Remaining Calculation**:
1. Calculate from `prescriptionEndDate` to current date (UTC midnight)
2. If date is null (non-prescriptible): Status = `NON_PRESCRIPTIBLE`
3. Apply suspension logic: Subtract active suspension durations
4. Map days to status:
   - ≤ 0 days → `EXPIRED`
   - 1-7 days → `CRITICAL`
   - 8-15 days → `URGENT`
   - 16-90 days → `WARNING`
   - > 90 days → `ACTIVE`
   - Any active suspension → `SUSPENDED`

**Update Frequency**: Daily via Cloud Function

### Role-Based Permissions

#### Clerk (أمين الضبط)
- ✅ Create cases
- ✅ View all cases (application level filtering)
- ✅ View case details
- ✅ Print cases
- ❌ Trigger interruptions
- ❌ Trigger suspensions
- ❌ Access user management

#### Judge (قاضٍ)
- ✅ View assigned cases only
- ✅ Update assigned cases
- ✅ Trigger interruptions (all 4 types)
- ✅ Trigger suspensions
- ✅ Resume suspensions
- ❌ Create cases
- ❌ Access user management

#### Public Prosecutor (وكيل الجمهورية)
- ✅ View all cases (supervisory access)
- ✅ Update assigned cases
- ✅ Trigger interruptions (all 4 types)
- ✅ Trigger suspensions
- ✅ Resume suspensions
- ✅ Supervisory access to court cases
- ❌ Create cases
- ❌ Access user management

#### Attorney General (النائب العام)
- ✅ All permissions
- ✅ User management
- ✅ Supervisory access to all councils
- ✅ Audit log access
- ✅ System-wide view

### Validation Rules
- **Case Reference**: Must be unique
- **Crime Date**: Cannot be in future
- **Interruption Date**: Cannot be in future, must be after crime date
- **Suspension Dates**: Start < End, cannot be in future
- **Custom Penalty**: 1-30 years only
- **Sentence Years**: 5-20 years for aggravated misdemeanor penalty track
- **Status Transitions**: Expired/NON_PRESCRIPTIBLE cases are read-only

### Timezone Rules
- **System Timezone**: UTC (stored)
- **Calculation Timezone**: Algeria (UTC+1) for "day" calculations
- **Display**: Localized to user's browser timezone
- **Precision**: Full calendar days only (no sub-day precision)

---

## Environment Variables

Configured in `src/firebase/config.js`:

```
VITE_FIREBASE_API_KEY=AIzaSyAVZIxoijoHCk4DmEExJf0Y40Tv82pzJIU
VITE_FIREBASE_AUTH_DOMAIN=judicial-prescription.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=judicial-prescription
VITE_FIREBASE_STORAGE_BUCKET=judicial-prescription.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=875635952776
VITE_FIREBASE_APP_ID=1:875635952776:web:307f734db011b1d420233d
```

### What Each Does
- **API_KEY**: Public API key for Firebase (can be exposed)
- **AUTH_DOMAIN**: Firebase authentication domain
- **PROJECT_ID**: Firestore project identifier
- **STORAGE_BUCKET**: Cloud Storage bucket (for future file uploads)
- **MESSAGING_SENDER_ID**: Cloud Messaging identifier (for future notifications)
- **APP_ID**: Firebase app identifier

### Setup Instructions
1. Get values from Firebase Console → Project Settings
2. Replace values in `src/firebase/config.js`
3. Keep safe in production (use Firebase App Check for additional security)

---

## Reusable Components

### جرس_التنبيهات (Notification Bell)
- **Purpose**: Display notification count and access notification list
- **Props**: None (uses context)
- **Where Used**: App header
- **Functionality**: Shows unread notification count, popup with recent notifications

### شارة_الحالة (Status Badge)
- **Purpose**: Display case status as colored badge
- **Props**: `status` (string)
- **Where Used**: Case list, case detail view, dashboard
- **Functionality**: Maps status to color, icon, and label in both Arabic and visual form

### شريط_الإشعارات (Notification Bar)
- **Purpose**: Display inline notifications/alerts
- **Props**: `message`, `type` (success/error/warning/info)
- **Where Used**: Throughout app for user feedback
- **Functionality**: Auto-dismiss after timeout, close button

### نموذج_قضية (Case Form)
- **Purpose**: Create/edit case with dynamic field rendering
- **Props**: `caseData` (optional), `onSubmit`, `isLoading`, `error`
- **Where Used**: Case creation page, case edit dialog
- **Functionality**: 
  - Dynamic fields based on trackType
  - Date picker with validation
  - Severity level selection with custom input
  - Form validation before submit

### نموذج_إجراء (Procedure Form)
- **Purpose**: Create interruption or suspension records
- **Props**: `caseId`, `type` (interruption/suspension), `onSubmit`, `isLoading`
- **Where Used**: Interruption/suspension modals
- **Functionality**:
  - Type selection (4 interruption types or suspension)
  - Date picker with future date validation
  - Optional notes field
  - Reason field for suspensions

### مسار_محمي (Protected Route)
- **Purpose**: Guard routes from unauthorized access
- **Props**: `children`, `requiredRole` (optional)
- **Where Used**: All authenticated routes
- **Functionality**: Redirects to login if not authenticated, redirects if role insufficient

### سجل_إجراءات_التقادم (Prescription Actions Log)
- **Purpose**: Display history and allow management of interruptions/suspensions
- **Props**: `caseId`, `case`, `onActionAdded`
- **Where Used**: Case detail view
- **Functionality**:
  - Tabbed view (interruptions/suspensions)
  - Timeline display
  - Add new action buttons
  - Form modals for new entries

---

## Current Known Issues

### Technical Debt
1. **TypeScript Coverage**: Only `App.tsx` and `types.d.ts` use TypeScript; components are JSX without TS
2. **Real-time Updates**: No Firestore listeners for live case updates; page refresh required in some cases
3. **Error Handling**: Limited error UI feedback in some components
4. **Form Validation**: Validation spread across components; could be centralized
5. **Testing**: No unit or integration tests currently

### Known Bugs
1. **Legacy Role Support**: Old role names still in database; migration incomplete
2. **Date Timezone**: Some edge cases in UTC/UTC+1 conversions for DST boundaries
3. **Concurrent Updates**: No conflict resolution for simultaneous case edits
4. **Audit Log Query**: Firestore query limitations for complex filtering

### Missing Features
1. **Email Notifications**: Prescriptions alerts not sent via email
2. **Batch Operations**: Cannot perform bulk actions on multiple cases
3. **Case Templates**: No way to create case templates for recurring scenarios
4. **Export/Import**: No data export or bulk import functionality
5. **Search**: Limited search capabilities across cases

### Performance Issues
1. **Case List**: Loading all cases at once; needs pagination
2. **Bundle Size**: No code splitting currently
3. **Firestore Queries**: No aggressive caching strategy

---

## Future Improvements

### Short Term
1. Migrate all components to TypeScript
2. Add comprehensive error handling and error pages
3. Implement pagination for case lists
4. Add search and advanced filtering
5. Create unit tests for core business logic

### Medium Term
1. Add real-time Firestore listeners for live updates
2. Implement email notifications for prescription alerts
3. Add PDF generation for case reports
4. Bulk operations (update multiple cases at once)
5. API rate limiting and caching strategy

### Long Term
1. Mobile app version (React Native or Flutter)
2. Advanced analytics dashboard
3. Machine learning for case prediction
4. Integration with external judicial systems
5. Multi-language support (currently Arabic/French)
6. Two-factor authentication (2FA)
7. Case templates and automation workflows

---

## Development Notes

### Coding Conventions
- **Components**: Named in Arabic (جنسي naming)
- **Functions**: Named in English with camelCase
- **Constants**: UPPERCASE_WITH_UNDERSCORES
- **Directories**: Arab directory names for domain logic
- **Imports**: Use relative paths for local modules

### Naming Conventions
- **Files**: Arabic names for components and pages
- **Variables**: English camelCase
- **Classes**: English PascalCase
- **Hooks**: `use` prefix for React hooks
- **Context**: Suffix with `Context` for context files

### Folder Conventions
```
src/
  components/    → UI components (reusable)
  context/       → React Context providers
  pages/         → Full page components (routes)
  services/      → Business logic & API calls
  utils/         → Helper functions & calculations
  firebase/      → Firebase configuration
  styles/        → Global and utility styles
  types/         → TypeScript types (if expanded)
```

### Important Warnings
1. **Do NOT modify firestore.rules manually** - use Firebase Console
2. **Do NOT hardcode Firebase credentials** - always use config.js
3. **Do NOT trust client-side validation** - server rules are security layer
4. **Do NOT delete old user roles** - legacy roles must remain for migration
5. **Do NOT modify Cloud Function without testing** - can break daily updates
6. **Do NOT delete cases** - Firestore rules prevent deletion (audit trail)

### Things to Avoid Changing
1. **Prescription Calculation Logic**: Complex legal requirements; extensive testing needed
2. **RBAC Permissions Structure**: Changes require security rule updates
3. **Data Model**: Case schema changes require migration script updates
4. **Firebase Config**: Changes affect all users; coordination needed
5. **Cloud Function Schedule**: Changes affect all cases; test thoroughly first
6. **Firestore Collection Names**: Used throughout codebase; requires refactoring

### Important Testing Scenarios
1. **Interruption Resets Clock**: Verify prescription timer resets correctly
2. **Suspension Pauses Clock**: Verify timer stops incrementing during suspension
3. **Status Updates Daily**: Verify Cloud Function runs and updates statuses
4. **Role-Based Access**: Verify RBAC controls at both UI and Firestore levels
5. **Non-Prescriptible Cases**: Verify exempted crimes never expire
6. **Leap Years**: Test prescription calculations across leap years
7. **Timezone Handling**: Test UTC/UTC+1 conversions

---

## Quick Context For AI Assistants

### What This Project Does
This is a **Criminal Case Statute of Limitations Management System** for Algeria's judicial system. It tracks when criminal cases become legally uncollectable (prescription expires). The system implements complex business logic for:
1. Calculating prescription periods based on crime type (felony/misdemeanor/violation)
2. Managing interruptions (reset clock) and suspensions (pause clock)
3. Role-based access for different judicial actors
4. Daily automated status updates

### Critical Files to Understand Before Editing

**Business Logic**:
- `src/utils/prescription.js` - Prescription calculation engine (most critical)
- `src/utils/rbacHelper.js` - Role-based permission definitions
- `src/services/caseService.js` - Case operations and validation
- `firestore.rules` - Security rules and access control

**UI/UX**:
- `src/App.tsx` - Main routing and navigation
- `src/pages/` - All major features (cases, management, etc.)
- `src/components/` - Reusable UI components

**Backend**:
- `functions/index.js` - Daily status update function (must work reliably)
- `src/firebase/config.js` - Firebase initialization

### Areas Likely to Break If Modified

1. **Prescription Calculations** (src/utils/prescription.js)
   - Complex date math with UTC/UTC+1 timezone handling
   - Changes can create wrong prescription periods
   - Affects legal compliance

2. **RBAC System** (src/utils/rbacHelper.js + firestore.rules)
   - Two-layer permission system (UI + Firestore rules)
   - Changing one without the other breaks security
   - Changes require testing all role scenarios

3. **Cloud Function** (functions/index.js)
   - Runs daily for all cases
   - Changes can cause data corruption
   - Must validate against all case types

4. **Data Model** (types.d.ts)
   - Case schema changes require migration scripts
   - Changes affect all existing cases
   - Firestore indexes must match new fields

5. **Firestore Rules** (firestore.rules)
   - Security boundary - changes can expose data
   - Must validate all role scenarios
   - Test against legacy and new role names

### Key Concepts to Understand Before Editing

1. **Dual-Track System**: Cases can be pre-judgment (Track A) OR post-judgment (Track B), never both
2. **Non-Prescriptible**: Some crimes never expire (terrorism, organized crime, corruption, state security)
3. **Interruption vs Suspension**: Interruption RESETS timer to 0; Suspension PAUSES timer
4. **Timezone Handling**: Prescriptions calculated in UTC but "days" are calendar days in Algeria (UTC+1)
5. **Daily Updates**: Cloud Function runs daily to recalculate status; UI doesn't compute status
6. **RBAC Layers**: Both UI (React) and Firestore security rules enforce permissions

### Common Debugging Scenarios

**"Prescription period wrong"**:
- Check `calculatePrescriptionDuration()` logic in prescription.js
- Verify crime type, track type, severity level mapping
- Test with UTC midnight calculations

**"User can't access case"**:
- Check `rbacHelper.js` PERMISSIONS object
- Check `firestore.rules` access conditions
- Verify user role in Firebase users collection
- Check legacy role normalization

**"Status not updating"**:
- Check Cloud Function in functions/index.js running
- Verify cases have `prescriptionEndDate` set
- Check Firebase system logs
- Manually trigger function via Firebase Console

**"Interruption not recorded"**:
- Check Firestore subcollection at `cases/{caseId}/interruptions`
- Verify date validation (no future dates)
- Check user has judicial action permissions
- Verify case status is not EXPIRED

---

**Document Version**: 1.0  
**Last Updated**: May 23, 2026  
**Maintained By**: Development Team  
**Next Review**: When project structure changes significantly
