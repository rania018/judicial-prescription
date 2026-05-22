// صفحة معلومات توضيحية حول قواعد التقادم وتأثير الإجراءات — مطابقة لمنطق الخلفية
export default function معلومات_التقادم() {
  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">معلومات عن آجال التقادم وآلية المتابعة</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">أولاً: المسار الإجرائي (نظام مسارين)</div>
            <div className="card-subtitle">
              يعتمد النظام على نظامين منفصلين لتقادم الدعوى الجزائية:
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>تقادم الدعوى العمومية (مرحلة المتابعة الجزائية):</strong> يبدأ من تاريخ اقتراف الجريمة
            ويستمر وفق مدد محددة حسب نوع الجريمة.
          </li>
          <li>
            <strong>تقادم العقوبة (مرحلة تنفيذ العقوبة):</strong> يبدأ من تاريخ صدور الحكم النهائي
            ويتعلق بفترة تنفيذ العقوبة.
          </li>
        </ul>
        <p className="muted">
          عند إنشاء قضية، يجب تحديد المسار الإجرائي المناسب، وهو ما يحدد كيفية حساب التقادم.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">ثانياً: مدد التقادم حسب نوع الجريمة والمسار</div>
            <div className="card-subtitle">
              يطبّق النظام مدد التقادم التالية بشكل آلي عند إنشاء القضية.
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>تقادم الدعوى العمومية:</strong>
            <ul>
              <li><strong>جناية (FELONY):</strong> 15 سنة افتراضياً، 25 سنة إذا كانت مخفية، 30 سنة إذا كانت عقوبتها الإعدام أو المؤبد، 20 سنة إذا نص خاص</li>
              <li><strong>جنحة بسيطة (SIMPLE MISDEMEANOR):</strong> 5 سنوات افتراضياً، 10 سنوات إذا كانت مشددة، تُضاف 5 سنوات إضافية إذا كانت مخفية</li>
              <li><strong>مخالفة (VIOLATION):</strong> سنتان (2) افتراضياً</li>
              <li><strong>مستثنى من السقوط:</strong> غير قابلة للتقادم</li>
            </ul>
          </li>
          <li>
            <strong>تقادم العقوبة:</strong>
            <ul>
              <li><strong>جناية:</strong> 20 سنة</li>
              <li><strong>جنحة بسيطة:</strong> 5 سنوات</li>
              <li><strong>جنحة مشددة:</strong> تساوي مدة العقوبة المحكوم بها</li>
              <li><strong>مخالفة:</strong> سنتان (2)</li>
            </ul>
          </li>
        </ul>
        <p className="muted">
          تاريخ بدء التقادم يُحسب من تاريخ اقتراف الجريمة، وينتهي بعد المدة المحددة ما لم تحدث حالة انقطاع أو وقف.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">ثالثاً: آليات التأثير على التقادم</div>
            <div className="card-subtitle">
              يمكن التأثير على مؤقت التقادم بعدة طرق قانونية.
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>الانقطاع (Interruption):</strong> يُعادة المؤقت من الصفر، ويحدث عند:
            <ul>
              <li>إجراءات البحث والتحري (الضبطية)</li>
              <li>إجراءات مباشرة الدعوى العمومية (النيابة)</li>
              <li>إجراءات التحقيق القضائي (قاضي التحقيق)</li>
              <li>إجراءات المحاكمة</li>
            </ul>
          </li>
          <li>
            <strong>الوقف (Suspension):</strong> يُوقَف المؤقت مؤقتاً، وعند انتهاء الوقف يستأنف من حيث توقف:
            <ul>
              <li>يُستخدم لحالات محددة مثل تواري المتهم أو عدم إمكانية الوصول إليه</li>
              <li>يُمكن استئنافه لاحقاً، مما يؤدي إلى استمرار العد من حيث توقف</li>
            </ul>
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">رابعاً: حالات التقادم في النظام</div>
            <div className="card-subtitle">
              يتم احتساب الحالة من نفس المساعدات المشتركة المستعملة في اللوحة والشارات.
            </div>
          </div>
        </div>
        <p className="muted">
          تعتمد الحالة على الزمن المتبقي حتى <strong>تاريخ انتهاء التقادم</strong> كما
          يلي:
        </p>
        <ul className="info-list">
          <li>
            <strong>غير خاضعة للتقادم (NON_PRESCRIPTIBLE):</strong> القضايا المستثناة من
            السقوط.
          </li>
          <li>
            <strong>موقوفة (SUSPENDED):</strong> يوجد سبب وقف نشط فيبقى الملف خارج تصنيف
            الأحمر / الأصفر / الأخضر حتى زوال الوقف.
          </li>
          <li>
            <strong>منتهية (EXPIRED):</strong> انتهى أجل التقادم أو تجاوزه.
          </li>
          <li>
            <strong>حرجة خلال أقل من 6 أشهر (CRITICAL):</strong> أقل من ستة أشهر متبقية.
          </li>
          <li>
            <strong>متابعة خلال سنة (WARNING):</strong> من ستة أشهر إلى سنة متبقية.
          </li>
          <li>
            <strong>آمنة (ACTIVE):</strong> أكثر من سنة متبقية.
          </li>
        </ul>
        <p className="muted">
          لا يحتاج المستخدم إلى تعديل الحالة يدوياً، إذ تُعرض في الواجهة وفق القواعد
          الموحدة أعلاه في جميع صفحات النظام.
        </p>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">خامساً: صلاحيات المستخدمين</div>
            <div className="card-subtitle">
              يهدف توزيع الصلاحيات إلى حماية سلامة البيانات ومنع التعديل غير المصرّح به.
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>أمين الضبط (CLERK):</strong> يمكنه تسجيل قضايا جديدة، لا يمكنه إضافة إجراءات انقطاع أو وقف.
          </li>
          <li>
            <strong>قاضي التحقيق (INVESTIGATING_JUDGE):</strong> يمكنه فقط.trigger إجراء انقطاع نوع "إجراءات التحقيق القضائي" على القضايا المكلّف بها.
          </li>
          <li>
            <strong>النيابة العامة (PROSECUTOR):</strong> يمكنه إنشاء القضايا، وإضافة جميع أنواع الإجراءات التي تؤدي إلى انقطاع التقادم، ويمكنه أيضاً إضافة حالات وقف واستئنافها.
          </li>
          <li>
            <strong>المحامي العام (ATTORNEY_GENERAL):</strong> لديه جميع صلاحيات النيابة العامة بالإضافة إلى إدارة صلاحيات المستخدمين ومراجعة سجلات الأثر الرقابي.
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">سادساً: البيانات المخزنة في النظام</div>
            <div className="card-subtitle">
              لتوافق الواجهة مع الخلفية: الحقول التي يحسبها أو يخزنها النظام.
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>عند إنشاء القضية:</strong> الرقم المرجعي، نوع المسار، نوع الجريمة، درجة الجسامة،
            الجهة القضائية، الصفة القضائية، تاريخ اقتراف الجريمة.
          </li>
          <li>
            <strong>يُحسب تلقائياً:</strong> تاريخ بدء التقادم، تاريخ انتهاء التقادم، الحالة (تُحدَّث
            لاحقاً بالوظيفة المجدولة).
          </li>
          <li>
            <strong>عند إضافة إجراء انقطاع:</strong> يُعاد حساب التقادم من جديد وفقاً لتاريخ الإجراء.
          </li>
          <li>
            <strong>عند إضافة وقف:</strong> يتوقف المؤقت مؤقتاً، ويُعاد العد من حيث توقف عند الاستئناف.
          </li>
        </ul>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">سابعاً: التسجيل في سجلات الإجراءات</div>
            <div className="card-subtitle">
              يتم تتبع جميع إجراءات التأثير على التقادم في سجلات خاصة.
            </div>
          </div>
        </div>
        <ul className="info-list">
          <li>
            <strong>سجل الإجراءات التي تؤدي إلى انقطاع التقادم:</strong> يحتوي على تاريخ الإجراء، نوعه، من قام به، والملاحظات.
          </li>
          <li>
            <strong>سجل حالات وقف التقادم:</strong> يحتوي على تاريخ البداية، تاريخ النهاية (إن وُجد)، السبب، من أوقف، من استأنف.
          </li>
        </ul>
        <p className="muted">
          هذه السجلات تساعد في متابعة سير القضايا وتحليل فترات التقادم وضمان الشفافية في التعامل مع القضايا.
        </p>
      </div>
    </div>
  )
}