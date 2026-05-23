import { useState } from 'react'

const SECTIONS = [
  { id: 0, title: 'أولاً: المسار الإجرائي (نظام مسارين)' },
  { id: 1, title: 'ثانياً: مدد التقادم حسب نوع الجريمة والمسار' },
  { id: 2, title: 'ثالثاً: آليات التأثير على التقادم' },
  { id: 3, title: 'رابعاً: حالات التقادم في النظام' },
  { id: 4, title: 'خامساً: صلاحيات المستخدمين' },
  { id: 5, title: 'سادساً: البيانات المخزنة في النظام' },
  { id: 6, title: 'سابعاً: التسجيل في سجلات الإجراءات' },
]

export default function معلومات_التقادم() {
  const [openSection, setOpenSection] = useState(0)

  const toggle = (id) => setOpenSection(openSection === id ? null : id)

  return (
    <div>
      <div className="ds-page-header">
        <div>
          <h2 className="ds-page-title">معلومات حول آجال التقادم وآلية المتابعة</h2>
          <p className="ds-page-subtitle">دليل مرجعي شامل حول قواعد التقادم الجزائي والإجراءات المؤثرة عليه.</p>
        </div>
      </div>

      <div className="ds-info-layout">
        {/* ── Accordion ── */}
        <div className="ds-accordion">

          {/* أولاً */}
          <div className={`ds-accordion-item${openSection === 0 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(0)}>
              <span>أولاً: المسار الإجرائي (نظام مسارين)</span>
              <span className="ds-accordion-chevron">{openSection === 0 ? '▲' : '▼'}</span>
            </button>
            {openSection === 0 && (
              <div className="ds-accordion-body">
                <p className="muted mb-1">يعتمد النظام على مسارين منفصلين لتقادم الدعوى الجزائية:</p>
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>تقادم الدعوى العمومية (مرحلة المتابعة الجزائية):</strong> يبدأ من تاريخ اقتراف الجريمة ويستمر وفق مدد محددة حسب نوع الجريمة.</li>
                  <li className="ds-info-row"><strong>تقادم العقوبة (مرحلة تنفيذ العقوبة):</strong> يبدأ من تاريخ صدور الحكم النهائي ويتعلق بفترة تنفيذ العقوبة.</li>
                </ul>
                <p className="muted">عند إنشاء قضية، يجب تحديد المسار الإجرائي المناسب، وهو ما يحدد كيفية حساب التقادم.</p>
              </div>
            )}
          </div>

          {/* ثانياً */}
          <div className={`ds-accordion-item${openSection === 1 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(1)}>
              <span>ثانياً: مدد التقادم حسب نوع الجريمة والمسار</span>
              <span className="ds-accordion-chevron">{openSection === 1 ? '▲' : '▼'}</span>
            </button>
            {openSection === 1 && (
              <div className="ds-accordion-body">
                <p className="muted mb-1">يطبّق النظام مدد التقادم التالية آلياً عند إنشاء القضية.</p>
                <strong className="ds-info-subheading">تقادم الدعوى العمومية:</strong>
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>جناية:</strong> 15 سنة افتراضياً، 25 إذا كانت مخفية، 30 للإعدام/المؤبد، 20 بنص خاص.</li>
                  <li className="ds-info-row"><strong>جنحة بسيطة:</strong> 5 سنوات. تُضاف 5 سنوات إضافية إذا كانت مخفية.</li>
                  <li className="ds-info-row"><strong>جنحة مشددة:</strong> 10 سنوات.</li>
                  <li className="ds-info-row"><strong>مخالفة:</strong> سنتان.</li>
                  <li className="ds-info-row"><strong>مستثنى من السقوط:</strong> غير قابلة للتقادم.</li>
                </ul>
                <strong className="ds-info-subheading" style={{marginTop:'8px',display:'block'}}>تقادم العقوبة:</strong>
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>جناية:</strong> 20 سنة.</li>
                  <li className="ds-info-row"><strong>جنحة بسيطة:</strong> 5 سنوات.</li>
                  <li className="ds-info-row"><strong>جنحة مشددة:</strong> تساوي مدة العقوبة المحكوم بها.</li>
                  <li className="ds-info-row"><strong>مخالفة:</strong> سنتان.</li>
                </ul>
              </div>
            )}
          </div>

          {/* ثالثاً */}
          <div className={`ds-accordion-item${openSection === 2 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(2)}>
              <span>ثالثاً: آليات التأثير على التقادم</span>
              <span className="ds-accordion-chevron">{openSection === 2 ? '▲' : '▼'}</span>
            </button>
            {openSection === 2 && (
              <div className="ds-accordion-body">
                <ul className="ds-info-list">
                  <li className="ds-info-row">
                    <div>
                      <strong>الانقطاع:</strong> يُعاد احتساب المدة من جديد. يحدث عند: إجراءات الضبطية، مباشرة الدعوى العمومية، التحقيق القضائي، المحاكمة.
                    </div>
                  </li>
                  <li className="ds-info-row">
                    <div>
                      <strong>الوقف:</strong> يُجمَّد احتساب المدة إلى حين زوال سبب الوقف، ثم يُستأنف العدّ. يُستخدم لحالات محددة كتواري المتهم.
                    </div>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* رابعاً */}
          <div className={`ds-accordion-item${openSection === 3 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(3)}>
              <span>رابعاً: حالات التقادم في النظام</span>
              <span className="ds-accordion-chevron">{openSection === 3 ? '▲' : '▼'}</span>
            </button>
            {openSection === 3 && (
              <div className="ds-accordion-body">
                <p className="muted mb-1">تُحتسب الحالة وفق الزمن المتبقي حتى تاريخ انتهاء التقادم:</p>
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>غير خاضعة للتقادم:</strong> القضايا المستثناة من السقوط.</li>
                  <li className="ds-info-row"><strong>موقوفة:</strong> يوجد سبب وقف نشط — خارج تصنيف الألوان.</li>
                  <li className="ds-info-row"><strong>منتهية:</strong> انتهى أجل التقادم أو تجاوزه.</li>
                  <li className="ds-info-row"><strong>حرجة (أقل من 6 أشهر):</strong> أقل من ستة أشهر متبقية.</li>
                  <li className="ds-info-row"><strong>قيد المتابعة (أقل من سنة):</strong> من ستة أشهر إلى سنة.</li>
                  <li className="ds-info-row"><strong>آمنة:</strong> أكثر من سنة متبقية.</li>
                </ul>
                <p className="muted">لا يحتاج المستخدم إلى تعديل الحالة يدوياً — تُعرض تلقائياً في جميع صفحات النظام.</p>
              </div>
            )}
          </div>

          {/* خامساً */}
          <div className={`ds-accordion-item${openSection === 4 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(4)}>
              <span>خامساً: صلاحيات المستخدمين</span>
              <span className="ds-accordion-chevron">{openSection === 4 ? '▲' : '▼'}</span>
            </button>
            {openSection === 4 && (
              <div className="ds-accordion-body">
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>أمين الضبط:</strong> تسجيل القضايا واستخراج بطاقة المعلومات. لا يمكنه إضافة إجراءات انقطاع أو وقف.</li>
                  <li className="ds-info-row"><strong>القاضي:</strong> إجراءات كاملة على القضايا المكلَّف بها، بما في ذلك الانقطاع والوقف.</li>
                  <li className="ds-info-row"><strong>وكيل الجمهورية:</strong> اطلاع رقابي على ملفات قضاة المحكمة. تصرف كامل في ملفاته الخاصة فقط.</li>
                  <li className="ds-info-row"><strong>النائب العام:</strong> اطلاع شامل على ملفات قضاة المجلس. تصرف كامل في ملفاته الخاصة + إدارة المستخدمين.</li>
                </ul>
              </div>
            )}
          </div>

          {/* سادساً */}
          <div className={`ds-accordion-item${openSection === 5 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(5)}>
              <span>سادساً: البيانات المخزنة في النظام</span>
              <span className="ds-accordion-chevron">{openSection === 5 ? '▲' : '▼'}</span>
            </button>
            {openSection === 5 && (
              <div className="ds-accordion-body">
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>عند إنشاء القضية:</strong> الرقم المرجعي، نوع المسار، نوع الجريمة، درجة الجسامة، الجهة القضائية، الصفة القضائية، تاريخ اقتراف الجريمة.</li>
                  <li className="ds-info-row"><strong>يُحسب تلقائياً:</strong> تاريخ بدء التقادم، تاريخ انتهاء التقادم، الحالة.</li>
                  <li className="ds-info-row"><strong>عند إضافة إجراء انقطاع:</strong> يُعاد حساب التقادم من جديد وفقاً لتاريخ الإجراء.</li>
                  <li className="ds-info-row"><strong>عند إضافة وقف:</strong> يُجمَّد احتساب المدة، ثم يُستأنف عند رفع الوقف.</li>
                </ul>
              </div>
            )}
          </div>

          {/* سابعاً */}
          <div className={`ds-accordion-item${openSection === 6 ? ' ds-accordion-item--open' : ''}`}>
            <button className="ds-accordion-header" onClick={() => toggle(6)}>
              <span>سابعاً: التسجيل في سجلات الإجراءات</span>
              <span className="ds-accordion-chevron">{openSection === 6 ? '▲' : '▼'}</span>
            </button>
            {openSection === 6 && (
              <div className="ds-accordion-body">
                <ul className="ds-info-list">
                  <li className="ds-info-row"><strong>سجل إجراءات الانقطاع:</strong> تاريخ الإجراء، نوعه، من قام به، والملاحظات.</li>
                  <li className="ds-info-row"><strong>سجل حالات الوقف:</strong> تاريخ البداية، تاريخ النهاية، السبب، من أوقف، من استأنف.</li>
                </ul>
                <p className="muted">تضمن هذه السجلات الشفافية وتحليل فترات التقادم ومتابعة سير القضايا.</p>
              </div>
            )}
          </div>

        </div>

        {/* ── TOC Sidebar ── */}
        <nav className="ds-toc">
          <span className="ds-toc-title">الفهرس</span>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`ds-toc-link${openSection === s.id ? ' ds-toc-link--active' : ''}`}
              onClick={() => toggle(s.id)}
            >
              {s.title}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}
