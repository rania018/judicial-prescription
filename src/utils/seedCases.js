import { createCase } from '../services/caseService'

// Today = 2026-05-23. Cases designed to produce all status buckets.
const FAKE_CASES = [
  // ── CRITICAL (< 6 months remaining) ───────────────────
  {
    caseReference: 'TJ-2011-001',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2011-07-10'), // ends 2026-07-10 (~7 weeks left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'INVESTIGATING_JUDGE',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2011-002',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2011-09-20'), // ends 2026-09-20 (~4 months left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'COURT_PRESIDENT',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2021-003',
    trackType: 'PROSECUTION',
    crimeType: 'SIMPLE_MISDEMEANOR',
    crimeDate: new Date('2021-08-05'), // ends 2026-08-05 (~2.5 months left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'SENTENCING_JUDGE',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2016-004',
    trackType: 'PROSECUTION',
    crimeType: 'AGGRAVATED_MISDEMEANOR',
    crimeDate: new Date('2016-10-15'), // ends 2026-10-15 (~5 months left)
    judicialAuthority: 'COUNCIL',
    judicialOfficer: 'COUNCIL_PRESIDENT',
    isMinor: false,
  },

  // ── WARNING (6–12 months remaining) ────────────────────
  {
    caseReference: 'TJ-2012-005',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2012-01-10'), // ends 2027-01-10 (~7.5 months left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'INVESTIGATING_JUDGE',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2012-006',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2012-03-20'), // ends 2027-03-20 (~10 months left)
    judicialAuthority: 'COUNCIL',
    judicialOfficer: 'ATTORNEY_GENERAL',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2021-007',
    trackType: 'PROSECUTION',
    crimeType: 'SIMPLE_MISDEMEANOR',
    crimeDate: new Date('2021-12-10'), // ends 2026-12-10 (~6.5 months left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'PROSECUTOR',
    isMinor: false,
  },

  // ── ACTIVE (> 1 year remaining) ────────────────────────
  {
    caseReference: 'TJ-2015-008',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2015-01-01'), // ends 2030-01-01 (~3.6 years left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'INVESTIGATING_JUDGE',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2013-009',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2013-06-01'), // ends 2028-06-01 (~2 years left)
    judicialAuthority: 'COUNCIL',
    judicialOfficer: 'INDICTMENT_CHAMBER_PRESIDENT',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2023-010',
    trackType: 'PROSECUTION',
    crimeType: 'SIMPLE_MISDEMEANOR',
    crimeDate: new Date('2023-01-15'), // ends 2028-01-15 (~1.7 years left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'SENTENCING_JUDGE',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2020-011',
    trackType: 'PROSECUTION',
    crimeType: 'AGGRAVATED_MISDEMEANOR',
    crimeDate: new Date('2020-05-01'), // ends 2030-05-01 (~4 years left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'JUVENILE_JUDGE',
    isMinor: true,
    minorBirthDate: new Date('2010-03-01'),
  },
  {
    caseReference: 'TJ-2010-012',
    trackType: 'PENALTY_EXECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2010-01-01'), // ends 2030-01-01 (~3.6 years left)
    judicialAuthority: 'COURT',
    judicialOfficer: 'SENTENCING_JUDGE',
    isMinor: false,
  },

  // ── EXPIRED ────────────────────────────────────────────
  {
    caseReference: 'TJ-2009-013',
    trackType: 'PROSECUTION',
    crimeType: 'FELONY',
    crimeDate: new Date('2009-01-01'), // ends 2024-01-01 → EXPIRED
    judicialAuthority: 'COURT',
    judicialOfficer: 'COURT_PRESIDENT',
    isMinor: false,
  },
  {
    caseReference: 'TJ-2019-014',
    trackType: 'PROSECUTION',
    crimeType: 'SIMPLE_MISDEMEANOR',
    crimeDate: new Date('2019-06-01'), // ends 2024-06-01 → EXPIRED
    judicialAuthority: 'COUNCIL',
    judicialOfficer: 'COUNCIL_PRESIDENT',
    isMinor: false,
  },

  // ── NON_PRESCRIPTIBLE ─────────────────────────────────
  {
    caseReference: 'TJ-2018-015',
    trackType: 'PROSECUTION',
    crimeType: 'EXEMPTED',
    nonPrescriptibleCategory: 'TERRORISM',
    crimeDate: new Date('2018-03-15'),
    judicialAuthority: 'COURT',
    judicialOfficer: 'INVESTIGATING_JUDGE',
    isMinor: false,
  },
]

/**
 * Seed fake cases into Firestore for the currently logged-in user.
 * Only call this in development — not intended for production use.
 */
export async function seedFakeCases(userId, userProfile) {
  const results = []
  for (const caseData of FAKE_CASES) {
    try {
      const created = await createCase(caseData, userId, userProfile)
      results.push({ ok: true, ref: caseData.caseReference, id: created.id })
    } catch (err) {
      results.push({ ok: false, ref: caseData.caseReference, error: err.message })
    }
  }
  return results
}
