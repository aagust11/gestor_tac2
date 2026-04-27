/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/appStore';
import { Layout } from './components/Layout';
import { AlertCircle } from 'lucide-react';

// Pages - We'll create these files next
import Dashboard from './pages/Dashboard';
import Dispositius from './pages/Dispositius';
import Persones from './pages/Persones';
import Assignacions from './pages/Assignacions';
import Incidencies from './pages/Incidencies';
import Configuracio from './pages/Configuracio';

import { STRINGS } from './utils/constants';
import { fileSystemService } from './services/fileSystemService';

const ConfigurationCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, isLoading, handles } = useApp();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Carregant dades...</p>
      </div>
    );
  }

  const isSupported = fileSystemService.isSupported();
  if (!isSupported) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8 clay-card bg-red-50 border-red-100">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-red-900 mb-2">Navegador no compatible</h1>
        <p className="text-red-700">{STRINGS.BROWSER_NOT_SUPPORTED}</p>
      </div>
    );
  }

  if (!isReady || !handles.jsonData) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center p-8 clay-card bg-amber-50 border-amber-100">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-amber-900 mb-2">Configuració pendent</h1>
        <p className="text-amber-700 mb-6">{STRINGS.NOT_CONFIGURED}</p>
        <Navigate to="/configuracio" replace />
      </div>
    );
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/configuracio" element={<Configuracio />} />
            <Route
              path="/"
              element={
                <ConfigurationCheck>
                  <Dashboard />
                </ConfigurationCheck>
              }
            />
            <Route
              path="/dispositius"
              element={
                <ConfigurationCheck>
                  <Dispositius />
                </ConfigurationCheck>
              }
            />
            <Route
              path="/persones"
              element={
                <ConfigurationCheck>
                  <Persones />
                </ConfigurationCheck>
              }
            />
            <Route
              path="/assignacions"
              element={
                <ConfigurationCheck>
                  <Assignacions />
                </ConfigurationCheck>
              }
            />
            <Route
              path="/incidencies"
              element={
                <ConfigurationCheck>
                  <Incidencies />
                </ConfigurationCheck>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}
