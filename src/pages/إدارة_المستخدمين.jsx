import { useEffect, useState } from 'react'
import { listUsers, updateUserRoleAndActive, updateUserProfile } from '../services/userService'
// @ts-ignore JSX module implemented in JS
import { useToast } from '../context/ToastContext.jsx'

const ROLES = [
  { value: 'CLERK', label: 'أمين الضبط' },
  { value: 'JUDGE', label: 'قاضٍ' },
  { value: 'PUBLIC_PROSECUTOR', label: 'وكيل الجمهورية' },
  { value: 'ATTORNEY_GENERAL', label: 'النائب العام' },
  // Legacy entries so existing records display correctly in the dropdown
  { value: 'INVESTIGATING_JUDGE', label: 'قاضي التحقيق (قديم)' },
  { value: 'PROSECUTOR', label: 'النيابة العامة (قديم)' },
]

export default function إدارة_المستخدمين() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const toast = useToast()

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await listUsers()
      data.sort((a, b) => a.id.localeCompare(b.id))
      setUsers(data)
    } catch (e) {
      setError('تعذر تحميل قائمة المستخدمين. يرجى المحاولة لاحقاً.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleChangeRole = async (id, role) => {
    setSavingId(id)
    setError('')
    try {
      await updateUserRoleAndActive(id, { role })
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, role } : u)),
      )
      toast.success('تم تحديث صلاحيات المستخدم بنجاح.')
    } catch (e) {
      setError('تعذر تحديث صلاحيات المستخدم. يرجى المحاولة لاحقاً.')
      toast.error('تعذر تحديث صلاحيات المستخدم. يرجى المحاولة لاحقاً.')
    } finally {
      setSavingId(null)
    }
  }

  const handleToggleActive = async (id, currentActive) => {
    const nextActive = !currentActive
    setSavingId(id)
    setError('')
    try {
      await updateUserRoleAndActive(id, { active: nextActive })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, active: nextActive } : u,
        ),
      )
      toast.success('تم تحديث حالة الحساب بنجاح.')
    } catch (e) {
      setError('تعذر تحديث حالة الحساب. يرجى المحاولة لاحقاً.')
      toast.error('تعذر تحديث حالة الحساب. يرجى المحاولة لاحقاً.')
    } finally {
      setSavingId(null)
    }
  }

  const handleScopeUpdate = async (id, field, value) => {
    setSavingId(id)
    setError('')
    try {
      await updateUserProfile(id, { [field]: value || null })
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, [field]: value || null } : u)),
      )
      toast.success('تم تحديث نطاق الاختصاص بنجاح.')
    } catch (e) {
      setError('تعذر تحديث نطاق الاختصاص. يرجى المحاولة لاحقاً.')
      toast.error('تعذر تحديث نطاق الاختصاص. يرجى المحاولة لاحقاً.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">إدارة المستخدمين والصلاحيات</h2>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">قائمة المستخدمين</div>
            <div className="card-subtitle">
              إدارة صلاحيات الوصول للنظام وفقاً لدور كل مستخدم. يمكن تحديد
              معرّف المحكمة (courtId) لوكلاء الجمهورية ومعرّف المجلس (councilId)
              للنواب العامين لتفعيل الاطلاع الرقابي.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={load}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                <span>جارٍ التحديث...</span>
              </>
            ) : (
              'تحديث القائمة'
            )}
          </button>
        </div>

        {error && (
          <p className="error-text" style={{ marginBottom: '0.75rem' }}>
            {error}
          </p>
        )}

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <div className="spinner" />
            <span>جارٍ تحميل المستخدمين...</span>
          </div>
        ) : users.length === 0 ? (
          <p className="muted">لا يوجد مستخدمون مسجّلون في النظام حالياً.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>المعرّف (UID)</th>
                  <th>الاسم</th>
                  <th>الدور</th>
                  <th>معرّف المحكمة</th>
                  <th>معرّف المجلس</th>
                  <th>حالة الحساب</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontSize: '0.75rem' }}>{u.id}</td>
                    <td>{u.displayName ?? '—'}</td>
                    <td>
                      <select
                        className="form-select"
                        value={u.role ?? ''}
                        onChange={(e) =>
                          handleChangeRole(u.id, e.target.value)
                        }
                        disabled={savingId === u.id}
                      >
                        <option value="" disabled>
                          اختر الدور
                        </option>
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '8rem' }}
                        defaultValue={u.courtId ?? ''}
                        placeholder="court-01"
                        onBlur={(e) =>
                          handleScopeUpdate(u.id, 'courtId', e.target.value.trim())
                        }
                        disabled={savingId === u.id}
                        title="معرّف المحكمة — للاطلاع الرقابي لوكيل الجمهورية"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '8rem' }}
                        defaultValue={u.councilId ?? ''}
                        placeholder="council-01"
                        onBlur={(e) =>
                          handleScopeUpdate(u.id, 'councilId', e.target.value.trim())
                        }
                        disabled={savingId === u.id}
                        title="معرّف المجلس — للاطلاع الرقابي للنائب العام"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={
                          u.active === false
                            ? 'btn btn-secondary btn-sm'
                            : 'btn btn-primary btn-sm'
                        }
                        onClick={() =>
                          handleToggleActive(u.id, u.active !== false)
                        }
                        disabled={savingId === u.id}
                      >
                        {u.active === false ? 'موقوف' : 'نشط'}
                      </button>
                    </td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

