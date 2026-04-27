/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DeviceType {
  ORDINADOR_ALUMNE = 'Ordinador Alumne',
  ORDINADOR_DOCENT = 'Ordinador Docent',
  TAULETA = 'Tauleta',
  MONITOR = 'Monitor',
  ALTRES = 'Altres'
}

export enum DeviceStatus {
  PER_ENTREGAR = 'Per entregar',
  DISPONIBLE = 'Disponible',
  ENTREGAT = 'Entregat',
  DESAPAREGUT = 'Desaparegut',
  PENDENT_REPARACIO = 'Pendent de reparació'
}

export enum AssignmentStatus {
  ACTIVA = 'Activa',
  FINALITZADA = 'Finalitzada'
}

export enum IncidentStatus {
  PENDENT_OBRIR = 'Pendent obrir',
  OBERTA = 'Oberta',
  RESOLTA = 'Resolta'
}

export interface Device {
  id: string;
  SACE: string;
  SN: string;
  tipusDispositiu: DeviceType;
  estat: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  nom: string;
  correuElectronic: string;
  identificador: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  deviceId: string;
  personId: string;
  estat: AssignmentStatus;
  startedAt: string;
  endedAt?: string;
}

export interface Incident {
  id: string;
  deviceId: string;
  REQ?: string;
  explicacio: string;
  comentaris?: string;
  estat: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentTemplate {
  id: string;
  titol: string;
  contingut: string;
}

export interface AppMetadata {
  version: string;
  updatedAt: string;
}

export interface AppData {
  devices: Device[];
  people: Person[];
  assignments: Assignment[];
  incidents: Incident[];
  incidentTemplates: IncidentTemplate[];
  metadata: AppMetadata;
}

export interface FileHandles {
  jsonData: FileSystemFileHandle | null;
  excelAssignments: FileSystemFileHandle | null;
  excelStatuses: FileSystemFileHandle | null;
}
