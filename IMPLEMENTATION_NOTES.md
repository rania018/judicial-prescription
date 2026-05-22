# Criminal Case Statute of Limitations Management Platform - Implementation Notes

## Overview
This document outlines the implementation changes made to transform the existing judicial prescription tracking system into a comprehensive Criminal Case Statute of Limitations Management Platform with dual-track limitation management and advanced RBAC.

## Core Business Rule Implementation

### 1. Dual Track System (Mutually Exclusive)
- **Track A: تقادم الدعوى العمومية** (Pre-judgment limitation)
- **Track B: تقادم العقوبة** (Post-judgment penalty execution limitation)

### 2. Limitation Calculation Engine
- **Track A Calculations:**
  - جناية (Felony): 15y default | 25y if مخفية (hidden) | 30y if عقوبتها إعدام/مؤبد | 20y if نص خاص
  - جنحة (Misdemeanor): Simple (≤5y) → 5y | Aggravated (>5y) → 10y | If مخفية → +5y each | Custom mode → equals max penalty (1-30y input)
  - مخالفة (Violation): Always 2y
  - مستثناة من السقوط (Terrorism, organized crime, state security, corruption w/ foreign transfer): Timer DISABLED permanently

- **Track B Calculations:**
  - جناية: 20y
  - جنحة بسيطة: 5y
  - جنحة مشددة: = sentenced years
  - مخالفة: 2y
  - Same non-prescriptible list → Timer DISABLED

### 3. Timer Controls (Legally Precise)
- **انقطاع (Interruption):** Resets clock to 0. Triggered by exactly 1 of 4 procedural types:
  1. إجراءات البحث والتحري (الضبطية)
  2. إجراءات مباشرة الدعوى العمومية (النيابة)
  3. إجراءات التحقيق القضائي (قاضي التحقيق)
  4. إجراءات المحاكمة

- **وقف (Suspension):** Pauses clock. Stores freeze timestamp & reason. When resumed, continues from frozen value. Multiple suspension periods allowed. Must log start/end dates.

### 4. Dynamic UI/UX Form Logic (New Case Registration)
- Title: قيد ملف جزائي جديد
- Subtitle: المعطيات الإجرائية للملف
- Conditional field rendering based on track selection

### 5. Role-Based Permissions (RBAC)
- **أمين الضبط (Clerk):** Create file, view data. NO access to انقطاع/وقف buttons.
- **قاضي التحقيق (Investigating Judge):** Can ONLY trigger انقطاع type 3 (إجراءات التحقيق القضائي) on assigned files.
- **النيابة العامة (Prosecutor):** Full access: create, view, suspend, trigger all 4 انقطاع types.

## Technical Implementation Details

### 1. Updated Data Model
- New fields: `trackType`, `severityLevel`, `customPenaltyDuration`, `judicialAuthority`, `judicialOfficer`, `crimeDate`
- New status: `NON_PRESCRIPTIBLE` for non-expiring cases
- History tracking: `interruptionHistory`, `suspensionHistory`

### 2. Enhanced Calculation Engine
- `calculatePrescriptionDuration()` - Implements all legal rules
- `calculatePrescriptionEndDate()` - Handles complex calculations
- `calculatePrescription()` - Processes interruptions and suspensions

### 3. New Components
- `سجل_إجراءات_التقادم.jsx` - Comprehensive log and management for interruptions/suspensions
- Enhanced `نموذج_قضية.jsx` - Dynamic form with conditional rendering
- Enhanced `نموذج_إجراء.jsx` - Handles both interruptions and suspensions

### 4. RBAC Middleware
- `rbacHelper.js` - Centralized permission management
- Permission checks integrated into UI components

### 5. Updated Services
- `caseService.js` - Enhanced with interruption and suspension management
- Proper validation for legal compliance

## File Changes Summary

### Core Logic
- `src/utils/prescription.js` - Enhanced calculation engine
- `src/services/caseService.js` - Updated business logic
- `src/utils/statusHelpers.js` - New status types and labels
- `src/utils/rbacHelper.js` - RBAC implementation

### Components
- `src/components/نموذج_قضية.jsx` - New dynamic form
- `src/components/نموذج_إجراء.jsx` - Enhanced for interruptions/suspensions
- `src/components/شارة_الحالة.jsx` - Updated for new status
- `src/components/سجل_إجراءات_التقادم.jsx` - New component for managing prescrition actions

### Pages
- `src/pages/تفاصيل_القضية.jsx` - Enhanced with new functionality

### Backend
- `functions/index.js` - Updated to handle new status types
- `scripts/migrateCasesToNewSchema.js` - Updated migration script

### Types
- `src/types.d.ts` - New data models and interfaces

## Migration Considerations

1. Existing cases will be migrated using the updated migration script
2. Old fields are maintained for compatibility during transition
3. New permission roles need to be set up in the `users` collection
4. Firebase security rules need updating to handle new subcollections

## Legal Compliance Features

1. UTC+1 timezone handling for Algeria jurisdiction
2. Precise day counting without floating-point errors
3. Proper handling of leap years
4. Complete audit trail for all actions affecting limitation periods
5. Validation preventing invalid combinations (e.g., selecting مخفية on مخالفة)