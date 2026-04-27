/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../store/appStore';
import { Plus, Search, AlertTriangle, Edit2, CheckCircle, Clock, User, Filter, X, Laptop } from 'lucide-react';
import { Device, Incident, IncidentStatus, AssignmentStatus } from '../types';
import { INCIDENT_STATUSES } from '../utils/constants';
import { motion, AnimatePresence } from 'motion/react';

const Incidencies: React.FC = () => {
  const { data, addIncident, updateIncident } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Totes');
  const [searchIncident, setSearchIncident] = useState('');

  // Form step
  const [deviceQuery, setDeviceQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState({
    REQ: '',
    explicacio: '',
    estat: IncidentStatus.PENDENT_OBRIR
  });

  const deviceResults = useMemo(() => {
    if (deviceQuery.length < 2) return [];
    const term = deviceQuery.toLowerCase();
    
    // Find devices by SACE, SN
    const directResults = data.devices.filter(d => 
      d.SACE.toLowerCase().includes(term) || d.SN.toLowerCase().includes(term)
    );
    
    // Find devices by currently assigned person
    const peopleIds = data.people.filter(p => p.nom.toLowerCase().includes(term)).map(p => p.id);
    const assignedByPeople = data.assignments
      .filter(a => a.estat === AssignmentStatus.ACTIVA && peopleIds.includes(a.personId))
      .map(a => data.devices.find(d => d.id === a.deviceId))
      .filter(Boolean) as Device[];

    // Combine and unique
    const combined = [...directResults, ...assignedByPeople];
    return Array.from(new Set(combined.map(d => d.id))).map(id => combined.find(c => c.id === id)!);
  }, [data.devices, data.people, data.assignments, deviceQuery]);

  const filteredIncidents = useMemo(() => {
    return data.incidents.filter(i => {
      const matchStatus = filterStatus === 'Totes' || i.estat === filterStatus;
      const dev = data.devices.find(d => d.id === i.deviceId);
      const matchText = i.REQ.toLowerCase().includes(searchIncident.toLowerCase()) ||
                        dev?.SACE.toLowerCase().includes(searchIncident.toLowerCase()) ||
                        i.explicacio.toLowerCase().includes(searchIncident.toLowerCase());
      return matchStatus && matchText;
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.incidents, data.devices, filterStatus, searchIncident]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      await addIncident({
        ...formData,
        deviceId: selectedDevice.id
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setSelectedDevice(null);
    setDeviceQuery('');
    setFormData({ REQ: '', explicacio: '', estat: IncidentStatus.PENDENT_OBRIR });
  };

  const handleStatusChange = async (incident: Incident, newStatus: IncidentStatus) => {
    try {
      await updateIncident(incident.id, { estat: newStatus });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Incidències</h1>
          <p className="text-slate-500 mt-1 font-medium">Registre i seguiment de reparacions i avaries.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nova Incidència
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cerca per REQ, SACE o explicació..." 
            className="input-field pl-10"
            value={searchIncident}
            onChange={(e) => setSearchIncident(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select 
            className="input-field py-1 text-sm bg-white"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="Totes">Tots els estats</option>
            {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredIncidents.map(incident => {
           const dev = data.devices.find(d => d.id === incident.deviceId);
           const assignment = data.assignments.find(a => a.deviceId === incident.deviceId && a.estat === AssignmentStatus.ACTIVA);
           const person = assignment ? data.people.find(p => p.id === assignment.personId) : null;

           return (
             <motion.div layout key={incident.id} className="clay-card p-5 flex flex-col justify-between border-t-4 border-t-blue-600 group">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REQ: {incident.REQ}</span>
                    <span className={`badge ${
                      incident.estat === IncidentStatus.RESOLTA ? 'bg-green-100 text-green-700' :
                      incident.estat === IncidentStatus.OBERTA ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {incident.estat}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 leading-tight line-clamp-3 text-sm">{incident.explicacio}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <div className="p-1 bg-slate-50 rounded text-slate-400">
                        <Laptop className="w-3 h-3" />
                      </div>
                      <span>{dev?.tipusDispositiu} <span className="text-slate-300 font-mono">/</span> {dev?.SACE}</span>
                    </div>
                    {person && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <div className="p-1 bg-slate-50 rounded text-slate-400">
                          <User className="w-3 h-3" />
                        </div>
                        <span>{person.nom}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
                     <Clock className="w-3 h-3" />
                     {new Date(incident.createdAt).toLocaleDateString('ca-ES')}
                   </div>
                   <div className="flex gap-2">
                      <select 
                        className="text-[10px] border border-slate-200 rounded px-2 py-1 bg-slate-50 font-bold text-slate-600 focus:ring-1 focus:ring-blue-500 outline-hidden cursor-pointer"
                        value={incident.estat}
                        onChange={(e) => handleStatusChange(incident, e.target.value as IncidentStatus)}
                      >
                         {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>
             </motion.div>
           );
         })}
      </div>
      {filteredIncidents.length === 0 && (
          <div className="p-12 text-center text-gray-500 clay-card">No s'han trobat incidències.</div>
      )}

      {/* New Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 my-auto">
            <h2 className="text-xl font-bold">Obrir Nova Incidència</h2>
            
            <div className="space-y-4">
               {/* Device Selection */}
               <div>
                  <label className="block text-sm font-medium mb-1">Dispositiu (SACE, SN o Persona)</label>
                  {!selectedDevice ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder="Busca per SACE, SN o usuari..." 
                        className="input-field pl-10"
                        value={deviceQuery}
                        onChange={e => setDeviceQuery(e.target.value)}
                      />
                      <AnimatePresence>
                        {deviceResults.length > 0 && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                            {deviceResults.map(d => (
                              <button 
                                key={d.id} 
                                onClick={() => { setSelectedDevice(d); setDeviceQuery(''); }}
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 flex items-center gap-3"
                              >
                                <Laptop className="w-5 h-5 text-brand-primary" />
                                <div>
                                  <span className="block font-bold text-sm text-gray-900">{d.tipusDispositiu} (SACE {d.SACE})</span>
                                  <span className="text-xs text-gray-500">SN: {d.SN}</span>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="p-3 bg-brand-primary/5 rounded-xl border border-brand-primary/20 flex justify-between items-center">
                       <div className="flex items-center gap-3">
                         <Laptop className="w-6 h-6 text-brand-primary" />
                         <span className="text-sm font-bold">{selectedDevice.tipusDispositiu} (SACE {selectedDevice.SACE})</span>
                       </div>
                       <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  )}
               </div>

               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Codi REQ</label>
                    <input required type="text" className="input-field" placeholder="Pesta el codi REQ oficial..." value={formData.REQ} onChange={e => setFormData({...formData, REQ: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Explicació del problema</label>
                    <textarea required className="input-field min-h-[100px] py-2" placeholder="Detalla què li passa al dispositiu..." value={formData.explicacio} onChange={e => setFormData({...formData, explicacio: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estat inicial</label>
                    <select className="input-field" value={formData.estat} onChange={e => setFormData({...formData, estat: e.target.value as IncidentStatus})}>
                      {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                    <button type="submit" disabled={!selectedDevice} className="btn-primary flex-grow disabled:opacity-50">Obrir Incidència</button>
                  </div>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Incidencies;
