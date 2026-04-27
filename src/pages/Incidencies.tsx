/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../store/appStore';
import { Plus, Search, AlertTriangle, Edit2, CheckCircle, Clock, User, Filter, X, Laptop, Trash2, LayoutTemplate, Save } from 'lucide-react';
import { Device, Incident, IncidentStatus, AssignmentStatus, IncidentTemplate } from '../types';
import { INCIDENT_STATUSES } from '../utils/constants';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

const Incidencies: React.FC = () => {
  const { data, addIncident, updateIncident, deleteIncident, addTemplate, updateTemplate, deleteTemplate } = useApp();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('Pendent/Oberta');
  const [searchIncident, setSearchIncident] = useState('');
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  // Template Form state
  const [editingTemplate, setEditingTemplate] = useState<IncidentTemplate | null>(null);
  const [templateFormData, setTemplateFormData] = useState({ titol: '', contingut: '' });

  // Form step
  const [deviceQuery, setDeviceQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  
  // React to incoming state from Dispositius shortcut
  React.useEffect(() => {
    if (location.state?.deviceSace) {
      const dev = data.devices.find(d => d.SACE === location.state.deviceSace);
      if (dev) {
        setSelectedDevice(dev);
        setIsModalOpen(true);
      }
    }
  }, [location.state, data.devices]);
  const [formData, setFormData] = useState({
    REQ: '',
    explicacio: '',
    comentaris: '',
    estat: IncidentStatus.PENDENT_OBRIR
  });

  const deviceResults = useMemo(() => {
    if (deviceQuery.length < 2) return [];
    const term = deviceQuery.toLowerCase().trim();
    const term8 = term.substring(0, 8);
    const termS8 = 's' + term8;
    
    // Find devices by SACE, SN (handling long codes)
    const directResults = data.devices.filter(d => {
      const snLower = (d.SN || '').toLowerCase();
      const saceMatch = (d.SACE || '').toLowerCase().includes(term);
      
      const snExactMatch = snLower.includes(term);
      const sn8Match = term.length >= 8 && snLower === term8;
      const snS8Match = term.length >= 8 && snLower === termS8;
      
      return saceMatch || snExactMatch || sn8Match || snS8Match;
    });
    
    // Find devices by currently assigned person
    const peopleIds = data.people.filter(p => (p.nom || '').toLowerCase().includes(term)).map(p => p.id);
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
      let matchStatus = true;
      if (filterStatus === 'Pendent/Oberta') {
        matchStatus = i.estat !== IncidentStatus.RESOLTA;
      } else if (filterStatus !== 'Totes') {
        matchStatus = i.estat === filterStatus;
      }
      
      const dev = data.devices.find(d => d.id === i.deviceId);
      const termLow = searchIncident.toLowerCase();
      const matchText = (i.REQ || '').toLowerCase().includes(termLow) ||
                        (dev?.SACE || '').toLowerCase().includes(termLow) ||
                        (i.explicacio || '').toLowerCase().includes(termLow) ||
                        (i.comentaris || '').toLowerCase().includes(termLow);
      return matchStatus && matchText;
    }).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [data.incidents, data.devices, filterStatus, searchIncident]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    try {
      if (editingIncident) {
        await updateIncident(editingIncident.id, formData);
      } else {
        await addIncident({
          ...formData,
          deviceId: selectedDevice.id
        });
      }
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (incident: Incident) => {
    const dev = data.devices.find(d => d.id === incident.deviceId);
    setSelectedDevice(dev || null);
    setEditingIncident(incident);
    setFormData({
      REQ: incident.REQ || '',
      explicacio: incident.explicacio,
      comentaris: incident.comentaris || '',
      estat: incident.estat
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setSelectedDevice(null);
    setEditingIncident(null);
    setDeviceQuery('');
    setFormData({ REQ: '', explicacio: '', comentaris: '', estat: IncidentStatus.PENDENT_OBRIR });
  };

  const handleApplyTemplate = (template: IncidentTemplate) => {
    if (!selectedDevice) return;
    
    let content = template.contingut;
    content = content.replace(/{SACE}/g, selectedDevice.SACE || '');
    content = content.replace(/{SN}/g, selectedDevice.SN || '');
    
    setFormData(prev => ({ ...prev, explicacio: content }));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, templateFormData);
      } else {
        await addTemplate(templateFormData);
      }
      setEditingTemplate(null);
      setTemplateFormData({ titol: '', contingut: '' });
    } catch (err: any) {
      alert(err.message);
    }
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
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => { setIsTemplateModalOpen(true); }} className="btn-secondary !bg-white">
            <LayoutTemplate className="w-4 h-4" />
            Gestionar Plantilles
          </button>
          <button onClick={() => { setIsModalOpen(true); resetForm(); }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Incidència
          </button>
        </div>
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
            <option value="Pendent/Oberta">Pendents / Obertes</option>
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
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REQ: {incident.REQ || 'Pendent'}</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(incident)} title="Editar" className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm('Estàs segur que vols eliminar aquesta incidència?')) {
                            deleteIncident(incident.id);
                          }
                        }}
                        title="Eliminar" 
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className={`badge ${
                        incident.estat === IncidentStatus.RESOLTA ? 'bg-green-100 text-green-700' :
                        incident.estat === IncidentStatus.OBERTA ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {incident.estat}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 leading-tight line-clamp-3 text-sm">{incident.explicacio}</h3>
                  {incident.comentaris && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100/50">{incident.comentaris}</p>
                  )}
                  
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

      {/* Templates Management Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-2xl p-6 space-y-6 my-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <LayoutTemplate className="w-5 h-5 text-blue-600" />
                Gestionar Plantilles de Text
              </h2>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <form onSubmit={handleSaveTemplate} className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{editingTemplate ? 'Editar Plantilla' : 'Nova Plantilla'}</h3>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Títol de la plantilla</label>
                   <input 
                    required 
                    type="text" 
                    className="input-field" 
                    placeholder="Ex: Pantalla trencada"
                    value={templateFormData.titol}
                    onChange={e => setTemplateFormData({...templateFormData, titol: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contingut</label>
                   <textarea 
                    required 
                    className="input-field min-h-[120px] text-xs leading-relaxed" 
                    placeholder="Escriu el text. Usa {SACE} i {SN} per dades de l'equip."
                    value={templateFormData.contingut}
                    onChange={e => setTemplateFormData({...templateFormData, contingut: e.target.value})}
                   />
                   <p className="text-[10px] text-slate-400 mt-2 italic">Variables: {'{SACE}'}, {'{SN}'}</p>
                </div>
                <div className="flex gap-2">
                  {editingTemplate && (
                    <button type="button" onClick={() => { setEditingTemplate(null); setTemplateFormData({ titol: '', contingut: '' }); }} className="btn-secondary flex-grow">Cancel·lar</button>
                  )}
                  <button type="submit" className="btn-primary flex-grow">
                    <Save className="w-4 h-4" />
                    {editingTemplate ? 'Guardar' : 'Crear'}
                  </button>
                </div>
              </form>

              {/* List */}
              <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Plantilles existents</h3>
                <div className="space-y-2">
                  {data.incidentTemplates.map(t => (
                    <div key={t.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start group">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{t.titol}</p>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{t.contingut}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setEditingTemplate(t); setTemplateFormData({ titol: t.titol, contingut: t.contingut }); }} className="p-1.5 hover:bg-white rounded shadow-xs text-blue-600">
                           <Edit2 className="w-3 h-3" />
                         </button>
                         <button onClick={() => deleteTemplate(t.id)} className="p-1.5 hover:bg-white rounded shadow-xs text-red-600">
                           <Trash2 className="w-3 h-3" />
                         </button>
                      </div>
                    </div>
                  ))}
                  {data.incidentTemplates.length === 0 && (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                      <LayoutTemplate className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                      <p className="text-[10px] text-slate-400 font-medium">Encara no hi ha plantilles.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6 my-auto">
            <h2 className="text-xl font-bold">{editingIncident ? 'Editar Incidència' : 'Obrir Nova Incidència'}</h2>
            
            <div className="space-y-4">
               {/* Device Selection */}
               <div>
                  <label className="block text-sm font-medium mb-1">Dispositiu (SACE, SN o Persona)</label>
                  {!selectedDevice || editingIncident ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input 
                        type="text" 
                        placeholder={selectedDevice ? `${selectedDevice.SACE} - ${selectedDevice.tipusDispositiu}` : "Busca per SACE, SN o usuari..."}
                        className="input-field pl-10"
                        value={deviceQuery}
                        onChange={e => setDeviceQuery(e.target.value)}
                        disabled={!!editingIncident}
                      />
                      <AnimatePresence>
                        {deviceResults.length > 0 && !editingIncident && (
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
                       {!editingIncident && <button onClick={() => setSelectedDevice(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
                    </div>
                  )}
               </div>
 
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Codi REQ (Opcional)</label>
                    <input type="text" className="input-field" placeholder="Codi REQ oficial..." value={formData.REQ} onChange={e => setFormData({...formData, REQ: e.target.value})} />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <label className="block text-sm font-medium">Explicació del problema</label>
                      {data.incidentTemplates.length > 0 && selectedDevice && (
                        <select 
                          className="text-[10px] border border-blue-100 bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold outline-hidden cursor-pointer"
                          onChange={(e) => {
                            const t = data.incidentTemplates.find(tem => tem.id === e.target.value);
                            if (t) handleApplyTemplate(t);
                            e.target.value = '';
                          }}
                          defaultValue=""
                        >
                          <option value="" disabled>Aplicar plantilla...</option>
                          {data.incidentTemplates.map(t => (
                            <option key={t.id} value={t.id}>{t.titol}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <textarea required className="input-field min-h-[80px] py-2 text-sm" placeholder="Detalla què li passa al dispositiu..." value={formData.explicacio} onChange={e => setFormData({...formData, explicacio: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Comentaris internals (Opcional)</label>
                    <textarea className="input-field min-h-[60px] py-2 text-sm italic" placeholder="Anotacions sobre la reparació..." value={formData.comentaris} onChange={e => setFormData({...formData, comentaris: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Estat</label>
                    <select className="input-field" value={formData.estat} onChange={e => setFormData({...formData, estat: e.target.value as IncidentStatus})}>
                      {INCIDENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  
                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                    <button type="submit" disabled={!selectedDevice} className="btn-primary flex-grow disabled:opacity-50">{editingIncident ? 'Guardar Canvis' : 'Obrir Incidència'}</button>
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
