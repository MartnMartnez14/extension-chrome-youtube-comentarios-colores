# Historial de Cambios (Changelog)

Todos los cambios relevantes de este proyecto se documentan en este archivo.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y el proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [0.2.0] - 2026-10-27

### Añadido
- Estructura completa de la extensión de Google Chrome bajo **Manifest V3** en `extension/`.
- Content Script (`extension/src/content/`) con aislamiento mediante **Shadow DOM** para inyectar la línea de tiempo y el panel de notas directamente en `youtube.com/watch`.
- Capa de almacenamiento unificada (`extension/src/storage/store.js`) con soporte para `chrome.storage.local`, sincronización en `chrome.storage.sync` y exportación/importación en archivo `.json`.
- Popup de gestión (`extension/src/popup/`) para ver estadísticas, alternar sincronización y exportar/importar copias de seguridad.
- Iconos oficiales de la extensión en `16x16`, `32x32`, `48x48` y `128x128` px.
- Documentación del proyecto: `ROADMAP.md`, `ARCHITECTURE.md`, `PRIVACY_POLICY.md`, `CHROME_STORE_CHECKLIST.md`, `CONTRIBUTING.md` y `CHANGELOG.md`.

### Cambiado
- Reorganización del prototipo original en Flask dentro del directorio `web-prototype/` conservando intacto su funcionamiento.
- Actualización de `README.md` y `.gitignore` para cubrir tanto la extensión de Chrome como el prototipo web.

---

## [0.1.0] - 2026-09-29

### Añadido
- Prototipo inicial en Python/Flask con YouTube IFrame Player API (`app.py`, `templates/index.html`, `static/app.js`, `static/styles.css`).
- Creación de notas temporales con selector accesible de 10 colores y línea de tiempo proporcional con salto temporal.
- Persistencia local por ID de video mediante `localStorage`.
