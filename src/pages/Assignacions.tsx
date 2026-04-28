/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../store/appStore';
import { Search, User, Laptop, ArrowRight, CheckCircle, Info, X, Repeat, Trash2, UserPlus, PlusCircle } from 'lucide-react';
import { Person, Device, AssignmentStatus, DeviceStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

const Assignacions: React.FC = () => {
  const { data, createAssignment, endAssignment, deleteAssignment, addPerson, addDevice } = useApp();
  const navigate = useNavigate();
  
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const [deviceQuery, setDeviceQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [returnIds, setReturnIds] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  // Quick Add Modals
  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [newPersonData, setNewPersonData] = useState({ nom: '', identificador: '', correuElectronic: '' });
  
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({ SACE: '', SN: '', tipusDispositiu: 'ORDINADOR_ALUMNE' as any, estat: 'DISPONIBLE' as any });

  const safeLower = (value: unknown) => String(value ?? '').toLowerCase();

  const handleQuickAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPerson(newPersonData);
      const created = data.people.find(p => p.identificador === newPersonData.identificador);
      if (created) setSelectedPerson(created);
      setIsPersonModalOpen(false);
      setNewPersonData({ nom: '', identificador: '', correuElectronic: '' });
      setPersonQuery('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleQuickAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDevice(newDeviceData);
      const created = data.devices.find(d => d.SACE === newDeviceData.SACE);
      if (created) setSelectedDevice(created);
      setIsDeviceModalOpen(false);
      setNewDeviceData({ SACE: '', SN: '', tipusDispositiu: 'ORDINADOR_ALUMNE' as any, estat: 'DISPONIBLE' as any });
      setDeviceQuery('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Search Results
  const personResults = useMemo(() => {
    if (personQuery.length <= 1) return [];
    const term = safeLower(personQuery);
    return data.people
      .filter(p => safeLower(p.nom).includes(term) || safeLower(p.identificador).includes(term))
      .slice(0, 5);
  }, [data.people, personQuery]);

  const deviceResults = useMemo(() => {
    if (deviceQuery.length < 2) return [];
    const term = safeLower(deviceQuery).trim();
    const term8 = term.substring(0, 8);
    const termS8 = 's' + term8;

    return data.devices.filter(d => {
      const snLower = safeLower(d.SN);
      const saceMatch = safeLower(d.SACE).includes(term);
      
      const snExactMatch = snLower.includes(term);
      const sn8Match = term.length >= 8 && snLower === term8;
      const snS8Match = term.length >= 8 && snLower === termS8;
      
      return saceMatch || snExactMatch || sn8Match || snS8Match;
    }).slice(0, 10);
  }, [data.devices, deviceQuery]);

  const activeAssignments = selectedPerson 
    ? data.assignments.filter(a => a.personId === selectedPerson.id && a.estat === AssignmentStatus.ACTIVA)
    : [];

  const handleCreate = async () => {
    if (!selectedPerson || !selectedDevice) return;
    try {
      const finalReturnIds = [...returnIds];
      // Automatically return the device itself if it was already assigned
      if (selectedDevice.estat === DeviceStatus.ENTREGAT) {
        const currentAss = data.assignments.find(a => a.deviceId === selectedDevice.id && a.estat === AssignmentStatus.ACTIVA);
        if (currentAss && !finalReturnIds.includes(currentAss.id)) {
          finalReturnIds.push(currentAss.id);
        }
      }
      
      await createAssignment(selectedPerson.id, selectedDevice.id, finalReturnIds);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        reset();
      }, 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const reset = () => {
    setSelectedPerson(null);
    setSelectedDevice(null);
    setPersonQuery('');
    setDeviceQuery('');
    setReturnIds([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nova Assignació</h1>
        <p className="text-slate-500 mt-1 font-medium">Registra l'entrega d'un dispositiu a un usuari.</p>
      </header>

      <div className="space-y-6">
        {/* Combined Selection Card */}
        <section className={`clay-card p-6 space-y-6 border-2 transition-all ${selectedPerson && selectedDevice ? 'border-green-100 bg-green-50/20' : 'border-blue-100 bg-white'}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Selecció de l'Entrega
            </h2>
            {(selectedPerson || selectedDevice) && (
              <button onClick={reset} className="text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 uppercase tracking-wider">
                <X className="w-3 h-3" />
                Netejar selecció
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persona Selector */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuari receptor</label>
              {!selectedPerson ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="Nom o identificador..." 
                    className="input-field pl-10 h-10"
                    value={personQuery}
                    onChange={e => setPersonQuery(e.target.value)}
                  />
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{selectedPerson.nom}</p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-wider">{selectedPerson.identificador}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Device Selector */}
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Dispositiu a lliurar</label>
              {!selectedDevice ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text" 
                    placeholder="SACE o SN..." 
                    className="input-field pl-10 h-10"
                    value={deviceQuery}
                    onChange={e => setDeviceQuery(e.target.value)}
                  />
                </div>
              ) : (
                <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{selectedDevice.tipusDispositiu}</p>
                      <p className="text-[10px] text-slate-400 font-mono">SACE: {selectedDevice.SACE}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {selectedPerson && selectedDevice && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-4 border-t border-slate-100 flex flex-col items-center gap-4">
                <div className={`p-3 rounded-xl flex gap-3 w-full max-w-lg ${selectedDevice.estat === DeviceStatus.ENTREGAT ? 'bg-amber-50' : 'bg-blue-50'}`}>
                  <div className={`p-1 rounded-full flex-shrink-0 mt-0.5 ${selectedDevice.estat === DeviceStatus.ENTREGAT ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                    <Info className="w-3 h-3" />
                  </div>
                  {selectedDevice.estat === DeviceStatus.ENTREGAT ? (
                    <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                      L'equip està actualment assignat a una altra persona. <strong>Es registrarà el retorn automàticament</strong> abans de l'entrega a {selectedPerson.nom}.
                    </p>
                  ) : (
                    <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                      Es crearà una assignació activa per a <strong>{selectedPerson.nom}</strong> amb el dispositiu <strong>{selectedDevice.SACE}</strong> ({selectedDevice.tipusDispositiu}). L'estat passarà a "Entregat".
                    </p>
                  )}
                </div>

                {activeAssignments.length > 0 && (
                  <div className="w-full max-w-lg space-y-2">
                    <h3 className="text-[10px] font-black text-amber-800 uppercase tracking-widest px-1">Equips ja assignats (Retornat?)</h3>
                    {activeAssignments.map(a => {
                      const dev = data.devices.find(d => d.id === a.deviceId);
                      const isMarked = returnIds.includes(a.id);
                      return (
                        <div key={a.id} className="bg-white p-2 border border-slate-100 rounded-lg flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700">{dev?.tipusDispositiu} ({dev?.SACE})</span>
                          </div>
                          <button 
                            onClick={() => setReturnIds(prev => prev.includes(a.id) ? prev.filter(id => id !== a.id) : [...prev, a.id])}
                            className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-tighter transition-all ${isMarked ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                          >
                            {isMarked ? 'Es retornarà' : 'Marcar Retorn'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                <button 
                  onClick={handleCreate}
                  className={`btn-primary px-8 py-3 w-full sm:w-auto flex items-center gap-3 justify-center shadow-xl ${selectedDevice.estat === DeviceStatus.ENTREGAT ? 'shadow-amber-500/20 !bg-amber-600 hover:!bg-amber-700' : 'shadow-blue-500/20'}`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {selectedDevice.estat === DeviceStatus.ENTREGAT ? 'Confirmar Re-assignació' : 'Confirmar Entrega'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Results Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Person Results Table */}
          <div className="space-y-3">
            {personQuery.length > 1 && !selectedPerson && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="clay-card p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultats Persones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personResults.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                        <td className="px-4 py-3">
                          <button 
                            onClick={() => { setSelectedPerson(p); setPersonQuery(''); }}
                            className="w-full text-left flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <User className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-xs text-slate-800">{p.nom}</p>
                                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{p.identificador}</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {personResults.length === 0 && (
                      <tr className="border-0">
                        <td className="px-4 py-8 text-center bg-white">
                           <UserPlus className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                           <p className="text-xs text-slate-400 mb-4 tracking-tight font-medium">No s'han trobat resultats</p>
                           <button 
                            onClick={() => { setNewPersonData(prev => ({ ...prev, nom: personQuery })); setIsPersonModalOpen(true); }}
                            className="btn-secondary py-1.5 px-4 text-[10px] border-slate-200"
                           >
                            Crear Persona
                           </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>

          {/* Device Results Table */}
          <div className="space-y-3">
            {deviceQuery.length > 1 && !selectedDevice && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="clay-card p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultats Dispositius Lliures</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceResults.map(d => {
                      const isDelivered = d.estat === DeviceStatus.ENTREGAT;
                      const currentAssignment = isDelivered ? data.assignments.find(a => a.deviceId === d.id && a.estat === AssignmentStatus.ACTIVA) : null;
                      const currentPerson = currentAssignment ? data.people.find(p => p.id === currentAssignment.personId) : null;
                      
                      return (
                        <tr key={d.id} className={`transition-colors border-b border-slate-50 last:border-0 ${isDelivered ? 'bg-amber-50/30 hover:bg-amber-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-4 py-3">
                            <button 
                              onClick={() => { setSelectedDevice(d); setDeviceQuery(''); }}
                              className="w-full text-left flex items-center justify-between group"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDelivered ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                  <Laptop className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-bold text-xs text-slate-800">{d.tipusDispositiu}</p>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${isDelivered ? 'bg-amber-200 text-amber-800' : 'bg-green-100 text-green-700'}`}>
                                      {d.estat}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono tracking-wider">
                                    SACE: {d.SACE} | SN: {d.SN}
                                    {isDelivered && currentPerson && (
                                      <span className="text-amber-700 font-bold ml-2">
                                        (Actualment: {currentPerson.nom})
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {deviceResults.length === 0 && (
                      <tr className="border-0">
                        <td className="px-4 py-8 text-center bg-white">
                           <PlusCircle className="w-8 h-8 mx-auto text-slate-200 mb-2" />
                           <p className="text-xs text-slate-400 mb-4 tracking-tight font-medium">No s'han trobat equips lliures</p>
                           <button 
                            onClick={() => { setNewDeviceData(prev => ({ ...prev, SACE: deviceQuery })); setIsDeviceModalOpen(true); }}
                            className="btn-secondary py-1.5 px-4 text-[10px] border-slate-200"
                           >
                            Crear Dispositiu
                           </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <section className="clay-card p-6">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Historial Recent</h2>
        <div className="space-y-4">
          {data.assignments.slice(-5).reverse().map(a => {
            const p = data.people.find(pers => pers.id === a.personId);
            const d = data.devices.find(dev => dev.id === a.deviceId);
            return (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${a.estat === AssignmentStatus.ACTIVA ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                     <Repeat className="w-4 h-4" />
                   </div>
                   <div>
                     <span className="text-sm font-bold text-slate-900">{p?.nom}</span>
                     <span className="text-[10px] text-slate-400 block tracking-wider font-mono">{d?.tipusDispositiu} ({d?.SACE})</span>
                   </div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${a.estat === AssignmentStatus.ACTIVA ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                      {a.estat}
                    </span>
                    <div className="flex items-center gap-1">
                      {a.estat === AssignmentStatus.ACTIVA && (
                        <button 
                          onClick={() => endAssignment(a.id)}
                          className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                          title="Marcar com a retornat"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if (confirm('Estàs segur que vols eliminar aquesta assignació?')) {
                            deleteAssignment(a.id);
                          }
                        }}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-600 transition-colors"
                        title="Eliminar assignació"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(a.startedAt).toLocaleDateString('ca-ES')}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Quick Add Person Modal */}
      {isPersonModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Afegir Nova Persona</h2>
            <form onSubmit={handleQuickAddPerson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom Complet</label>
                <input 
                  required 
                  type="text" 
                  className="input-field" 
                  value={newPersonData.nom}
                  onChange={e => setNewPersonData({ ...newPersonData, nom: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Identificador</label>
                <input 
                  required 
                  type="text" 
                  className="input-field" 
                  value={newPersonData.identificador}
                  onChange={e => setNewPersonData({ ...newPersonData, identificador: e.target.value })}
                />
              </div>
              <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correu (Opcional)</label>
                 <input 
                  type="text" 
                  className="input-field" 
                  placeholder="usuari@insmollet.cat"
                  value={newPersonData.correuElectronic}
                  onChange={e => setNewPersonData({ ...newPersonData, correuElectronic: e.target.value })}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPersonModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                <button type="submit" className="btn-primary flex-grow">Guardar i Seleccionar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Quick Add Device Modal */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold">Afegir Nou Dispositiu</h2>
            <form onSubmit={handleQuickAddDevice} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SACE</label>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    value={newDeviceData.SACE}
                    onChange={e => setNewDeviceData({ ...newDeviceData, SACE: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">SN</label>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    value={newDeviceData.SN}
                    onChange={e => setNewDeviceData({ ...newDeviceData, SN: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipus</label>
                <select 
                  className="input-field"
                  value={newDeviceData.tipusDispositiu}
                  onChange={e => setNewDeviceData({ ...newDeviceData, tipusDispositiu: e.target.value as any })}
                >
                  <option value="ORDINADOR_ALUMNE">Ordinador Alumne</option>
                  <option value="ORDINADOR_DOCENT">Ordinador Docent</option>
                  <option value="TABLET">Tablet</option>
                  <option value="ALTRE">Altre</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsDeviceModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                <button type="submit" className="btn-primary flex-grow">Guardar i Seleccionar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Assignacions;
