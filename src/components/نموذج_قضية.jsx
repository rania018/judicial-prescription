import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

const CRIME_TYPES = [
  { value: 'FELONY', label: 'جناية' },
  { value: 'SIMPLE_MISDEMEANOR', label: 'جنحة بسيطة' },
  { value: 'AGGRAVATED_MISDEMEANOR', label: 'جنحة مشددة' },
  { value: 'VIOLATION', label: 'مخالفة' },
  { value: 'EXEMPTED', label: 'مستثنى من السقوط' },
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
    { value: 'INVESTIGATING_JUDGE', label: 'قاضي التحقيق' },
  ],
  COUNCIL: [
    { value: 'ATTORNEY_GENERAL', label: 'النائب العام' },
    { value: 'INVESTIGATING_JUDGE', label: 'قاضي التحقيق' },
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

  const today = dayjs().format('YYYY-MM-DD')

  // Validation logic
  const isSeverityLevelRequired = crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isCustomPenaltyRequired = severityLevel === 'CUSTOM'
  const isMinorBirthDateRequired = isMinor && minorBirthDate !== ''
  
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
    (!isMinor || (isMinor && minorBirthDate && minorBirthDate <= crimeDate))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return

    const crimeDateObj = new Date(crimeDate)
    const minorBirthDateObj = isMinor ? new Date(minorBirthDate) : null

    onSubmit({
      caseReference: caseReference.trim(),
      trackType,
      crimeType,
      isMinor,
      minorBirthDate: minorBirthDateObj,
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
            الرقم المرجعي
          </label>
          <input
            id="caseReference"
            type="text"
            className="form-input"
            value={caseReference}
            onChange={(e) => setCaseReference(e.target.value)}
            required
          />
          <p className="muted">الرقم المرجعي للملف الجزائي.</p>
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
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="crimeType">
            نوع الجريمة
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
        </div>

        <div className="form-field">
          <label className="form-label" htmlFor="isMinor">
            قضية قاصر
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
            <span>القضية تتعلق بقاصر (يبدأ حساب التقادم عند بلوغ 18 سنة)</span>
          </label>
        </div>

        {isMinor && (
          <div className="form-field">
            <label className="form-label" htmlFor="minorBirthDate">
              تاريخ ميلاد القاصر
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
            <p className="muted">تاريخ ميلاد القاصر. يجب أن يكون قبل تاريخ اقتراف الجريمة.</p>
          </div>
        )}

        {isSeverityLevelRequired && (
          <div className="form-field">
            <label className="form-label" htmlFor="severityLevel">
              درجة الجسامة
            </label>
            <div className="form-checkbox-group">
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
                <span>مخفية</span>
              </label>
              
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
                  <span>مساوية لمدة العقوبة</span>
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
                <span>مدة تخصيص العقوبة</span>
              </label>
            </div>
            
            {severityLevel === 'CUSTOM' && (
              <div className="mt-2">
                <label className="form-label" htmlFor="customPenaltyDuration">
                  مدة تخصيص العقوبة (بالسنوات)
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
            تاريخ اقتراف الجريمة
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
          <p className="muted">لا يمكن اختيار تاريخ مستقبلي. هذا التاريخ يبدأ مؤقت التقادم.</p>
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
              <span>جارٍ إنشاء الملف...</span>
            </>
          ) : (
            'إنشاء ملف جديد'
          )}
        </button>
      </div>
    </form>
  )
}