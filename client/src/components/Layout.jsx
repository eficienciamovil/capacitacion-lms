import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const adminNav = [
  { path: '/admin',          label: 'Dashboard',       icon: '📊' },
  { path: '/admin/courses',  label: 'Capacitaciones',  icon: '📚' },
  { path: '/admin/users',    label: 'Usuarios',        icon: '👥' },
  { path: '/admin/reports',  label: 'Reportes',        icon: '📋' }
];

const studentNav = [
  { path: '/dashboard',      label: 'Mis Cursos',      icon: '🏠' }
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = user?.role === 'admin' ? adminNav : studentNav;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) => {
    if (path === '/admin' || path === '/dashboard') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">L</div>
          <div>
            <p className="text-white font-semibold text-sm">LMS</p>
            <p className="text-slate-400 text-xs">Capacitación</p>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-700">
          <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">Sesión actual</p>
          <p className="text-white font-medium text-sm truncate">{user?.name}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
            user?.role === 'admin' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
          }`}>
            {user?.role === 'admin' ? 'Administrador' : 'Alumno'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-4 flex flex-col gap-1">
          {nav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <span>🚪</span>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            ☰
          </button>
          <h1 className="text-slate-900 font-semibold text-lg flex-1">
            {nav.find(n => isActive(n.path))?.label || 'LMS'}
          </h1>
          <div className="text-slate-500 text-sm hidden sm:block">
            Bienvenido, <span className="font-medium text-slate-700">{user?.name}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
