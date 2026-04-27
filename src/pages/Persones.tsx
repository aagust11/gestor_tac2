/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../store/appStore';
import { Plus, Search, Edit2, Trash2, User, Laptop, FileUp, Download } from 'lucide-react';
import { Person, AssignmentStatus } from '../types';
import { motion } from 'motion/react';
import { csvService } from '../services/csvService';

const Persones: React.FC = () => {
  const { data, addPerson, updatePerson, deletePerson, massAddPeople } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const [formData, setFormData] = useState({
    nom: '',
    correuElectronic: '',
    identificador: ''
  });

  const filteredPeople = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return data.people.filter(p => 
      (p.nom || '').toLowerCase().includes(term) ||
      (p.correuElectronic || '').toLowerCase().includes(term) ||
      (p.identificador || '').toLowerCase().includes(term)
    ).sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));
  }, [data.people, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    let rows: any[] = [];
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      rows = await csvService.parseExcel(file);
    } else {
      const text = await file.text();
      rows = csvService.parseCSV(text);
    }
    
    const validPeople = rows.map((r: any) => ({
      nom: r.nom || '',
      correuElectronic: r.correu || r['correu electrònic'] || r.email || '',
      identificador: r.identificador || r.id || r.dni || ''
    })).filter(p => p.nom && p.identificador);
    
    if (validPeople.length > 0) {
      await massAddPeople(validPeople as any);
      alert(`${validPeople.length} persones importades/actualitzades amb èxit.`);
    } else {
      alert("No s'han trobat dades vàlides. Columnes requerides: nom, correu, identificador.");
    }
    
    // Reset input
    e.target.value = '';
  };

  const downloadTemplate = () => {
    csvService.downloadTemplate('plantilla_persones.csv', ['nom', 'correu', 'identificador']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPerson) {
        await updatePerson(editingPerson.id, formData);
      } else {
        await addPerson(formData);
      }
      setIsModalOpen(false);
      setEditingPerson(null);
      setFormData({ nom: '', correuElectronic: '', identificador: '' });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (p: Person) => {
    setEditingPerson(p);
    setFormData({
      nom: p.nom,
      correuElectronic: p.correuElectronic,
      identificador: p.identificador
    });
    setIsModalOpen(true);
  };

  const getActiveAssignments = (personId: string) => {
    return data.assignments.filter(a => a.personId === personId && a.estat === AssignmentStatus.ACTIVA);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Persones</h1>
          <p className="text-slate-500 mt-1 font-medium">Gestió d'usuaris, docents i alumnes.</p>
        </div>

        <div className="flex gap-2">
          <label className="btn-secondary cursor-pointer">
            <FileUp className="w-4 h-4" />
            Importar dades
            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
          </label>
          <button onClick={downloadTemplate} className="btn-secondary" title="Descarregar Plantilla CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => { setIsModalOpen(true); setEditingPerson(null); }} className="btn-primary">
            <Plus className="w-4 h-4" />
            Nova Persona
          </button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cerca per nom, correu o identificador..." 
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="clay-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="table-header">Persona</th>
              <th className="table-header">Identificadors</th>
              <th className="table-header">Equips Actius</th>
              <th className="table-header text-right">Accions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPeople.map((person) => {
              const activeAssignments = getActiveAssignments(person.id);
              return (
                <motion.tr layout key={person.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block">{person.nom}</span>
                        <span className="text-xs text-slate-500">{person.correuElectronic}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">{person.identificador}</span>
                  </td>
                  <td className="px-6 py-4">
                    {activeAssignments.length === 0 ? (
                      <span className="text-xs text-slate-300 italic">Cap</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {activeAssignments.map(a => {
                          const dev = data.devices.find(d => d.id === a.deviceId);
                          return (
                            <div key={a.id} className="flex items-center gap-1 bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-md font-bold border border-blue-100">
                              <Laptop className="w-3 h-3" />
                              {dev?.SACE}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(person)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setIsConfirmOpen({ open: true, id: person.id })} 
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filteredPeople.length === 0 && (
          <div className="p-12 text-center text-gray-500">No s'han trobat persones.</div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold">{editingPerson ? 'Editar Persona' : 'Nova Persona'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom Complet</label>
                <input required type="text" className="input-field" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Correu Electrònic</label>
                <input required type="email" className="input-field" value={formData.correuElectronic} onChange={e => setFormData({...formData, correuElectronic: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Identificador (DNI/NIE/Usuari)</label>
                <input required type="text" className="input-field" value={formData.identificador} onChange={e => setFormData({...formData, identificador: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                <button type="submit" className="btn-primary flex-grow">{editingPerson ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Confirm Delete */}
      {isConfirmOpen.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
            <p className="font-bold text-gray-900 text-lg">Confirmació d'eliminació</p>
            <p className="text-sm text-gray-600">Estàs segur que vols eliminar aquesta persona? Només és possible si no té assignacions actives.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen({ open: false, id: '' })} className="btn-secondary flex-grow">Cancel·lar</button>
              <button 
                onClick={async () => {
                  try {
                    await deletePerson(isConfirmOpen.id);
                    setIsConfirmOpen({ open: false, id: '' });
                  } catch (err: any) { alert(err.message); setIsConfirmOpen({ open: false, id: '' }); }
                }} 
                className="btn-danger flex-grow"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Persones;
