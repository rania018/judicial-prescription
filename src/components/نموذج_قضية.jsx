import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { NON_PRESCRIPTIBLE_CATEGORIES } from '../utils/statusHelpers'
import { yearsBetween, calculatePrescriptionDuration } from '../utils/prescription'

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

const CRIME_TYPE_LABELS_MAP = {
  FELONY: 'جناية',
  SIMPLE_MISDEMEANOR: 'جنحة بسيطة',
  AGGRAVATED_MISDEMEANOR: 'جنحة مشددة',
  VIOLATION: 'مخالفة',
  EXEMPTED: 'لا تسقط بالتقادم',
}

function computePreviewStatus(endDateStr) {
  if (!endDateStr) return null
  const days = dayjs(endDateStr).diff(dayjs(), 'day')
  if (days < 0)   return { label: 'منتهٍ',  color: 'var(--color-expired)',          tint: 'var(--color-expired-tint)' }
  if (days < 180) return { label: 'حرج',     color: 'var(--color-critical)',         tint: 'var(--color-critical-tint)' }
  if (days < 365) return { label: 'تحذير',   color: 'var(--color-warning)',          tint: 'var(--color-warning-tint)' }
  return             { label: 'نشط',     color: 'var(--color-safe)',             tint: 'var(--color-safe-tint)' }
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

  useEffect(() => {
    const availableOfficers = OFFICER_POSITIONS[judicialAuthority] || []
    if (availableOfficers.length > 0) {
      setJudicialOfficer(availableOfficers[0].value)
    }
  }, [judicialAuthority])

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

  useEffect(() => {
    if (severityLevel !== 'HIDDEN') {
      setAppearanceDate('')
    }
  }, [severityLevel])

  useEffect(() => {
    if (crimeType !== 'EXEMPTED') {
      setNonPrescriptibleCategory('')
    }
  }, [crimeType])

  const today = dayjs().format('YYYY-MM-DD')

  const isMinorApplicable        = trackType === 'PROSECUTION'
  const isHiddenApplicable       = trackType === 'PROSECUTION' && crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isAppearanceDateRequired = severityLevel === 'HIDDEN' && isHiddenApplicable
  const showSeveritySection      = trackType === 'PROSECUTION' && crimeType !== 'VIOLATION' && crimeType !== 'EXEMPTED'
  const isCustomPenaltyRequired  = severityLevel === 'CUSTOM' && crimeType === 'FELONY'
  const showSentenceYears        = trackType === 'PENALTY_EXECUTION' && crimeType === 'AGGRAVATED_MISDEMEANOR'
  const isSeverityLevelRequired  = showSeveritySection && crimeType === 'FELONY'
  const isNonPrescriptibleCategoryRequired = crimeType === 'EXEMPTED'

  const isCustomPenaltyValid =
    severityLevel !== 'CUSTOM' ||
    (customPenaltyDuration && customPenaltyDuration >= 1 && customPenaltyDuration <= 30)
  const isMinorValid =
    !isMinorApplicable || !isMinor || (minorBirthDate && minorBirthDate <= crimeDate)
  const isAppearanceDateValid =
    !isAppearanceDateRequired ||
    (appearanceDate && appearanceDate >= crimeDate && appearanceDate <= today)
  const isSentenceYearsValid =
    !showSentenceYears || (sentenceYears && sentenceYears >= 5 && sentenceYears <= 20)

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

    const crimeDateObj      = new Date(crimeDate)
    const minorBirthDateObj = isMinor ? new Date(minorBirthDate) : null
    const appearanceDateObj =
      isAppearanceDateRequired && appearanceDate ? new Date(appearanceDate) : null

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

  // ── Live preview computed values ────────────────────────
  const prescriptionYears = useMemo(() => {
    if (crimeType === 'EXEMPTED') return null
    try {
      return calculatePrescriptionDuration({
        trackType,
        crimeType,
        severityLevel,
        customPenaltyDuration,
        sentenceYears,
      })
    } catch {
      return null
    }
  }, [trackType, crimeType, severityLevel, customPenaltyDuration, sentenceYears])

  const previewEndDate = useMemo(() => {
    if (!crimeDate || prescriptionYears === null) return null
    return dayjs(crimeDate).add(prescriptionYears, 'year').format('YYYY/MM/DD')
  }, [crimeDate, prescriptionYears])

  const previewStatus = useMemo(() => {
    if (crimeType === 'EXEMPTED') {
      return {
        label: 'لا يسقط',
        color: 'var(--color-non-prescriptible)',
        tint: 'var(--color-non-prescriptible-tint)',
      }
    }
    return computePreviewStatus(previewEndDate)
  }, [crimeType, previewEndDate])

  const durationLabel =
    crimeType === 'EXEMPTED' ? 'لا تسقط' :
    prescriptionYears !== null ? `${prescriptionYears} سنة` : 'غير محدد'

  return (
    <div className="nf-layout">

      {/* ── Sticky live preview (right in RTL) ────────────── */}
      <aside className="nf-preview">
        <div className="nf-preview__header">
          <span>📋</span>
          <span>معاينة حية للقضية</span>
        </div>

        <div className="nf-preview__rows">
          <div className="nf-preview__row">
            <span className="nf-preview__label">الرقم المرجعي</span>
            <span className="nf-preview__value">{caseReference || '—'}</span>
          </div>
          <div className="nf-preview__row">
            <span className="nf-preview__label">نوع الجريمة</span>
            <span className="nf-preview__value">{CRIME_TYPE_LABELS_MAP[crimeType]}</span>
          </div>
          <div className="nf-preview__row">
            <span className="nf-preview__label">مدة التقادم</span>
            <span className="nf-preview__value">{durationLabel}</span>
          </div>
          <div className="nf-preview__row">
            <span className="nf-preview__label">تاريخ الجريمة</span>
            <span className="nf-preview__value">
              {crimeDate ? dayjs(crimeDate).format('YYYY/MM/DD') : '—'}
            </span>
          </div>
          <div className="nf-preview__row">
            <span className="nf-preview__label">الحالة المتوقعة</span>
            <span>
              {previewStatus ? (
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    borderRadius: '99px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: previewStatus.tint,
                    color: previewStatus.color,
                    border: `1px solid ${previewStatus.color}55`,
                  }}
                >
                  {previewStatus.label}
                </span>
              ) : '—'}
            </span>
          </div>
        </div>

        <div className="nf-preview__expiry">
          <p className="nf-preview__expiry-label">تاريخ انتهاء التقادم</p>
          <p className="nf-preview__expiry-value">
            {previewEndDate
              ? previewEndDate
              : crimeType === 'EXEMPTED'
              ? 'لا ينطبق'
              : '—'}
          </p>
        </div>
      </aside>

      {/* ── Form (left in RTL) ─────────────────────────────── */}
      <form onSubmit={handleSubmit}>

        {/* ── Section 1 : معلومات الملف ──────────────────── */}
        <div className="nf-section-card">
          <div className="nf-section-header">
            <span className="nf-section-icon nf-section-icon--blue">🗂</span>
            <div>
              <h3 className="nf-section-title">معلومات الملف</h3>
              <p className="nf-section-subtitle">البيانات التعريفية للقضية والمسار الإجرائي</p>
            </div>
          </div>
          <div className="nf-section-body">
            <div className="ds-form-grid">
              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="caseReference">الرقم المرجعي للملف</label>
                <input
                  id="caseReference"
                  type="text"
                  className="ds-form-input"
                  placeholder="مثال: l26-001"
                  value={caseReference}
                  onChange={(e) => setCaseReference(e.target.value)}
                  required
                />
                <span className="ds-form-hint">المعرّف الفريد للملف — يربط السجل الرقمي بالنسخة الورقية.</span>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="trackType">المسار الإجرائي</label>
                <select
                  id="trackType"
                  className="ds-form-select"
                  value={trackType}
                  onChange={(e) => setTrackType(e.target.value)}
                  required
                >
                  {TRACK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <span className="ds-form-hint">
                  {trackType === 'PENALTY_EXECUTION'
                    ? 'تقادم العقوبة: يبدأ من تاريخ الحكم النهائي البات.'
                    : 'تقادم الدعوى العمومية: يبدأ من تاريخ اقتراف الجريمة.'}
                </span>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="crimeType">تصنيف الجريمة</label>
                <select
                  id="crimeType"
                  className="ds-form-select"
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
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {crimeType === 'FELONY' && trackType === 'PROSECUTION' && (
                  <span className="ds-form-hint">الجناية: الأصل 15 سنة. استثناء: قوانين خاصة تُحدد 20 أو 30 سنة.</span>
                )}
                {crimeType === 'FELONY' && trackType === 'PENALTY_EXECUTION' && (
                  <span className="ds-form-hint">تقادم عقوبة الجناية: 20 سنة من تاريخ الحكم النهائي.</span>
                )}
                {crimeType === 'SIMPLE_MISDEMEANOR' && (
                  <span className="ds-form-hint">جنحة بسيطة: مدة التقادم 5 سنوات.</span>
                )}
                {crimeType === 'AGGRAVATED_MISDEMEANOR' && trackType === 'PROSECUTION' && (
                  <span className="ds-form-hint">جنحة مشددة: مدة التقادم 10 سنوات.</span>
                )}
                {crimeType === 'AGGRAVATED_MISDEMEANOR' && trackType === 'PENALTY_EXECUTION' && (
                  <span className="ds-form-hint">تقادم العقوبة: مساوية لمدة الحكم (5–20 سنة).</span>
                )}
                {crimeType === 'VIOLATION' && (
                  <span className="ds-form-hint">المخالفة: مدة التقادم سنتان.</span>
                )}
                {crimeType === 'EXEMPTED' && (
                  <span className="ds-form-hint">لا تسقط بالتقادم — يُعطَّل حساب الأجل.</span>
                )}
              </div>

              {crimeType === 'EXEMPTED' && (
                <div className="ds-form-group">
                  <label className="ds-form-label" htmlFor="nonPrescriptibleCategory">فئة الجريمة</label>
                  <select
                    id="nonPrescriptibleCategory"
                    className="ds-form-select"
                    value={nonPrescriptibleCategory}
                    onChange={(e) => setNonPrescriptibleCategory(e.target.value)}
                    required
                  >
                    <option value="">— اختر الفئة —</option>
                    {NON_PRESCRIPTIBLE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2 : تفاصيل القضية ──────────────────── */}
        <div className="nf-section-card">
          <div className="nf-section-header">
            <span className="nf-section-icon nf-section-icon--teal">⚖️</span>
            <div>
              <h3 className="nf-section-title">تفاصيل القضية</h3>
              <p className="nf-section-subtitle">الجهة القضائية والتاريخ المرجعي لاحتساب الأجل</p>
            </div>
          </div>
          <div className="nf-section-body">
            <div className="ds-form-grid">
              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="judicialAuthority">الجهة القضائية</label>
                <select
                  id="judicialAuthority"
                  className="ds-form-select"
                  value={judicialAuthority}
                  onChange={(e) => setJudicialAuthority(e.target.value)}
                  required
                >
                  {JUDICIAL_AUTHORITIES.map((auth) => (
                    <option key={auth.value} value={auth.value}>{auth.label}</option>
                  ))}
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="judicialOfficer">الصفة القضائية</label>
                <select
                  id="judicialOfficer"
                  className="ds-form-select"
                  value={judicialOfficer}
                  onChange={(e) => setJudicialOfficer(e.target.value)}
                  required
                >
                  {OFFICER_POSITIONS[judicialAuthority]?.map((officer) => (
                    <option key={officer.value} value={officer.value}>{officer.label}</option>
                  ))}
                </select>
              </div>

              <div className="ds-form-group">
                <label className="ds-form-label" htmlFor="crimeDate">
                  {trackType === 'PENALTY_EXECUTION'
                    ? 'تاريخ الحكم النهائي البات'
                    : 'تاريخ اقتراف الجريمة'}
                </label>
                <input
                  id="crimeDate"
                  type="date"
                  className="ds-form-input"
                  max={today}
                  value={crimeDate}
                  onChange={(e) => {
                    setCrimeDate(e.target.value)
                    if (appearanceDate && appearanceDate < e.target.value) {
                      setAppearanceDate('')
                    }
                  }}
                  required
                />
                <span className="ds-form-hint">
                  {trackType === 'PENALTY_EXECUTION'
                    ? 'نقطة انطلاق حساب تقادم العقوبة.'
                    : 'نقطة انطلاق حساب أجل التقادم.'}
                </span>
              </div>

              {trackType === 'PROSECUTION' && (
                <div className="ds-form-group">
                  <label className="ds-form-label">قضية الحدث (قاصر)</label>
                  <label className="ds-checkbox-label">
                    <input
                      id="isMinor"
                      type="checkbox"
                      checked={isMinor}
                      onChange={(e) => {
                        setIsMinor(e.target.checked)
                        if (!e.target.checked) setMinorBirthDate('')
                      }}
                    />
                    <span>القضية تتعلق بحدث — يُجمَّد الحساب حتى بلوغه سن الرشد (18 سنة)</span>
                  </label>
                </div>
              )}

              {trackType === 'PROSECUTION' && isMinor && (
                <div className="ds-form-group">
                  <label className="ds-form-label" htmlFor="minorBirthDate">تاريخ ميلاد الحدث</label>
                  <input
                    id="minorBirthDate"
                    type="date"
                    className="ds-form-input"
                    max={crimeDate || today}
                    value={minorBirthDate}
                    onChange={(e) => setMinorBirthDate(e.target.value)}
                    required={isMinor}
                  />
                </div>
              )}

              {showSentenceYears && (
                <div className="ds-form-group">
                  <label className="ds-form-label" htmlFor="sentenceYears">مدة الحكم (سنوات)</label>
                  <input
                    id="sentenceYears"
                    type="number"
                    min="5"
                    max="20"
                    className="ds-form-input"
                    value={sentenceYears}
                    onChange={(e) => setSentenceYears(parseInt(e.target.value, 10))}
                    required
                  />
                  <span className="ds-form-hint">مدة تقادم العقوبة = مدة الحكم المحكوم به (5–20 سنة).</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 3 : الاستثناءات القانونية ─────────── */}
        {showSeveritySection && (
          <div className="nf-section-card">
            <div className="nf-section-header">
              <span className="nf-section-icon nf-section-icon--amber">⚠️</span>
              <div>
                <h3 className="nf-section-title">الاستثناءات القانونية</h3>
                <p className="nf-section-subtitle">تؤثر مباشرة على مدة التقادم المحتسبة</p>
              </div>
            </div>
            <div className="nf-section-body">

              <label className="nf-check-item">
                <input
                  type="checkbox"
                  checked={severityLevel === 'HIDDEN'}
                  onChange={(e) => setSeverityLevel(e.target.checked ? 'HIDDEN' : '')}
                />
                <div className="nf-check-item__body">
                  <div className="nf-check-item__title">
                    جريمة خفية أو مخفية
                    <span className="nf-check-badge nf-check-badge--blue">تأجيل البداية</span>
                  </div>
                  <div className="nf-check-item__desc">يُدخَل تاريخ الظهور للإعلان لضبط المدة المتبقية</div>
                </div>
              </label>

              {crimeType === 'FELONY' && (
                <label className="nf-check-item">
                  <input
                    type="checkbox"
                    checked={severityLevel === 'EQUAL_TO_SENTENCE'}
                    onChange={(e) => setSeverityLevel(e.target.checked ? 'EQUAL_TO_SENTENCE' : '')}
                  />
                  <div className="nf-check-item__body">
                    <div className="nf-check-item__title">
                      عقوبة مؤبد أو إعدام
                      <span className="nf-check-badge nf-check-badge--amber">تمديد إلى 30 سنة</span>
                    </div>
                    <div className="nf-check-item__desc">مدة التقادم تصبح 30 سنة بدلاً من المدة العادية</div>
                  </div>
                </label>
              )}

              {crimeType === 'FELONY' && (
                <label className="nf-check-item">
                  <input
                    type="checkbox"
                    checked={severityLevel === 'CUSTOM'}
                    onChange={(e) => setSeverityLevel(e.target.checked ? 'CUSTOM' : '')}
                  />
                  <div className="nf-check-item__body">
                    <div className="nf-check-item__title">
                      قانون خاص بمدة مخصصة
                      <span className="nf-check-badge nf-check-badge--purple">سنة استثنائية</span>
                    </div>
                    <div className="nf-check-item__desc">مدة التقادم 20 سنة أو مدة مخصصة بنص قانوني خاص</div>
                  </div>
                </label>
              )}

              {isCustomPenaltyRequired && (
                <div className="nf-sub-field">
                  <div className="ds-form-group" style={{ maxWidth: '280px' }}>
                    <label className="ds-form-label" htmlFor="customPenaltyDuration">مدة التقادم الخاصة (سنوات)</label>
                    <input
                      id="customPenaltyDuration"
                      type="number"
                      min="1"
                      max="30"
                      className="ds-form-input"
                      value={customPenaltyDuration}
                      onChange={(e) => setCustomPenaltyDuration(parseInt(e.target.value, 10))}
                      required
                    />
                  </div>
                </div>
              )}

              {isAppearanceDateRequired && (
                <div className="nf-sub-field">
                  <div className="ds-form-group" style={{ maxWidth: '280px' }}>
                    <label className="ds-form-label" htmlFor="appearanceDate">تاريخ الظهور للعلن</label>
                    <input
                      id="appearanceDate"
                      type="date"
                      className="ds-form-input"
                      min={crimeDate || undefined}
                      max={today}
                      value={appearanceDate}
                      onChange={(e) => setAppearanceDate(e.target.value)}
                      required
                    />
                    <span className="ds-form-hint">
                      {(() => {
                        const elapsed = yearsBetween(
                          crimeDate ? new Date(crimeDate) : null,
                          appearanceDate ? new Date(appearanceDate) : null,
                        )
                        if (elapsed === null || elapsed < 0) return 'التاريخ الذي كُشف فيه عن الجريمة.'
                        return `المدة الفاصلة بين الاقتراف والظهور: ${elapsed} سنة.`
                      })()}
                    </span>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        <button
          type="submit"
          className="ds-btn ds-btn--primary ds-btn--full"
          disabled={!isValid || submitting}
        >
          {submitting ? (
            <>
              <span className="ds-spinner" style={{ borderTopColor: '#fff', width: 16, height: 16 }} />
              <span>جارٍ تسجيل الملف...</span>
            </>
          ) : (
            'تسجيل معلومات الملف'
          )}
        </button>
      </form>
    </div>
  )
}