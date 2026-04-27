/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/appStore';
import { fileSystemService } from '../services/fileSystemService';
import { FileCode, FileSpreadsheet, CheckCircle2, AlertTriangle, Download, Upload, Info } from 'lucide-react';
import { STRINGS } from '../utils/constants';
import { motion } from 'motion/react';

const Configuracio: React.FC = () => {
  const { handles, setJsonHandle, setExcelAssignmentsHandle, setExcelStatusesHandle, checkPermissions, data } = useApp();
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleSelectJson = async () => {
    try {
      const handle = await fileSystemService.getFileHandle({
        types: [{ description: 'JSON Data', accept: { 'application/json': ['.json'] } }]
      });
      if (handle) {
        // Option to create new if empty? 
        // User says "Select or create": showSaveFilePicker can create
        await setJsonHandle(handle);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateJson = async () => {
    try {
      const handle = await fileSystemService.createNewFileHandle({
        suggestedName: 'data.json',
        types: [{ description: 'JSON Data', accept: { 'application/json': ['.json'] } }]
      });
      if (handle) {
        await setJsonHandle(handle);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectExcelAssignment = async () => {
    try {
      const handle = await fileSystemService.getFileHandle({
        types: [{ description: 'Excel File', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
      });
      if (handle) await setExcelAssignmentsHandle(handle);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectExcelStatus = async () => {
    try {
      const handle = await fileSystemService.getFileHandle({
        types: [{ description: 'Excel File', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }]
      });
      if (handle) await setExcelStatusesHandle(handle);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTest = async () => {
    const ok = await checkPermissions();
    if (ok) {
      setTestResult({ success: true, msg: "Conexió correctament verificada." });
    } else {
      setTestResult({ success: false, msg: "Falten permisos o fitxers. Revisa la configuració." });
    }
  };

  const handleExport = () => {
    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-3xl mx-auto"
    >
      <header className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{STRINGS.CONFIG}</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestiona el vincle amb els teus fitxers locals.</p>
        </div>
      </header>

      <section className="clay-card p-6 bg-blue-50 border-blue-100 flex gap-4">
        <Info className="w-6 h-6 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800 space-y-2">
          <p className="font-semibold">Informació sobre la privadesa</p>
          <p>Les dades no s’envien a cap servidor. El fitxer JSON es guarda al teu ordinador i el navegador només conserva el permís per tornar-lo a obrir. Els fitxers Excel també es modifiquen localment, sempre que els hagis seleccionat i hagis donat permisos d’escriptura.</p>
        </div>
      </section>

      <div className="grid gap-6">
        {/* JSON DATA */}
        <div className="clay-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${handles.jsonData ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <FileCode className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Dades de l'aplicació (JSON)</h3>
                <p className="text-xs text-slate-500">{handles.jsonData ? handles.jsonData.name : 'No seleccionat'}</p>
              </div>
            </div>
            {handles.jsonData && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          </div>
          <div className="flex gap-3">
            <button onClick={handleSelectJson} className="btn-secondary">Seleccionar fitxer</button>
            <button onClick={handleCreateJson} className="btn-secondary">Crear nou fitxer</button>
          </div>
        </div>

        {/* EXCELS */}
        <div className="clay-card p-6 space-y-6">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Fitxers Excel de Registre
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-sm font-bold block text-slate-800">indic_assignacions.xlsx</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{handles.excelAssignments ? handles.excelAssignments.name : 'Obligatori per a noves assignacions'}</span>
              </div>
              <button 
                onClick={handleSelectExcelAssignment} 
                className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${handles.excelAssignments ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'}`}
              >
                {handles.excelAssignments ? 'Canviar' : 'Vincular'}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div>
                <span className="text-sm font-bold block text-slate-800">indic_estats.xlsx</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{handles.excelStatuses ? handles.excelStatuses.name : 'Obligatori per a canvis d\'estat'}</span>
              </div>
              <button 
                onClick={handleSelectExcelStatus} 
                className={`text-[10px] px-3 py-1.5 rounded-lg font-black uppercase transition-all ${handles.excelStatuses ? 'bg-green-100 text-green-700' : 'bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700'}`}
              >
                {handles.excelStatuses ? 'Canviar' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button onClick={handleTest} className="btn-primary w-full sm:w-auto">Verificar permisos i conexió</button>
        <button onClick={handleExport} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2">
          <Download className="w-4 h-4" />
          Exportar Còpia JSON
        </button>
      </div>

      {testResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${testResult.success ? 'bg-green-50 text-green-800 border border-green-100' : 'bg-red-50 text-red-800 border border-red-100'}`}
        >
          {testResult.success ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
          <span className="text-sm font-medium">{testResult.msg}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Configuracio;
