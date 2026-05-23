import dayjs from 'dayjs'
import 'dayjs/locale/ar'

dayjs.locale('ar')

// New prescription durations based on client requirements
export const PRESCRIPTION_DURATIONS_YEARS = {
  // Track A: Pre-judgment limitation (تقادم الدعوى العمومية)
  PROSECUTION_FELONY: 15,
  PROSECUTION_FELONY_HIDDEN: 25,
  PROSECUTION_FELONY_DEATH_LIFE: 30,
  PROSECUTION_FELONY_SPECIAL_PROVISION: 20,
  
  // Track B: Post-judgment limitation (تقادم العقوبة)
  PENALTY_FELONY: 20,
  PENALTY_SIMPLE_MISDEMEANOR: 5,
  PENALTY_AGGRAVATED_MISDEMEANOR: null, // Equal to sentence years
  
  // Both tracks
  PROSECUTION_MISDEMEANOR: 5,
  PROSECUTION_MISDEMEANOR_AGGRAVATED: 10,
  PROSECUTION_MISDEMEANOR_HIDDEN_BONUS: 5, // Added to base duration
  PROSECUTION_VIOLATION: 2,
  PENALTY_VIOLATION: 2,
}

/**
 * Normalise any date to UTC midnight for that calendar day.
 * Ensures prescription is always counted in full calendar days.
 */
function toUTCMidnight(date) {
  const d = date && (typeof date.toDate === 'function' ? date.toDate() : new Date(date))
  if (!d || Number.isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Add whole calendar years in UTC so the end day is correct (e.g. 2024-01-15 + 3 years = 2027-01-15).
 */
function addYearsUTC(date, years) {
  const d = toUTCMidnight(date)
  if (!d) return null
  return new Date(Date.UTC(
    d.getUTCFullYear() + years,
    d.getUTCMonth(),
    d.getUTCDate(),
  ))
}

/**
 * Calculate prescription duration based on crime type, track, and special conditions
 */
export function calculatePrescriptionDuration({
  trackType,
  crimeType,
  severityLevel,
  customPenaltyDuration,
  sentenceYears
}) {
  // Check if crime is non-prescriptible (مستثناة من السقوط)
  const nonPrescriptibleCrimes = ['EXEMPTED'];
  if (nonPrescriptibleCrimes.includes(crimeType)) {
    return null; // Non-prescriptible
  }

  if (trackType === 'PROSECUTION') {
    switch (crimeType) {
      case 'FELONY':
        if (severityLevel === 'HIDDEN') {
          return PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_FELONY_HIDDEN;
        } else if (severityLevel === 'EQUAL_TO_SENTENCE') {
          return PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_FELONY_DEATH_LIFE;
        } else if (severityLevel === 'CUSTOM' && customPenaltyDuration) {
          return customPenaltyDuration;
        }
        return PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_FELONY;

      case 'SIMPLE_MISDEMEANOR': // Simple misdemeanor
        let baseDuration = PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_MISDEMEANOR;
        if (severityLevel === 'HIDDEN') {
          baseDuration += PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_MISDEMEANOR_HIDDEN_BONUS;
        }
        return baseDuration;

      case 'AGGRAVATED_MISDEMEANOR': // Aggravated misdemeanor
        let aggrBaseDuration = PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_MISDEMEANOR_AGGRAVATED;
        if (severityLevel === 'HIDDEN') {
          aggrBaseDuration += PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_MISDEMEANOR_HIDDEN_BONUS;
        }
        return aggrBaseDuration;

      case 'VIOLATION':
        return PRESCRIPTION_DURATIONS_YEARS.PROSECUTION_VIOLATION;

      default:
        throw new Error('نوع الجريمة غير مدعوم لحساب التقادم');
    }
  } else if (trackType === 'PENALTY_EXECUTION') {
    switch (crimeType) {
      case 'FELONY':
        return PRESCRIPTION_DURATIONS_YEARS.PENALTY_FELONY;

      case 'SIMPLE_MISDEMEANOR':
        return PRESCRIPTION_DURATIONS_YEARS.PENALTY_SIMPLE_MISDEMEANOR;

      case 'AGGRAVATED_MISDEMEANOR':
        if (sentenceYears) {
          return sentenceYears;
        }
        return PRESCRIPTION_DURATIONS_YEARS.PENALTY_AGGRAVATED_MISDEMEANOR;

      case 'VIOLATION':
        return PRESCRIPTION_DURATIONS_YEARS.PENALTY_VIOLATION;

      default:
        throw new Error('نوع الجريمة غير مدعوم لحساب تقادم العقوبة');
    }
  }

  throw new Error('نوع المسار غير مدعوم');
}

export function calculatePrescriptionEndDate(trackType, crimeType, crimeDate, severityLevel, customPenaltyDuration, sentenceYears) {
  const durationInYears = calculatePrescriptionDuration({
    trackType,
    crimeType,
    severityLevel,
    customPenaltyDuration,
    sentenceYears
  });

  // If duration is null, the crime is non-prescriptible
  if (durationInYears === null) {
    return null;
  }

  const start = toUTCMidnight(crimeDate);
  if (!start) throw new Error('تاريخ غير صالح لحساب التقادم');
  return addYearsUTC(start, durationInYears);
}

export function calculatePrescription({
  trackType,
  crimeType,
  crimeDate,
  severityLevel,
  customPenaltyDuration,
  sentenceYears,
  isMinor = false,
  minorBirthDate = null,
  interruptionHistory,
  suspensionHistory
}) {
  if (!crimeDate) {
    throw new Error('لا يوجد تاريخ جريمة صالح لحساب التقادم');
  }

  // Handle minor cases: prescription starts when the minor turns 18
  let effectiveStartDate = toUTCMidnight(crimeDate);
  if (isMinor && minorBirthDate) {
    const birthDate = toUTCMidnight(minorBirthDate);
    const eighteenthBirthday = addYearsUTC(birthDate, 18);
    
    // If the 18th birthday is after the crime date, use that as the start date
    if (eighteenthBirthday && eighteenthBirthday > effectiveStartDate) {
      effectiveStartDate = eighteenthBirthday;
    }
  }

  // Determine if the crime is non-prescriptible
  const nonPrescriptibleCrimes = ['EXEMPTED'];
  if (nonPrescriptibleCrimes.includes(crimeType)) {
    return {
      prescriptionStartDate: effectiveStartDate,
      prescriptionEndDate: null, // Non-expiring
      status: 'NON_PRESCRIPTIBLE'
    };
  }

  // Calculate the basic end date based on crime type and track
  const basicEndDate = calculatePrescriptionEndDate(
    trackType,
    crimeType,
    effectiveStartDate,
    severityLevel,
    customPenaltyDuration,
    sentenceYears
  );

  if (!basicEndDate) throw new Error('نوع الجريمة غير مدعوم لحساب التقادم');

  // Apply interruptions and suspensions if any
  let finalEndDate = new Date(basicEndDate);

  // Process interruptions (they reset the timer)
  if (interruptionHistory && interruptionHistory.length > 0) {
    // Find the latest interruption date
    const latestInterruption = interruptionHistory.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
    
    // Reset the timer from the latest interruption date
    const durationInYears = calculatePrescriptionDuration({
      trackType,
      crimeType,
      severityLevel,
      customPenaltyDuration,
      sentenceYears
    });
    
    finalEndDate = addYearsUTC(new Date(latestInterruption.date), durationInYears);
  }

  // Process suspensions (they pause the timer)
  if (suspensionHistory && suspensionHistory.length > 0) {
    // Calculate total suspension time
    let totalSuspensionDays = 0;
    
    suspensionHistory.forEach(suspension => {
      const startDate = new Date(suspension.startDate);
      const endDate = suspension.endDate ? new Date(suspension.endDate) : new Date();
      if (startDate < endDate) {
        const diffTime = endDate - startDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalSuspensionDays += diffDays;
      }
    });

    // Extend the end date by the total suspension period
    finalEndDate.setDate(finalEndDate.getDate() + totalSuspensionDays);
  }

  return {
    prescriptionStartDate: effectiveStartDate,
    prescriptionEndDate: finalEndDate,
  };
}

export function formatArabicDate(timestampOrDate) {
  if (!timestampOrDate) return '—'
  let date
  if (typeof timestampOrDate.toDate === 'function') {
    date = timestampOrDate.toDate()
  } else {
    date = timestampOrDate
  }

  return dayjs(date).format('DD/MM/YYYY')
}

/** Approximate milliseconds in one Julian year. */
export const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000

/**
 * Compute the number of elapsed whole years between two dates (fractional years are truncated).
 * Accepts Date objects, Firestore Timestamps, or anything accepted by `new Date()`.
 * Returns null when either argument is absent or invalid.
 * Returns a negative number when `to` precedes `from`.
 */
export function yearsBetween(from, to) {
  const fromD = from && (typeof from.toDate === 'function' ? from.toDate() : new Date(from))
  const toD = to && (typeof to.toDate === 'function' ? to.toDate() : new Date(to))
  if (!fromD || !toD || Number.isNaN(fromD.getTime()) || Number.isNaN(toD.getTime())) return null
  return Math.floor((toD - fromD) / MS_PER_YEAR)
}

// Africa/Algiers = UTC+1 — الجزائر؛ نفس منطق Cloud Function لاحتساب «اليوم»
const ALGIERS_OFFSET_MS = 1 * 60 * 60 * 1000

/** بداية اليوم التقويمي (منتصف ليل الجزائر) للمقارنة. */
function startOfDayAlgiers(utcMidnightDate) {
  if (!utcMidnightDate) return null
  return new Date(utcMidnightDate.getTime() - ALGIERS_OFFSET_MS)
}

/**
 * الأيام المتبقية حتى انتهاء التقادم (أيام تقويمية، توقيت الجزائر).
 * 0 = ينتهي اليوم، سالب = منتهٍ. يطابق منطق Cloud Function.
 */
export function getDaysRemaining(prescriptionEndDate) {
  if (!prescriptionEndDate) return null // Non-expiring case
  const endUTC = toUTCMidnight(
    typeof prescriptionEndDate.toDate === 'function'
      ? prescriptionEndDate.toDate()
      : prescriptionEndDate,
  )
  if (!endUTC) return null
  const now = new Date()
  const algiersNow = new Date(now.getTime() + ALGIERS_OFFSET_MS)
  const todayUTC = new Date(Date.UTC(
    algiersNow.getUTCFullYear(),
    algiersNow.getUTCMonth(),
    algiersNow.getUTCDate(),
  ))
  const todayStart = startOfDayAlgiers(todayUTC)
  const endStart = startOfDayAlgiers(endUTC)
  if (!todayStart || !endStart) return null
  const diffMs = endStart.getTime() - todayStart.getTime()
  return Math.floor(diffMs / (24 * 60 * 60 * 1000))
}

export function formatTodayArabic() {
  return dayjs().locale('ar').format('dddd، D MMMM YYYY')
}