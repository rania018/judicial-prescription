import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { NON_PRESCRIPTIBLE_CATEGORIES } from '../utils/statusHelpers'
import { yearsBetween } from '../utils/prescription'

const CRIME_TYPES = [
  { value: 'FELONY', label: 'جناية' },
  { value: 'SIMPLE_MISDEMEANOR', label: 'جنحة بسيطة' },
  { value: 'AGGRAVATED_MISDEMEANOR', label: 'جنحة مشددة' },
  { value: 'VIOLATION', label: 'مخالفة' },
  { value: 'EXEMPTED', label: 'جرائم لا تسقط بالتقادم' },
]

const TRACK_TYPES = [
  { value: 'PROSECUTION', label: 'مرحلة المتابعة الجزائية' },
  { value: 'PENALTY_EXECUTION', label: 'مرحلة تنفيذ العقوبة' },
]

const JUDICIAL_AUTHORITIES = [
  { value: 'COURT', label: 'محكمة' },
  { value: 'COUNCIL', label: 'مجلس قضائي' },
]

const OFFICER_POSITIONS = {
  COURT: [
    { value: 'PROSECUTOR', label: 'وكيل الجمهورية' },
    { value: 'COURT_PRESIDENT', label: 'رئيس المحكمة' },
    { value: 'INVESTIGATING_JUDGE', label: 'قاضي التحقيق' },
    { value: 'JUVENILE_JUDGE', label: 'قاضي الأحداث' },
    { value: 'SENTENCING_JUDGE', label: 'قاضي الحكم' },
  ],
  COUNCIL: [
    { value: 'ATTORNEY_GENERAL', label: 'النائب العام' },
    { value: 'COUNCIL_PRESIDENT', label: 'رئيس المجلس' },
    { value: 'INDICTMENT_CHAMBER_PRESIDENT', label: 'رئيس غرفة الاتهام' },
  ],
}

export default function نموذج_قضية({ onSubmit, submitting }) {
  const [caseReference, setCaseReference] = useState('')
  const [trackType, setTrackType] = useState('PROSECUTION')
  const [crimeType, setCrimeType] = useState('FELONY')
  const [isMinor, setIsMinor] = useState(false)
  const [minorBirthDate, setMinorBirthDate] = useState('')
  const [severityLevel, setSeverityLevel] = useState('')
  const [customPenaltyDuration, setCustomPenaltyDuration] = useState(1)
  const [sentenceYears, setSentenceYears] = useState(5)
  const [appearanceDate, setAppearanceDate] = useState('')
  const [nonPrescriptibleCategory, setNonPrescriptibleCategory] = useState('')
  const [judicialAuthority, setJudicialAuthority] = useState('COURT')
  const [judicialOfficer, setJudicialOfficer] = useState('PROSECUTOR')
  const [crimeDate, setCrimeDate] = useState('')

  // Update officer positions when judicial authority changes
  useEffect(() => {
    const availableOfficers = OFFICER_POSITIONS[judicialAuthority] || []
    if (availableOfficers.length > 0) {
      setJudicialOfficer(availableOfficers[0].value)
    }
  }, [judicialAuthority])

  // Reset prosecution-only fields when switching to PENALTY_EXECUTION
  useEffect(() => {
    if (trackType === 'PENALTY_EXECUTION') {
      setIsMinor(false)
      setMinorBirthDate('')
      setAppearanceDate('')
      setSeverityLevel((prev) =>
        prev === 'HIDDEN' || prev === 'EQUAL_TO_SENTENCE' ? '' : prev,
      )
    }
  }, [trackType])

  // Reset appearance date when severity level changes away from HIDDEN
  useEffect(() => {
    if (severityLevel !== 'HIDDEN') {
      setAppearanceDate('')
    }
  }, [severityLevel])

  // Reset non-prescriptible category when crime type changes away from EXEMPTED
  useEffect(() => {
    if (crimeType !== 'EXEMPTED') {
      setNonPrescriptibleCategory('')
    }
  }, [crimeType])

  const today = dayjs().format('YYYY-MM-DD')

  // In PENALTY_EXECUTION mode, isMinor and HIDDEN are not applicable
  const isMinorApplicable = trackType === 'PROSECUTION'
  const isHiddenApplicable = trackType === 'PROSECUTION' && crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isAppearanceDateRequired = severityLevel === 'HIDDEN' && isHiddenApplicable

  // Severity level options by track and crime type
  const showSeveritySection = trackType === 'PROSECUTION' && crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isCustomPenaltyRequired = severityLevel === 'CUSTOM' && crimeType === 'FELONY'

  // Sentence years for PENALTY_EXECUTION + AGGRAVATED_MISDEMEANOR
  const showSentenceYears = trackType === 'PENALTY_EXECUTION' && crimeType === 'AGGRAVATED_MISDEMEANOR'

  // Validation logic
  const isSeverityLevelRequired = showSeveritySection && crimeType === 'FELONY'

  const isNonPrescriptibleCategoryRequired = crimeType === 'EXEMPTED'

  const isCustomPenaltyValid =
    severityLevel !== 'CUSTOM' ||
    (customPenaltyDuration && customPenaltyDuration >= 1 && customPenaltyDuration <= 30)
  const isMinorValid = !isMinorApplicable || !isMinor || (minorBirthDate && minorBirthDate <= crimeDate)
  const isAppearanceDateValid =
    !isAppearanceDateRequired || (appearanceDate && appearanceDate >= crimeDate && appearanceDate <= today)
  const isSentenceYearsValid = !showSentenceYears || (sentenceYears && sentenceYears >= 5 && sentenceYears <= 20)

  const isValid =
    caseReference.trim().length > 0 &&
    trackType &&
    crimeType &&
    (!isSeverityLevelRequired || (severityLevel && isCustomPenaltyValid)) &&
    (!isNonPrescriptibleCategoryRequired || nonPrescriptibleCategory) &&
    judicialAuthority &&
    judicialOfficer &&
    crimeDate !== '' &&
    crimeDate <= today &&
    isMinorValid &&
    isAppearanceDateValid &&
    isSentenceYearsValid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return

    const crimeDateObj = new Date(crimeDate)
    const minorBirthDateObj = isMinor ? new Date(minorBirthDate) : null
    const appearanceDateObj = isAppearanceDateRequired && appearanceDate ? new Date(appearanceDate) : null

    onSubmit({
      caseReference: caseReference.trim(),
      trackType,
      crimeType,
      isMinor: isMinorApplicable ? isMinor : false,
      minorBirthDate: isMinorApplicable ? minorBirthDateObj : null,
      ...(showSeveritySection && { severityLevel }),
      ...(isCustomPenaltyRequired && { customPenaltyDuration }),
      ...(showSentenceYears && { sentenceYears }),
      ...(appearanceDateObj && { appearanceDate: appearanceDateObj }),
      ...(nonPrescriptibleCategory && { nonPrescriptibleCategory }),
      judicialAuthority,
      judicialOfficer,
      crimeDate: crimeDateObj,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="caseReference">
            الرقم المرجعي للملف
          </label>
          <input
            id="caseReference"
            type="text"
            className="form-input"
            value={caseReference}
            onChange={(e) => setCaseReference(e.target.value)}
            required
          />
          <p className="muted">المعرّف الفريد للملف — يربط السجل الرقمي بالنسخة الورقية.</p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="trackType">
            المسار الإجرائي
          </label>
          <select
            id="trackType"
            className="form-select"
            value={trackType}
            onChange={(e) => setTrackType(e.target.value)}
            required
          >
            {TRACK_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="muted">
            {trackType === 'PENALTY_EXECUTION'
              ? 'تقادم العقوبة: يبدأ الأجل من تاريخ الحكم النهائي البات. لا تنطبق الجرائم الخفية أو قضايا الأحداث على هذه المرحلة.'
              : 'تقادم الدعوى العمومية: يبدأ الأجل من تاريخ اقتراف الجريمة.'}
          </p>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="crimeType">
            تصنيف وتكييف الجريمة
          </label>
          <select
            id="crimeType"
            className="form-select"
            value={crimeType}
            onChange={(e) => {
              setCrimeType(e.target.value)
              if (e.target.value === 'VIOLATION' || e.target.value === 'EXEMPTED') {
                setSeverityLevel('')
              }
            }}
            required
          >
            {CRIME_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {crimeType === 'FELONY' && trackType === 'PROSECUTION' && (
            <p className="muted">الجناية: الأصل 15 سنة. استثناء: قوانين خاصة تُحدد 20 سنة (سجن مؤقت) أو 30 سنة (مؤبد/إعدام).</p>
          )}
          {crimeType === 'FELONY' && trackType === 'PENALTY_EXECUTION' && (
            <p className="muted">تقادم عقوبة الجناية: 20 سنة تحتسب من تاريخ الحكم النهائي.</p>
          )}
          {crimeType === 'SIMPLE_MISDEMEANOR' && trackType === 'PROSECUTION' && (
            <p className="muted">جنحة بسيطة: مدة التقادم 5 سنوات (عقوبتها تساوي أو تقل عن 5 سنوات).</p>
          )}
          {crimeType === 'AGGRAVATED_MISDEMEANOR' && trackType === 'PROSECUTION' && (
            <p className="muted">جنحة مشددة: مدة التقادم 10 سنوات (عقوبتها تفوق 5 سنوات).</p>
          )}
          {crimeType === 'AGGRAVATED_MISDEMEANOR' && trackType === 'PENALTY_EXECUTION' && (
            <p className="muted">تقادم عقوبة الجنحة المشددة: مساوية لمدة العقوبة المحكوم بها (5–20 سنة).</p>
          )}
          {crimeType === 'SIMPLE_MISDEMEANOR' && trackType === 'PENALTY_EXECUTION' && (
            <p className="muted">تقادم عقوبة الجنحة البسيطة: 5 سنوات.</p>
          )}
          {crimeType === 'VIOLATION' && (
            <p className="muted">المخالفة: مدة التقادم سنتان تلقائياً.</p>
          )}
          {crimeType === 'EXEMPTED' && (
            <p className="muted">جرائم لا تسقط بالتقادم: يُعطَّل حساب أي أجل تقادم لهذه الجريمة.</p>
          )}
        </div>

        {/* Non-prescriptible category selector */}
        {crimeType === 'EXEMPTED' && (
          <div className="form-field">
            <label className="form-label" htmlFor="nonPrescriptibleCategory">
              فئة الجريمة غير القابلة للتقادم
            </label>
            <select
              id="nonPrescriptibleCategory"
              className="form-select"
              value={nonPrescriptibleCategory}
              onChange={(e) => setNonPrescriptibleCategory(e.target.value)}
              required
            >
              <option value="">— اختر الفئة —</option>
              {NON_PRESCRIPTIBLE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <p className="muted">حدد الفئة القانونية التي تندرج ضمنها هذه الجريمة (الجرائم الخمس المحددة حصراً).</p>
          </div>
        )}

        {/* Sentence years for PENALTY_EXECUTION + AGGRAVATED_MISDEMEANOR */}
        {showSentenceYears && (
          <div className="form-field">
            <label className="form-label" htmlFor="sentenceYears">
              مدة الحكم القضائي (بالسنوات)
            </label>
            <input
              id="sentenceYears"
              type="number"
              min="5"
              max="20"
              className="form-input"
              value={sentenceYears}
              onChange={(e) => setSentenceYears(parseInt(e.target.value))}
              required
            />
            <p className="muted">أدخل مدة الحكم المقضي به (من 5 إلى 20 سنة) — تُساوي مدة تقادم العقوبة.</p>
          </div>
        )}

        {/* Minor case (PROSECUTION only) */}
        {trackType === 'PROSECUTION' && (
          <div className="form-field">
            <label className="form-label" htmlFor="isMinor">
              قضية الحدث
            </label>
            <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                id="isMinor"
                type="checkbox"
                checked={isMinor}
                onChange={(e) => {
                  setIsMinor(e.target.checked)
                  if (!e.target.checked) setMinorBirthDate('')
                }}
              />
              <span>القضية تتعلق بحدث (قاصر) — يُجمَّد الحساب حتى بلوغه سن الرشد (18 سنة)</span>
            </label>
          </div>
        )}

        {trackType === 'PROSECUTION' && isMinor && (
          <div className="form-field">
            <label className="form-label" htmlFor="minorBirthDate">
              تاريخ ميلاد الحدث
            </label>
            <input
              id="minorBirthDate"
              type="date"
              className="form-input"
              max={crimeDate || today}
              value={minorBirthDate}
              onChange={(e) => setMinorBirthDate(e.target.value)}
              required={isMinor}
            />
            <p className="muted">تاريخ ميلاد الحدث. يجب أن يكون قبل تاريخ اقتراف الجريمة.</p>
          </div>
        )}

        {/* Severity level section — PROSECUTION only */}
        {showSeveritySection && (
          <div className="form-field">
            <label className="form-label" htmlFor="severityLevel">
              {crimeType === 'FELONY' ? 'الاستثناءات القانونية للجناية' : 'الجرائم الخفية والمخفية'}
            </label>
            <div className="form-checkbox-group">
              {/* HIDDEN — for all eligible prosecution crime types */}
              <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  id="hidden"
                  type="checkbox"
                  checked={severityLevel === 'HIDDEN'}
                  onChange={(e) => {
                    setSeverityLevel(e.target.checked ? 'HIDDEN' : '')
                  }}
                />
                <span>جريمة خفية / مخفية — يُدخَل تاريخ الظهور للعلن لضبط المدة المتبقية</span>
              </label>

              {/* EQUAL_TO_SENTENCE — FELONY only */}
              {crimeType === 'FELONY' && (
                <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    id="equal_to_sentence"
                    type="checkbox"
                    checked={severityLevel === 'EQUAL_TO_SENTENCE'}
                    onChange={(e) => {
                      setSeverityLevel(e.target.checked ? 'EQUAL_TO_SENTENCE' : '')
                    }}
                  />
                  <span>عقوبة مؤبد أو إعدام — مدة التقادم 30 سنة</span>
                </label>
              )}

              {/* CUSTOM — FELONY only */}
              {crimeType === 'FELONY' && (
                <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    id="custom"
                    type="checkbox"
                    checked={severityLevel === 'CUSTOM'}
                    onChange={(e) => {
                      setSeverityLevel(e.target.checked ? 'CUSTOM' : '')
                    }}
                  />
                  <span>قانون خاص — مدة التقادم 20 سنة أو مدة مخصصة</span>
                </label>
              )}
            </div>

            {severityLevel === 'CUSTOM' && crimeType === 'FELONY' && (
              <div className="mt-2">
                <label className="form-label" htmlFor="customPenaltyDuration">
                  مدة التقادم الخاصة (بالسنوات)
                </label>
                <input
                  id="customPenaltyDuration"
                  type="number"
                  min="1"
                  max="30"
                  className="form-input"
                  value={customPenaltyDuration}
                  onChange={(e) => setCustomPenaltyDuration(parseInt(e.target.value))}
                  required
                />
                <p className="muted">أدخل المدة المنصوص عليها في القانون الخاص (مثلاً: 20 سنة).</p>
              </div>
            )}
          </div>
        )}

        {/* Appearance date — hidden crimes in PROSECUTION track only */}
        {isAppearanceDateRequired && (
          <div className="form-field">
            <label className="form-label" htmlFor="appearanceDate">
              تاريخ الظهور للعلن
            </label>
            <input
              id="appearanceDate"
              type="date"
              className="form-input"
              min={crimeDate || undefined}
              max={today}
              value={appearanceDate}
              onChange={(e) => setAppearanceDate(e.target.value)}
              required
            />
            <p className="muted">
              التاريخ الذي كُشف فيه عن الجريمة للعموم. يجب أن يكون بعد تاريخ الاقتراف وليس مستقبلياً.
              {(() => {
                const elapsed = yearsBetween(crimeDate ? new Date(crimeDate) : null, appearanceDate ? new Date(appearanceDate) : null)
                if (elapsed === null || elapsed < 0) return null
                return (
                  <span style={{ display: 'block', marginTop: '0.25rem', fontWeight: 600 }}>
                    المدة الفاصلة بين الاقتراف والظهور: {elapsed} سنة.
                  </span>
                )
              })()}
            </p>
          </div>
        )}

        <div className="form-field">
          <label className="form-label" htmlFor="judicialAuthority">
            الجهة القضائية
          </label>
          <select
            id="judicialAuthority"
            className="form-select"
            value={judicialAuthority}
            onChange={(e) => setJudicialAuthority(e.target.value)}
            required
          >
            {JUDICIAL_AUTHORITIES.map((auth) => (
              <option key={auth.value} value={auth.value}>
                {auth.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="judicialOfficer">
            الصفة القضائية
          </label>
          <select
            id="judicialOfficer"
            className="form-select"
            value={judicialOfficer}
            onChange={(e) => setJudicialOfficer(e.target.value)}
            required
          >
            {OFFICER_POSITIONS[judicialAuthority]?.map((officer) => (
              <option key={officer.value} value={officer.value}>
                {officer.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="crimeDate">
            {trackType === 'PENALTY_EXECUTION'
              ? 'تاريخ الحكم النهائي الحائز لقوة الشيء المقضي فيه'
              : 'تاريخ اقتراف الجريمة'}
          </label>
          <input
            id="crimeDate"
            type="date"
            className="form-input"
            max={today}
            value={crimeDate}
            onChange={(e) => {
              setCrimeDate(e.target.value)
              // Reset appearance date if it's now before the new crime date
              if (appearanceDate && appearanceDate < e.target.value) {
                setAppearanceDate('')
              }
            }}
            required
          />
          <p className="muted">
            {trackType === 'PENALTY_EXECUTION'
              ? 'تاريخ صدور الحكم النهائي البات — هذا هو نقطة الانطلاق القانونية لحساب تقادم العقوبة.'
              : 'تاريخ وقوع الجريمة — نقطة الانطلاق الزمنية لحساب أجل التقادم.'}
          </p>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!isValid || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner" />
              <span>جارٍ تسجيل الملف...</span>
            </>
          ) : (
            'تسجيل معلومات الملف'
          )}
        </button>
      </div>
    </form>
  )
}