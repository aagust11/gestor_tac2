/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useApp } from '../store/appStore';
import { Plus, Search, Edit2, Trash2, Laptop, Info, History, AlertTriangle } from 'lucide-react';
import { DEVICE_TYPES, DEVICE_STATUSES } from '../utils/constants';
import { Device, DeviceType, DeviceStatus, AssignmentStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const Dispositius: React.FC = () => {
  const { data, addDevice, updateDevice, deleteDevice } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [historyDevId, setHistoryDevId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    SACE: '',
    SN: '',
    tipusDispositiu: DEVICE_TYPES[0],
    estat: DeviceStatus.DISPONIBLE
  });

  const filteredDevices = useMemo(() => {
    return data.devices.filter(d => 
      d.SACE.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.SN.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.tipusDispositiu.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data.devices, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await updateDevice(editingDevice.id, formData);
      } else {
        await addDevice(formData);
      }
      setIsModalOpen(false);
      setEditingDevice(null);
      setFormData({ SACE: '', SN: '', tipusDispositiu: DEVICE_TYPES[0], estat: DeviceStatus.DISPONIBLE });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      SACE: device.SACE,
      SN: device.SN,
      tipusDispositiu: device.tipusDispositiu,
      estat: device.estat
    });
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteDevice(isConfirmOpen.id);
      setIsConfirmOpen({ open: false, id: '' });
    } catch (err: any) {
      alert(err.message);
      setIsConfirmOpen({ open: false, id: '' });
    }
  };

  const DeviceHistoryModal = ({ devId }: { devId: string }) => {
    const assignments = data.assignments.filter(a => a.deviceId === devId)
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    const incidents = data.incidents.filter(i => i.deviceId === devId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-xl font-bold">Historial del Dispositiu</h3>
            <button onClick={() => setHistoryDevId(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <div className="p-6 overflow-y-auto space-y-8">
            <section>
              <h4 className="font-bold flex items-center gap-2 mb-3 text-brand-primary">
                <History className="w-4 h-4" /> Assignacions
              </h4>
              {assignments.length === 0 ? <p className="text-sm text-gray-500 italic">Sense assignacions.</p> : (
                <div className="space-y-4">
                  {assignments.map(a => {
                    const p = data.people.find(p => p.id === a.personId);
                    return (
                      <div key={a.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                        <p><strong>Usuari:</strong> {p?.nom || 'Desconegut'} ({p?.identificador})</p>
                        <p><strong>Inici:</strong> {new Date(a.startedAt).toLocaleDateString('ca-ES')}</p>
                        {a.endedAt && <p><strong>Final:</strong> {new Date(a.endedAt).toLocaleDateString('ca-ES')}</p>}
                        <p><strong>Estat:</strong> <span className={a.estat === AssignmentStatus.ACTIVA ? 'text-green-600 font-bold' : 'text-gray-400'}>{a.estat}</span></p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section>
              <h4 className="font-bold flex items-center gap-2 mb-3 text-red-500">
                <AlertTriangle className="w-4 h-4" /> Incidències
              </h4>
              {incidents.length === 0 ? <p className="text-sm text-gray-500 italic">Sense incidències.</p> : (
                <div className="space-y-4">
                  {incidents.map(i => (
                    <div key={i.id} className="p-3 bg-gray-50 rounded-lg text-sm border border-gray-100">
                      <p><strong>REQ:</strong> {i.REQ}</p>
                      <p><strong>Data:</strong> {new Date(i.createdAt).toLocaleDateString('ca-ES')}</p>
                      <p><strong>Estat:</strong> {i.estat}</p>
                      <p><strong>Explicació:</strong> {i.explicacio}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dispositius</h1>
          <p className="text-slate-500 mt-1 font-medium">Llistat i gestió de l'inventari tecnològic.</p>
        </div>
        <button onClick={() => { setIsModalOpen(true); setEditingDevice(null); }} className="btn-primary">
          <Plus className="w-4 h-4" />
          Nou Dispositiu
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Cerca per SACE, SN o tipus..." 
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
              <th className="table-header">Dispositiu</th>
              <th className="table-header">Identificadors</th>
              <th className="table-header">Estat</th>
              <th className="table-header text-right">Accions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDevices.map((device) => (
              <motion.tr layout key={device.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-slate-900">{device.tipusDispositiu}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <p className="text-slate-900 flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase w-8">SACE</span>
                    <span className="font-mono font-bold">{device.SACE}</span>
                  </p>
                  <p className="text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 font-black uppercase w-8">SN</span>
                    <span className="font-mono">{device.SN}</span>
                  </p>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${
                    device.estat === DeviceStatus.DISPONIBLE ? 'bg-green-100 text-green-700' :
                    device.estat === DeviceStatus.ENTREGAT ? 'bg-blue-100 text-blue-700' :
                    device.estat === DeviceStatus.PENDENT_REPARACIO ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {device.estat}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setHistoryDevId(device.id)} title="Historial" className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                      <History className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(device)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setIsConfirmOpen({ open: true, id: device.id })} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {filteredDevices.length === 0 && (
          <div className="p-12 text-center text-gray-500">No s'han trobat dispositius.</div>
        )}
      </div>

      {/* History Modal */}
      {historyDevId && <DeviceHistoryModal devId={historyDevId} />}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-6">
            <h2 className="text-xl font-bold">{editingDevice ? 'Editar Dispositiu' : 'Nou Dispositiu'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">SACE (Únic)</label>
                <input required type="text" className="input-field" value={formData.SACE} onChange={e => setFormData({...formData, SACE: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SN</label>
                <input required type="text" className="input-field" value={formData.SN} onChange={e => setFormData({...formData, SN: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipus</label>
                <select className="input-field" value={formData.tipusDispositiu} onChange={e => setFormData({...formData, tipusDispositiu: e.target.value as DeviceType})}>
                  {DEVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Estat</label>
                <select className="input-field" value={formData.estat} onChange={e => setFormData({...formData, estat: e.target.value as DeviceStatus})}>
                  {DEVICE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-grow">Cancel·lar</button>
                <button type="submit" className="btn-primary flex-grow">{editingDevice ? 'Guardar' : 'Crear'}</button>
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
            <p className="text-sm text-gray-600">Estàs segur que vols eliminar aquest dispositiu? Aquesta acció no es pot desfer.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsConfirmOpen({ open: false, id: '' })} className="btn-secondary flex-grow">Cancel·lar</button>
              <button onClick={handleDelete} className="btn-danger flex-grow">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dispositius;
