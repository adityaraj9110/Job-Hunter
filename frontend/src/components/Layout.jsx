import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/apply', icon: '⚡', label: 'Apply' },
  { path: '/info', icon: 'ℹ️', label: 'Info Settings' },
  { path: '/resume', icon: '📄', label: 'Resume' },
];

export default function Layout() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="bolt">⚡</span>
          <h1>AutoApply</h1>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '0 20px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Personal Portal v1.0
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
