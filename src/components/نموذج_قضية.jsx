import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

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
      setSeverityLevel((prev) =>
        prev === 'HIDDEN' || prev === 'EQUAL_TO_SENTENCE' ? '' : prev,
      )
    }
  }, [trackType])

  const today = dayjs().format('YYYY-MM-DD')

  // In PENALTY_EXECUTION mode, isMinor and HIDDEN/EQUAL_TO_SENTENCE are not applicable
  const isMinorApplicable = trackType === 'PROSECUTION'
  // Validation logic
  const isSeverityLevelRequired = crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isCustomPenaltyRequired = severityLevel === 'CUSTOM'
  
  const isValid =
    caseReference.trim().length > 0 &&
    trackType &&
    crimeType &&
    (!isSeverityLevelRequired || (severityLevel && 
      (severityLevel !== 'CUSTOM' || (customPenaltyDuration && customPenaltyDuration >= 1 && customPenaltyDuration <= 30)))) &&
    judicialAuthority &&
    judicialOfficer &&
    crimeDate !== '' && 
    crimeDate <= today &&
    (!isMinorApplicable || !isMinor || (isMinor && minorBirthDate && minorBirthDate <= crimeDate))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return

    const crimeDateObj = new Date(crimeDate)
    const minorBirthDateObj = isMinor ? new Date(minorBirthDate) : null

    onSubmit({
      caseReference: caseReference.trim(),
      trackType,
      crimeType,
      isMinor: isMinorApplicable ? isMinor : false,
      minorBirthDate: isMinorApplicable ? minorBirthDateObj : null,
      ...(isSeverityLevelRequired && { severityLevel }),
      ...(isCustomPenaltyRequired && { customPenaltyDuration }),
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
          <p className="muted">الرقم المرجعي للملف الجزائي كما هو مُدوَّن في السجل الرسمي.</p>
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
              ? 'مرحلة تنفيذ العقوبة: يبدأ الأجل من تاريخ الحكم النهائي.'
              : 'مرحلة المتابعة الجزائية: يبدأ الأجل من تاريخ اقتراف الجريمة.'}
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
              // Reset severity level when changing crime type
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
          {crimeType === 'EXEMPTED' && (
            <p className="muted">جرائم لا تسقط بالتقادم: لا يُحتسب أجل التقادم لهذه الجريمة.</p>
          )}
        </div>

        {trackType === 'PROSECUTION' && (
          <div className="form-field">
            <label className="form-label" htmlFor="isMinor">
              قضية الأحداث
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
              <span>القضية تتعلق بحدث (قاصر) — يبدأ حساب التقادم عند بلوغه 18 سنة</span>
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

        {isSeverityLevelRequired && (
          <div className="form-field">
            <label className="form-label" htmlFor="severityLevel">
              الجرائم الخفية والمخفية / تخصيص الأجل
            </label>
            <div className="form-checkbox-group">
              {trackType === 'PROSECUTION' && (
                <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    id="hidden"
                    type="checkbox"
                    checked={severityLevel === 'HIDDEN'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSeverityLevel('HIDDEN')
                      } else if (severityLevel === 'HIDDEN') {
                        setSeverityLevel('')
                      }
                    }}
                  />
                  <span>جريمة خفية / مخفية (يبدأ الأجل من تاريخ اكتشاف الجريمة)</span>
                </label>
              )}
              
              {trackType === 'PROSECUTION' && (
                <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    id="equal_to_sentence"
                    type="checkbox"
                    checked={severityLevel === 'EQUAL_TO_SENTENCE'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSeverityLevel('EQUAL_TO_SENTENCE')
                      } else if (severityLevel === 'EQUAL_TO_SENTENCE') {
                        setSeverityLevel('')
                      }
                    }}
                  />
                  <span>مدة التقادم مساوية لمدة العقوبة</span>
                </label>
              )}
              
              <label className="form-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  id="custom"
                  type="checkbox"
                  checked={severityLevel === 'CUSTOM'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSeverityLevel('CUSTOM')
                    } else if (severityLevel === 'CUSTOM') {
                      setSeverityLevel('')
                    }
                  }}
                />
                <span>مدة تقادم خاصة (مخصصة بموجب نص قانوني)</span>
              </label>
            </div>
            
            {severityLevel === 'CUSTOM' && (
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
                <p className="muted">أدخل المدة المنصوص عليها قانوناً لأجل تقادم هذه الجريمة.</p>
              </div>
            )}
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
              ? 'تاريخ الحكم النهائي (بدء أجل تنفيذ العقوبة)'
              : 'تاريخ اقتراف الجريمة'}
          </label>
          <input
            id="crimeDate"
            type="date"
            className="form-input"
            max={today}
            value={crimeDate}
            onChange={(e) => setCrimeDate(e.target.value)}
            required
          />
          <p className="muted">
            {trackType === 'PENALTY_EXECUTION'
              ? 'تاريخ الحكم النهائي البات — هذا هو تاريخ بدء احتساب أجل التقادم في مرحلة التنفيذ.'
              : 'لا يمكن اختيار تاريخ مستقبلي. هذا التاريخ يبدأ مؤقت التقادم.'}
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