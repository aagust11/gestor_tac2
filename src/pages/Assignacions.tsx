/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../store/appStore';
import { Search, User, Laptop, ArrowRight, CheckCircle, Info, X, Repeat } from 'lucide-react';
import { Person, Device, AssignmentStatus, DeviceStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Assignacions: React.FC = () => {
  const { data, createAssignment } = useApp();
  
  const [personQuery, setPersonQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  
  const [deviceQuery, setDeviceQuery] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  const [returnIds, setReturnIds] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  // Search Results
  const personResults = personQuery.length > 1 
    ? data.people.filter(p => 
        p.nom.toLowerCase().includes(personQuery.toLowerCase()) || 
        p.identificador.toLowerCase().includes(personQuery.toLowerCase())
      ).slice(0, 5) 
    : [];

  const deviceResults = deviceQuery.length > 1 
    ? data.devices.filter(d => 
        (d.SACE.toLowerCase().includes(deviceQuery.toLowerCase()) || 
         d.SN.toLowerCase().includes(deviceQuery.toLowerCase())) &&
        d.estat !== DeviceStatus.ENTREGAT // Only show what is not already delivered
      ).slice(0, 5) 
    : [];

  const activeAssignments = selectedPerson 
    ? data.assignments.filter(a => a.personId === selectedPerson.id && a.estat === AssignmentStatus.ACTIVA)
    : [];

  const handleCreate = async () => {
    if (!selectedPerson || !selectedDevice) return;
    try {
      await createAssignment(selectedPerson.id, selectedDevice.id, returnIds);
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Step 1: Persona */}
        <section className={`clay-card p-6 space-y-4 border-2 transition-all ${selectedPerson ? 'border-blue-100 bg-blue-50/20' : 'border-transparent'}`}>
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
            Selecciona la Persona
          </h2>
          
          {!selectedPerson ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Busca per nom o identificador..." 
                className="input-field pl-10"
                value={personQuery}
                onChange={e => setPersonQuery(e.target.value)}
              />
              <AnimatePresence>
                {personResults.length > 0 && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10">
                    {personResults.map(p => (
                      <button 
                        key={p.id} 
                        onClick={() => { setSelectedPerson(p); setPersonQuery(''); }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-slate-900">{p.nom}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{p.identificador}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                   <p className="font-bold text-slate-900">{selectedPerson.nom}</p>
                   <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{selectedPerson.identificador}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPerson(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Active assignments summary */}
          {selectedPerson && activeAssignments.length > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-wide">Equips actualment assignats:</p>
              <div className="space-y-2">
                {activeAssignments.map(a => {
                  const dev = data.devices.find(d => d.id === a.deviceId);
                  const isMarked = returnIds.includes(a.id);
                  return (
                    <div key={a.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Laptop className="w-4 h-4 text-amber-600 outline-hidden" />
                        <span className="text-sm text-gray-700 font-medium">{dev?.tipusDispositiu} ({dev?.SACE})</span>
                      </div>
                      <button 
                        onClick={() => {
                          if (isMarked) setReturnIds(returnIds.filter(id => id !== a.id));
                          else setReturnIds([...returnIds, a.id]);
                        }}
                        className={`text-[10px] px-2 py-1 rounded font-bold uppercase transition-colors ${isMarked ? 'bg-red-500 text-white' : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                      >
                        {isMarked ? 'Retornant' : 'Retornar ara?'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {/* Step 2: Dispositiu */}
        <section className={`clay-card p-6 space-y-4 border-2 transition-all ${selectedDevice ? 'border-blue-100 bg-blue-50/20' : 'border-transparent'}`}>
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
            Selecciona el Dispositiu
          </h2>
          
          {!selectedDevice ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Busca per SACE o SN..." 
                className="input-field pl-10"
                value={deviceQuery}
                onChange={e => setDeviceQuery(e.target.value)}
              />
              <AnimatePresence>
                {deviceResults.length > 0 && (
                   <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-10">
                    {deviceResults.map(d => (
                      <button 
                        key={d.id} 
                        onClick={() => { setSelectedDevice(d); setDeviceQuery(''); }}
                        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-slate-900">{d.tipusDispositiu}</span>
                          <span className="text-[10px] text-slate-500">SACE: {d.SACE} | SN: {d.SN}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                   <Laptop className="w-5 h-5" />
                </div>
                <div>
                   <p className="font-bold text-slate-900">{selectedDevice.tipusDispositiu}</p>
                   <p className="text-[10px] text-slate-400 font-mono">SACE: {selectedDevice.SACE}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {selectedDevice && (
            <div className="p-4 bg-blue-50 rounded-xl flex gap-3">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800">En confirmar l'assignació, l'estat del dispositiu passarà automàticament a "Entregat".</p>
            </div>
          )}
        </section>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button 
          disabled={!selectedPerson || !selectedDevice}
          onClick={handleCreate}
          className={`btn-primary px-8 py-4 text-lg w-full sm:w-auto flex items-center gap-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Confirmar Assignació
          <ArrowRight className="w-5 h-5" />
        </button>
        {isSuccess && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-green-600 font-bold">
            <CheckCircle className="w-5 h-5" />
            Assignació realitzada correctament!
          </motion.div>
        )}
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
                <div className="text-right">
                  <span className={`badge ${a.estat === AssignmentStatus.ACTIVA ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'}`}>
                    {a.estat}
                  </span>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{new Date(a.startedAt).toLocaleDateString('ca-ES')}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  );
};

export default Assignacions;
