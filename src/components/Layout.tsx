/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Laptop, Users, Repeat, AlertTriangle, Settings, Database, Server, FileSpreadsheet } from 'lucide-react';
import { STRINGS } from '../utils/constants';
import { useApp } from '../store/appStore';

export const Sidebar: React.FC = () => {
  const links = [
    { to: "/", icon: Home, label: STRINGS.DASHBOARD },
    { to: "/dispositius", icon: Laptop, label: STRINGS.DEVICES },
    { to: "/persones", icon: Users, label: STRINGS.PEOPLE },
    { to: "/assignacions", icon: Repeat, label: STRINGS.ASSIGNMENTS },
    { to: "/incidencies", icon: AlertTriangle, label: STRINGS.INCIDENTS },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 overflow-y-auto">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Database className="w-5 h-5" />
        </div>
        <h1 className="font-bold text-white text-lg tracking-tight">{STRINGS.APP_NAME}</h1>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <link.icon className="w-4.5 h-4.5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/configuracio"
          className={({ isActive }) =>
            `sidebar-link ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
          }
        >
          <Settings className="w-4.5 h-4.5" />
          {STRINGS.CONFIG}
        </NavLink>
      </div>
    </aside>
  );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { handles, data } = useApp();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return STRINGS.DASHBOARD;
      case '/dispositius': return STRINGS.DEVICES;
      case '/persones': return STRINGS.PEOPLE;
      case '/assignacions': return STRINGS.ASSIGNMENTS;
      case '/incidencies': return STRINGS.INCIDENTS;
      case '/configuracio': return STRINGS.CONFIG;
      default: return STRINGS.APP_NAME;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6 overflow-hidden">
            <h2 className="text-lg font-semibold truncate">{getPageTitle()}</h2>
            <div className="hidden lg:flex items-center gap-4 text-[10px] font-black uppercase tracking-wider">
              <span className={`flex items-center gap-1.5 ${handles.jsonData ? 'text-green-600' : 'text-red-500'}`}>
                <span className={`w-2 h-2 rounded-full ${handles.jsonData ? 'bg-green-500' : 'bg-red-500'}`}></span>
                JSON {handles.jsonData ? 'CONNECTAT' : 'PENDENT'}
              </span>
              <span className={`flex items-center gap-1.5 ${handles.excelAssignments && handles.excelStatuses ? 'text-green-600' : 'text-orange-500'}`}>
                <span className={`w-2 h-2 rounded-full ${handles.excelAssignments && handles.excelStatuses ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                EXCEL {handles.excelAssignments && handles.excelStatuses ? 'CONECTAT' : 'PENDENT'}
              </span>
            </div>
          </div>
          <div className="hidden sm:block text-[10px] text-slate-400 font-mono truncate">
            ACTUALITZAT: {new Date(data.metadata.updatedAt).toLocaleString('ca-ES')}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
};
