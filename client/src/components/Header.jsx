import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, History, LayoutDashboard, FlaskConical } from 'lucide-react';

const NAV = [
  { to: '/',          label: 'Dashboard',   Icon: LayoutDashboard },
  { to: '/runs',      label: 'Run History', Icon: History },
  { to: '/registry',  label: 'Registry',    Icon: FlaskConical },
];

export default function Header() {
  const { pathname } = useLocation();

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="text-white font-bold text-base leading-tight tracking-tight">
                OTM Automation Portal
              </div>
              <div className="text-blue-300/60 text-xs">Oracle Transportation Management</div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex gap-1">
            {NAV.map(({ to, label, Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === to || (to !== '/' && pathname.startsWith(to))
                    ? 'bg-white/20 text-white'
                    : 'text-blue-200/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

        </div>
      </div>
    </header>
  );
}
