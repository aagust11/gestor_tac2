# Gestor d'Inventari de Centre

Aplicació web per gestionar dispositius, persones, assignacions i incidències d’un centre educatiu. Dissenyada per funcionar de forma totalment local, protegint la privadesa de les dades.

## Característiques Principals

- **Privadesa Total:** Les dades no s’envien mai a cap servidor. Es guarden en un fitxer `data.json` al teu propi ordinador.
- **Integració amb Excel:** Permet registrar automàticament assignacions i canvis d'estat en fitxers Excel locals existents (`indic_assignacions.xlsx` i `indic_estats.xlsx`).
- **Navegació Fluida:** Utilitza React amb HashRouter per a una compatibilitat total amb GitHub Pages.
- **Persistència Intel·ligent:** Recorda els teus fitxers locals utilitzant IndexedDB i la File System Access API.

## Requisits del Sistema

- Un navegador modern amb suport per a la **File System Access API** (recomanat: **Google Chrome** o **Microsoft Edge**).
- L'aplicació és una Web App estàtica, es pot executar des de qualsevol hosting (com GitHub Pages).

## Instal·lació i Desenvolupament

1. **Instal·lar dependències:**
   ```bash
   npm install
   ```

2. **Executar en local:**
   ```bash
   npm run dev
   ```

3. **Fer el build:**
   ```bash
   npm run build
   ```

## Publicació a GitHub Pages

1. Assegura't que el fitxer `vite.config.ts` té la base configurada si no estàs a l'arrel de l'usuari (normalment `./` o el nom del repo).
2. Fes el build del projecte.
3. Puja el contingut de la carpeta `dist` a la branca `gh-pages` del teu repositori.

## Com funciona la persistència?

La frase clau de l’aplicació és:
**“Les dades no van a cap servidor: es desen en un JSON local, i el navegador només en guarda l’enllaç per reobrir-lo.”**

### Configuració Inicial

Quan obris l'aplicació per primera vegada, cal anar a la pantalla de **Configuració**:

1. **data.json:** Selecciona un fitxer existent o crea'n un de nou. Aquí es guardarà tot l'inventari.
2. **indic_assignacions.xlsx:** Selecciona aquest fitxer perquè l'app hi pugui escriure les noves assignacions (full `Registre`).
3. **indic_estats.xlsx:** Selecciona aquest fitxer per registrar els canvis d'estat de portàtils (full `Registre`).

**Nota Important:** Els fitxers Excel NO es creen automàticament. L'usuari els ha de tenir prèviament creats amb l'encapçalament corresponent i el full anomenat `Registre`.

## Seguretat

Aquesta aplicació utilitza la **File System Access API**. Cada vegada que tanquis i tornis a obrir el navegador, per seguretat, l'aplicació et demanarà que tornis a donar permís de lectura i escriptura als fitxers. Només cal fer clic al botó de "Verificar permisos" a la pantalla de configuració o a l'avís inicial.

---
Creat amb ❤️ per al centre educatiu.
