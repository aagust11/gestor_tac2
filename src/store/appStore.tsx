import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppData, Device, Person, Assignment, Incident, FileHandles, DeviceStatus, AssignmentStatus, IncidentStatus, DeviceType } from '../types';
import { indexedDbService } from '../services/indexedDbService';
import { fileSystemService } from '../services/fileSystemService';
import { dataService } from '../services/dataService';
import { excelService } from '../services/excelService';

interface AppContextType {
  data: AppData;
  handles: FileHandles;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setJsonHandle: (handle: FileSystemFileHandle | null) => Promise<void>;
  setExcelAssignmentsHandle: (handle: FileSystemFileHandle | null) => Promise<void>;
  setExcelStatusesHandle: (handle: FileSystemFileHandle | null) => Promise<void>;
  checkPermissions: () => Promise<boolean>;
  
  // CRUD
  addDevice: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDevice: (id: string, updates: Partial<Device>) => Promise<void>;
  deleteDevice: (id: string) => Promise<void>;
  
  addPerson: (person: Omit<Person, 'id' | 'createdAt'>) => Promise<void>;
  updatePerson: (id: string, updates: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  
  createAssignment: (personId: string, deviceId: string, returnsOtherIds: string[]) => Promise<void>;
  
  addIncident: (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIncident: (id: string, updates: Partial<Incident>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(dataService.getEmptyData());
  const [handles, setHandles] = useState<FileHandles>({ jsonData: null, excelAssignments: null, excelStatuses: null });
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load handles on mount
  useEffect(() => {
    const init = async () => {
      try {
        const storedHandles = await indexedDbService.getAllHandles();
        const newHandles: FileHandles = {
          jsonData: (storedHandles['jsonData'] as FileSystemFileHandle) || null,
          excelAssignments: (storedHandles['excelAssignments'] as FileSystemFileHandle) || null,
          excelStatuses: (storedHandles['excelStatuses'] as FileSystemFileHandle) || null,
        };
        setHandles(newHandles);
        
        if (newHandles.jsonData) {
          // If we have a JSON handle, try to load data (if permissions allow)
          const hasPerm = await fileSystemService.verifyPermission(newHandles.jsonData, true);
          if (hasPerm) {
            const loadedData = await dataService.loadData(newHandles.jsonData);
            setData(loadedData);
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Error carregant la configuració.');
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const checkPermissions = useCallback(async () => {
    if (!handles.jsonData) return false;
    const jsonOk = await fileSystemService.verifyPermission(handles.jsonData, true);
    let assignOk = true;
    let statusOk = true;
    
    if (handles.excelAssignments) assignOk = await fileSystemService.verifyPermission(handles.excelAssignments, true);
    if (handles.excelStatuses) statusOk = await fileSystemService.verifyPermission(handles.excelStatuses, true);
    
    if (jsonOk) {
      const loadedData = await dataService.loadData(handles.jsonData);
      setData(loadedData);
      setIsReady(true);
    }
    
    return jsonOk && assignOk && statusOk;
  }, [handles]);

  const setJsonHandle = async (handle: FileSystemFileHandle | null) => {
    if (handle) {
      await indexedDbService.saveHandle('jsonData', handle);
      const hasPerm = await fileSystemService.verifyPermission(handle, true);
      if (hasPerm) {
        const loadedData = await dataService.loadData(handle);
        setData(loadedData);
        setIsReady(true);
      }
    } else {
      await indexedDbService.removeHandle('jsonData');
      setIsReady(false);
    }
    setHandles(prev => ({ ...prev, jsonData: handle }));
  };

  const setExcelAssignmentsHandle = async (handle: FileSystemFileHandle | null) => {
    if (handle) {
      await indexedDbService.saveHandle('excelAssignments', handle);
      await fileSystemService.verifyPermission(handle, true);
    } else {
      await indexedDbService.removeHandle('excelAssignments');
    }
    setHandles(prev => ({ ...prev, excelAssignments: handle }));
  };

  const setExcelStatusesHandle = async (handle: FileSystemFileHandle | null) => {
    if (handle) {
      await indexedDbService.saveHandle('excelStatuses', handle);
      await fileSystemService.verifyPermission(handle, true);
    } else {
      await indexedDbService.removeHandle('excelStatuses');
    }
    setHandles(prev => ({ ...prev, excelStatuses: handle }));
  };

  const persist = async (newData: AppData) => {
    if (handles.jsonData) {
      const saved = await dataService.saveData(handles.jsonData, newData);
      setData(saved);
    } else {
      setData(newData);
    }
  };

  // CRUD Actions
  const addDevice = async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (data.devices.some(d => d.SACE === device.SACE)) {
      throw new Error('Ja existeix un dispositiu amb aquest SACE.');
    }
    const now = new Date().toISOString();
    const newDevice: Device = {
      ...device,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    const newData = { ...data, devices: [...data.devices, newDevice] };
    await persist(newData);
    
    // Side effect for status change if Ordinador Alumne/Docent
    if (newDevice.tipusDispositiu === DeviceType.ORDINADOR_ALUMNE || newDevice.tipusDispositiu === DeviceType.ORDINADOR_DOCENT) {
      if (handles.excelStatuses) {
        await excelService.registerStatus(handles.excelStatuses, newDevice.SACE, newDevice.estat);
      }
    }
  };

  const updateDevice = async (id: string, updates: Partial<Device>) => {
    const oldDevice = data.devices.find(d => d.id === id);
    if (!oldDevice) return;

    if (updates.SACE && updates.SACE !== oldDevice.SACE && data.devices.some(d => d.SACE === updates.SACE)) {
      throw new Error('Ja existeix un dispositiu amb aquest SACE.');
    }

    const now = new Date().toISOString();
    const updatedDevice = { ...oldDevice, ...updates, updatedAt: now };
    const newData = {
      ...data,
      devices: data.devices.map(d => d.id === id ? updatedDevice : d)
    };
    
    await persist(newData);

    // If status changed and it's a computer, update Excel
    if (updates.estat && updates.estat !== oldDevice.estat) {
      if (updatedDevice.tipusDispositiu === DeviceType.ORDINADOR_ALUMNE || updatedDevice.tipusDispositiu === DeviceType.ORDINADOR_DOCENT) {
        if (handles.excelStatuses) {
          await excelService.registerStatus(handles.excelStatuses, updatedDevice.SACE, updates.estat);
        }
      }
    }
  };

  const deleteDevice = async (id: string) => {
    const hasAssignments = data.assignments.some(a => a.deviceId === id);
    const hasIncidents = data.incidents.some(i => i.deviceId === id);
    if (hasAssignments || hasIncidents) {
      throw new Error('No es pot eliminar un dispositiu amb assignacions o incidències associades.');
    }
    const newData = { ...data, devices: data.devices.filter(d => d.id !== id) };
    await persist(newData);
  };

  const addPerson = async (person: Omit<Person, 'id' | 'createdAt'>) => {
    if (data.people.some(p => p.identificador === person.identificador)) {
      throw new Error('Ja existeix una persona amb aquest identificador (nom d\'usuari/altre).');
    }
    const newPerson: Person = {
      ...person,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    await persist({ ...data, people: [...data.people, newPerson] });
  };

  const updatePerson = async (id: string, updates: Partial<Person>) => {
    const old = data.people.find(p => p.id === id);
    if (!old) return;
    if (updates.identificador && updates.identificador !== old.identificador && data.people.some(p => p.identificador === updates.identificador)) {
      throw new Error('Aquest identificador ja està en ús.');
    }
    await persist({
      ...data,
      people: data.people.map(p => p.id === id ? { ...p, ...updates } : p)
    });
  };

  const deletePerson = async (id: string) => {
    const hasActiveAssignments = data.assignments.some(a => a.personId === id && a.estat === AssignmentStatus.ACTIVA);
    if (hasActiveAssignments) {
      throw new Error('No es pot eliminar una persona amb assignacions actives.');
    }
    await persist({ ...data, people: data.people.filter(p => p.id !== id) });
  };

  const createAssignment = async (personId: string, deviceId: string, returnsOtherIds: string[]) => {
    const person = data.people.find(p => p.id === personId);
    const device = data.devices.find(d => d.id === deviceId);
    if (!person || !device) throw new Error('Persona o dispositiu no trobats.');

    // Check if device is already assigned
    if (data.assignments.some(a => a.deviceId === deviceId && a.estat === AssignmentStatus.ACTIVA)) {
      throw new Error('Aquest dispositiu ja té una assignació activa.');
    }

    const now = new Date().toISOString();
    let updatedAssignments = [...data.assignments];
    let updatedDevices = [...data.devices];

    // 1. Process returns
    for (const returnId of returnsOtherIds) {
      const assignmentToFinish = updatedAssignments.find(a => a.id === returnId);
      if (assignmentToFinish) {
        assignmentToFinish.estat = AssignmentStatus.FINALITZADA;
        assignmentToFinish.endedAt = now;
        
        // If the returned device was "Entregat", set to "Disponible"
        const returnedDevice = updatedDevices.find(d => d.id === assignmentToFinish.deviceId);
        if (returnedDevice && returnedDevice.estat === DeviceStatus.ENTREGAT) {
          returnedDevice.estat = DeviceStatus.DISPONIBLE;
          returnedDevice.updatedAt = now;
          
          // Side effect: Excel status update
          if (returnedDevice.tipusDispositiu === DeviceType.ORDINADOR_ALUMNE || returnedDevice.tipusDispositiu === DeviceType.ORDINADOR_DOCENT) {
            if (handles.excelStatuses) {
              await excelService.registerStatus(handles.excelStatuses, returnedDevice.SACE, DeviceStatus.DISPONIBLE);
            }
          }
        }
      }
    }

    // 2. Create new assignment
    const newAssignment: Assignment = {
      id: crypto.randomUUID(),
      deviceId: deviceId,
      personId: personId,
      estat: AssignmentStatus.ACTIVA,
      startedAt: now
    };
    updatedAssignments.push(newAssignment);

    // 3. Update new device status to "Entregat"
    const targetDevice = updatedDevices.find(d => d.id === deviceId);
    if (targetDevice) {
      targetDevice.estat = DeviceStatus.ENTREGAT;
      targetDevice.updatedAt = now;
    }

    await persist({
      ...data,
      assignments: updatedAssignments,
      devices: updatedDevices
    });

    // 4. Excel side effects
    if (handles.excelAssignments && person) {
      await excelService.registerAssignment(handles.excelAssignments, person.identificador, targetDevice?.SACE || '');
    }
    if (handles.excelStatuses && targetDevice) {
      if (targetDevice.tipusDispositiu === DeviceType.ORDINADOR_ALUMNE || targetDevice.tipusDispositiu === DeviceType.ORDINADOR_DOCENT) {
        await excelService.registerStatus(handles.excelStatuses, targetDevice.SACE, DeviceStatus.ENTREGAT);
      }
    }
  };

  const addIncident = async (incident: Omit<Incident, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newIncident: Incident = {
      ...incident,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    };
    
    // Update device status to "Pendent de reparació"
    const updatedDevices = data.devices.map(d => {
      if (d.id === incident.deviceId) {
        return { ...d, estat: DeviceStatus.PENDENT_REPARACIO, updatedAt: now };
      }
      return d;
    });

    await persist({
      ...data,
      incidents: [...data.incidents, newIncident],
      devices: updatedDevices
    });

    // Excel side effect
    const dev = updatedDevices.find(d => d.id === incident.deviceId);
    if (dev && (dev.tipusDispositiu === DeviceType.ORDINADOR_ALUMNE || dev.tipusDispositiu === DeviceType.ORDINADOR_DOCENT)) {
      if (handles.excelStatuses) {
        await excelService.registerStatus(handles.excelStatuses, dev.SACE, DeviceStatus.PENDENT_REPARACIO);
      }
    }
  };

  const updateIncident = async (id: string, updates: Partial<Incident>) => {
    const now = new Date().toISOString();
    await persist({
      ...data,
      incidents: data.incidents.map(i => i.id === id ? { ...i, ...updates, updatedAt: now } : i)
    });
  };

  return (
    <AppContext.Provider value={{
      data, handles, isReady, isLoading, error,
      setJsonHandle, setExcelAssignmentsHandle, setExcelStatusesHandle, checkPermissions,
      addDevice, updateDevice, deleteDevice,
      addPerson, updatePerson, deletePerson,
      createAssignment, addIncident, updateIncident
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
