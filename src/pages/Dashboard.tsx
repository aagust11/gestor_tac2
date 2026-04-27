/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useApp } from '../store/appStore';
import { Laptop, Users, Repeat, AlertTriangle, Plus, ChevronRight, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { DeviceStatus, AssignmentStatus, IncidentStatus } from '../types';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { data, handles } = useApp();

  const metrics = [
    { label: "Total Dispositius", value: data.devices.length, sub: "Inventari global", color: "text-slate-900", bg: "bg-white" },
    { label: "Assignacions Actives", value: data.assignments.filter(a => a.estat === AssignmentStatus.ACTIVA).length, sub: `${data.devices.length > 0 ? Math.round((data.assignments.filter(a => a.estat === AssignmentStatus.ACTIVA).length / data.devices.length) * 100) : 0}% de l'inventari`, color: "text-blue-600", bg: "bg-white" },
    { label: "Incidències Obertes", value: data.incidents.filter(i => i.estat !== IncidentStatus.RESOLTA).length, sub: `${data.incidents.filter(i => i.estat === IncidentStatus.PENDENT_OBRIR).length} pendents d'obrir`, color: "text-red-500", bg: "bg-white" },
    { label: "Disponibles", value: data.devices.filter(d => d.estat === DeviceStatus.DISPONIBLE).length, sub: "A punt per entregar", color: "text-green-600", bg: "bg-white" },
  ];

  const recentIncidents = [...data.incidents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  return (
    <div className="space-y-8 h-full flex flex-col">
      {/* Warning Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
        <div className="bg-blue-100 p-2 rounded-full text-blue-600 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Privadesa de dades garantida</h4>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">Les dades no s'envien a cap servidor: es desen en un JSON local al teu ordinador i el navegador només en guarda l'enllaç per reobrir-lo.</p>
        </div>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`${metric.bg} p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between`}
          >
            <p className="text-slate-500 text-[10px] font-black uppercase mb-2 tracking-widest">{metric.label}</p>
            <p className={`text-4xl font-bold ${metric.color}`}>{metric.value.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">{metric.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Bottom Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
        {/* Recent Incidents */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
            <h3 className="font-bold text-slate-800 text-sm italic uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Incidències Recents
            </h3>
            <Link to="/incidencies" className="text-blue-600 text-[10px] font-black hover:underline tracking-widest">VEURE TOTES</Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="table-header">SACE</th>
                  <th className="table-header">REQ</th>
                  <th className="table-header">ESTAT</th>
                  <th className="table-header">DATA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentIncidents.map(incident => {
                  const dev = data.devices.find(d => d.id === incident.deviceId);
                  return (
                    <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-xs text-slate-700">{dev?.SACE || '-'}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-600">{incident.REQ}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${
                          incident.estat === IncidentStatus.RESOLTA ? 'bg-green-100 text-green-700' :
                          incident.estat === IncidentStatus.OBERTA ? 'bg-orange-100 text-orange-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {incident.estat}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[10px] font-bold text-slate-400">{new Date(incident.createdAt).toLocaleDateString('ca-ES')}</td>
                    </tr>
                  );
                })}
                {recentIncidents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-400 italic">No hi ha incidències recents.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Quick Actions & Status */}
        <div className="flex flex-col gap-6">
          <section className="bg-slate-800 rounded-xl p-6 text-white shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-sm mb-5 uppercase tracking-widest border-b border-slate-700 pb-2">Accions Ràpides</h3>
              <div className="space-y-3">
                <Link to="/assignacions" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center justify-between text-xs font-black transition-colors">
                  Nova Assignació
                  <Plus className="w-4 h-4" />
                </Link>
                <Link to="/incidencies" className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-between text-xs font-bold transition-colors">
                  Obrir Incidència
                  <AlertTriangle className="w-4 h-4" />
                </Link>
                <Link to="/dispositius" className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-between text-xs font-bold transition-colors">
                  Alta Dispositiu
                  <Laptop className="w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mb-3">Estat de la persistència</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">data.json</span>
                    <span className={handles.jsonData ? 'text-green-400 font-bold' : 'text-red-400'}>
                      {handles.jsonData ? 'OK' : 'FALTA'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Excels</span>
                    <span className={handles.excelAssignments && handles.excelStatuses ? 'text-green-400 font-bold' : 'text-orange-400'}>
                      {handles.excelAssignments && handles.excelStatuses ? 'OK' : 'VINCULAR'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Simple Info Widget */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-center items-center text-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-help">
             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
               <Info className="w-5 h-5" />
             </div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sistema de Gestió Inventari <br/> {new Date().getFullYear()} v1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
