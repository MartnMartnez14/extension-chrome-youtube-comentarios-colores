# Política de Privacidad / Privacy Policy — YT Temporal Comments

**Última actualización / Last updated:** 27 de octubre de 2026

---

## Español

### 1. Resumen
**YT Temporal Comments** es una extensión de navegador que permite a los usuarios guardar notas privadas asociadas a momentos específicos (timestamps) de videos de YouTube. Respetamos estrictamente tu privacidad: **no recopilamos, no vendemos, no transmitimos ni almacenamos tus datos personales ni tus notas en servidores externos.**

### 2. Datos que maneja la extensión
- **Notas y marcadores temporales:** El texto de la nota, el color elegido, el segundo del video (`timestamp`) y el identificador público del video de YouTube (`videoId`).
- **Preferencias de configuración:** Si el usuario activa o desactiva la sincronización con su navegador.

### 3. Dónde y cómo se almacenan los datos
- **Almacenamiento local (`chrome.storage.local`):** Todos los datos se guardan directamente en el navegador del dispositivo del usuario.
- **Sincronización opcional (`chrome.storage.sync`):** Si el usuario lo habilita, Google Chrome sincroniza las notas entre los dispositivos donde el usuario haya iniciado sesión con su propia cuenta de Google, utilizando exclusivamente la infraestructura oficial de Chrome. El desarrollador de la extensión no tiene acceso a estos datos.
- **Exportación / Importación manual:** El usuario puede descargar sus propias notas en un archivo `.json` en su equipo o importarlas cuando lo desee.

### 4. Permisos utilizados
- `storage`: Necesario exclusivamente para guardar tus notas y preferencias en el navegador.
- Acceso a `*://*.youtube.com/*`: Necesario únicamente para mostrar el panel de notas y sincronizar la línea de tiempo con el reproductor de video de YouTube mientras navegás en el sitio.

### 5. Servicios de terceros y analíticas
Esta extensión **no utiliza** Google Analytics, rastreadores publicitarios, cookies de seguimiento ni servidores propios o de terceros. No ejecuta código remoto.

### 6. Contacto
Para dudas o consultas sobre esta política de privacidad, podés abrir un issue en el repositorio oficial:
<https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores/issues>

---

## English (For Chrome Web Store Review)

### 1. Overview
**YT Temporal Comments** is a browser extension that allows users to save private time-stamped notes with color markers on YouTube videos. We strictly respect your privacy: **we do not collect, sell, transmit, or store any personal data or user notes on external servers.**

### 2. Data Handled by the Extension
- **Time-stamped notes and markers:** The note text, selected color, video timestamp, and the public YouTube `videoId`.
- **User settings:** Preferences such as enabling or disabling Chrome storage synchronization.

### 3. Data Storage
- **Local Storage (`chrome.storage.local`):** All notes are stored locally on the user's device.
- **Optional Sync (`chrome.storage.sync`):** When enabled, Chrome synchronizes notes across the user's signed-in Chrome browsers using Google's native browser sync infrastructure. The developer has no access to this data.
- **Manual JSON Backup:** Users can manually export their notes to a local `.json` file or import them back at any time.

### 4. Permissions Justification
- `storage`: Used solely to persist user notes and extension settings in the browser.
- Host permission `*://*.youtube.com/*`: Used solely to render the note-taking timeline UI on YouTube video pages and interact with the HTML5 video player (read current time, duration, and seek to saved timestamps).

### 5. Third-Party Services & Analytics
This extension **does not use** analytics, telemetry, ad trackers, or external servers, and does not load remotely hosted code.

### 6. Contact
If you have any questions regarding this Privacy Policy, please open an issue at our official repository:
<https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores/issues>
