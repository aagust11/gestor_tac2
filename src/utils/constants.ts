/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DeviceType, DeviceStatus, AssignmentStatus, IncidentStatus } from '../types';

export const APP_VERSION = '1.0.0';

export const DEVICE_TYPES = Object.values(DeviceType);
export const DEVICE_STATUSES = Object.values(DeviceStatus);
export const ASSIGNMENT_STATUSES = Object.values(AssignmentStatus);
export const INCIDENT_STATUSES = Object.values(IncidentStatus);

export const STRINGS = {
  APP_NAME: "Inventari de Centre",
  DASHBOARD: "Inici",
  DEVICES: "Dispositius",
  PEOPLE: "Persones",
  ASSIGNMENTS: "Assignacions",
  INCIDENTS: "Incidències",
  CONFIG: "Configuració",
  NOT_CONFIGURED: "L'aplicació no està configurada completament.",
  BROWSER_NOT_SUPPORTED: "El navegador no és compatible amb l'accés directe a fitxers locals. Recomanem Google Chrome o Microsoft Edge.",
  JSON_NOT_SELECTED: "Cal seleccionar el fitxer data.json.",
  EXCELS_NOT_SELECTED: "Cal seleccionar els fitxers Excel de registre.",
  PERMISSIONS_REQUIRED: "Cal donar permisos per llegir i escriure als fitxers.",
  SAVE_SUCCESS: "S'ha desat correctament.",
  SAVE_ERROR: "Error en desar les dades.",
  SACE_EXISTS: "Ja existeix un dispositiu amb aquest SACE.",
  IDENTIFIER_EXISTS: "Ja existeix una persona amb aquest identificador.",
  DEVICE_ALREADY_ASSIGNED: "Aquest dispositiu ja té una assignació activa.",
  IFRAME_WARNING: "El sistema no pot accedir als teus fitxers locals mentre l'aplicació s'executa dins d'un marc (iframe). Per motius de seguretat, cal que obris l'aplicació en una pestanya nova per poder carregar o desar el fitxer JSON d'inventari.",
};
