import { useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
// @ts-ignore JSX modules are implemented in JS
import { useAuth } from './context/AuthContext.jsx'
// @ts-ignore JSX modules are implemented in JS
import تسجيل_الدخول from './pages/تسجيل_الدخول.jsx'
// @ts-ignore JSX modules are implemented in JS
import لوحة_التحكم from './pages/لوحة_التحكم.jsx'
// @ts-ignore JSX modules are implemented in JS
import القضايا from './pages/القضايا.jsx'
// @ts-ignore JSX modules are implemented in JS
import تفاصيل_القضية from './pages/تفاصيل_القضية.jsx'
// @ts-ignore JSX modules are implemented in JS
import إنشاء_قضية from './pages/إنشاء_قضية.jsx'
// @ts-ignore JSX modules are implemented in JS
import إدارة_المستخدمين from './pages/إدارة_المستخدمين.jsx'
// @ts-ignore JSX modules are implemented in JS
import طباعة_القضية from './pages/طباعة_القضية.jsx'
// @ts-ignore JSX modules are implemented in JS
import مسار_محمي from './components/مسار_محمي.jsx'
// @ts-ignore JSX modules are implemented in JS
import معلومات_التقادم from './pages/معلومات_التقادم.jsx'

function App() {
  const { user, logout, role } = useAuth()
  const [navOpen, setNavOpen] = useState(false)

  const closeNav = () => setNavOpen(false)

  return (
    <div className="app-shell">
      {user && (
        <header className="app-header">
          <div className="app-header-inner">
            <div className="app-header-title">نظام متابعة آجال التقادم</div>
            <button
              type="button"
              className="app-nav-toggle"
              onClick={() => setNavOpen((o) => !o)}
              aria-expanded={navOpen}
              aria-label={navOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            >
              <span className="app-nav-toggle-bar" />
              <span className="app-nav-toggle-bar" />
              <span className="app-nav-toggle-bar" />
            </button>
          </div>
          <nav className={`app-nav ${navOpen ? 'app-nav--open' : ''}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
              }
              onClick={closeNav}
            >
              لوحة التحكم
            </NavLink>
            <NavLink
              to="/القضايا"
              className={({ isActive }) =>
                `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
              }
              onClick={closeNav}
            >
              القضايا
            </NavLink>
            <NavLink
              to="/معلومات-التقادم"
              className={({ isActive }) =>
                `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
              }
              onClick={closeNav}
            >
              معلومات عن التقادم
            </NavLink>
            {role === 'ATTORNEY_GENERAL' && (
              <NavLink
                to="/إدارة-المستخدمين"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
                }
                onClick={closeNav}
              >
                إدارة المستخدمين
              </NavLink>
            )}
            {role === 'CLERK' && (
              <NavLink
                to="/إنشاء-قضية"
                className={({ isActive }) =>
                  `app-nav-link ${isActive ? 'app-nav-link-active' : ''}`
                }
                onClick={closeNav}
              >
                إنشاء قضية
              </NavLink>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => { closeNav(); logout(); }}>
              تسجيل الخروج
            </button>
          </nav>
          {navOpen && (
            <div
              className="app-nav-overlay"
              onClick={closeNav}
              onKeyDown={(e) => e.key === 'Escape' && closeNav()}
              role="button"
              tabIndex={0}
              aria-label="إغلاق القائمة"
            />
          )}
        </header>
      )}

      <main className="app-main">
        <Routes>
          <Route path="/تسجيل-الدخول" element={<تسجيل_الدخول />} />

          <Route
            path="/"
            element={
              <مسار_محمي>
                <لوحة_التحكم />
              </مسار_محمي>
            }
          />

          <Route
            path="/القضايا"
            element={
              <مسار_محمي>
                <القضايا />
              </مسار_محمي>
            }
          />

          <Route
            path="/القضايا/:caseId"
            element={
              <مسار_محمي>
                <تفاصيل_القضية />
              </مسار_محمي>
            }
          />

          <Route
            path="/القضايا/:caseId/طباعة"
            element={
              <مسار_محمي>
                <طباعة_القضية />
              </مسار_محمي>
            }
          />

          <Route
            path="/إنشاء-قضية"
            element={
              <مسار_محمي allowedRoles={['CLERK']}>
                <إنشاء_قضية />
              </مسار_محمي>
            }
          />

          <Route
            path="/إدارة-المستخدمين"
            element={
              <مسار_محمي allowedRoles={['ATTORNEY_GENERAL']}>
                <إدارة_المستخدمين />
              </مسار_محمي>
            }
          />

          <Route
            path="/معلومات-التقادم"
            element={
              <مسار_محمي>
                <معلومات_التقادم />
              </مسار_محمي>
            }
          />

          <Route path="*" element={<تسجيل_الدخول />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
