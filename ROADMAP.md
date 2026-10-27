# Hoja de Ruta (Roadmap) — YT Temporal Comments

Este documento organiza las etapas para evolucionar **YT Temporal Comments** desde el prototipo original en Flask hasta una extensión publicada en la **Chrome Web Store** bajo **Manifest V3**.

---

## Fase 1: Organización, Arquitectura y Base Manifest V3 (Actual)
- [x] Preservación del prototipo funcional en `web-prototype/`.
- [x] Creación de documentación base del proyecto (`README.md`, `ROADMAP.md`, `ARCHITECTURE.md`, `PRIVACY_POLICY.md`, `CHROME_STORE_CHECKLIST.md`, `CONTRIBUTING.md`, `CHANGELOG.md`).
- [x] Configuración inicial de `extension/manifest.json` cumpliendo las políticas de seguridad y privacidad de Chrome Web Store.
- [x] Extracción de utilidades puras (`formatTime`, paleta de 10 colores, validadores y parser de IDs de YouTube).
- [x] Capa de almacenamiento híbrida (`chrome.storage.local` + `chrome.storage.sync` + exportación/importación JSON).
- [x] Creación de iconos base (16, 32, 48, 128 px) y popup de gestión.
- [x] Content Script inicial con aislamiento por **Shadow DOM** en `youtube.com/watch`.

---

## Fase 2: Experiencia Integrada en YouTube (Core UX)
- [ ] Perfeccionar el anclaje del panel en los distintos modos de vista de YouTube:
  - Modo predeterminado (columna lateral `#secondary` o bajo el reproductor `#below`).
  - Modo Cine (*Theater Mode*).
  - Modo Pantalla Completa (superposición discreta u ocultamiento limpio).
- [ ] Sincronización en tiempo real con `<video class="html5-main-video">` mediante eventos nativos (`timeupdate`, `loadedmetadata`, `durationchange`, `seeked`).
- [ ] Manejo robusto de la navegación interna SPA de YouTube (`yt-navigate-finish`, cambios de URL y recarga de comentarios al cambiar de video).
- [ ] Edición de notas existentes (cambiar texto o color sin perder el timestamp).
- [ ] Atajo de teclado rápido (ej. `Alt+N`) para capturar el instante actual sin salir del reproductor.

---

## Fase 3: Gestión de Biblioteca, Sincronización y Respaldos
- [ ] Guardar metadatos ligeros del video (título del video e ID) al crear una nota para mostrarlos en el Popup de la extensión.
- [ ] Buscador y filtro por color dentro del video actual y en el Popup general.
- [ ] Control de cuota de `chrome.storage.sync` (límite de 100 KB / 8 KB por ítem en Chrome) con fallback transparente a `chrome.storage.local`.
- [ ] Exportación en formatos adicionales opcionales (Markdown con enlaces directos `https://youtu.be/<id>?t=<s>s` para pegar en Notion/Obsidian).

---

## Fase 4: Calidad, Seguridad y Publicación en Chrome Web Store (v1.0.0)
- [ ] Auditoría de accesibilidad WCAG 2.2 AA (foco visible, navegación por teclado en marcadores y radiogroup de colores, contraste).
- [ ] Auditoría de seguridad defensiva (prevención de XSS usando `textContent` / DOM seguro, validación estricta al importar archivos JSON).
- [ ] Preparación de activos gráficos para la tienda (capturas 1280x800, tile promocional 440x280).
- [ ] Empaquetado `.zip` limpio y envío a revisión en el Chrome Web Store Developer Dashboard.
