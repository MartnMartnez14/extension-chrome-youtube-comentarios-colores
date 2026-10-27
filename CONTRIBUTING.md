# Guía de Contribución — YT Temporal Comments

¡Gracias por tu interés en mejorar **YT Temporal Comments**!

Repositorio oficial: <https://github.com/MartnMartnez14/extension-chrome-youtube-comentarios-colores>

---

## 1. Estructura del repositorio

- `extension/`: Código fuente de la extensión de Google Chrome (Manifest V3). Cualquier mejora orientada al producto final para la Chrome Web Store se desarrolla aquí.
- `web-prototype/`: Prototipo original en Python/Flask que usa la YouTube IFrame Player API. Útil para pruebas rápidas de interfaz en un entorno aislado.

---

## 2. Reglas técnicas y de calidad

Para mantener la extensión segura, rápida y aprobable en la Chrome Web Store:

1. **Sin dependencias externas ni código remoto:** No agregues CDNs externos (`https://...`) en archivos de `extension/`. Todo debe ser código local auditable.
2. **Seguridad DOM:** Nunca uses `innerHTML` con datos del usuario o títulos de videos. Usá siempre `textContent` y `document.createElement`.
3. **Accesibilidad (WCAG 2.2 AA):**
   - Todo botón o marcador interactivo debe ser accesible con teclado (`button` nativo, `tabIndex`, `aria-label`).
   - Conservá el soporte de flechas de teclado en el selector de colores (`role="radiogroup"`).
4. **Estética consistente:** Respetá las variables CSS del diseño (`--bg: #101114`, `--panel: #18191e`, `--accent: #f07159`) y la paleta oficial de 10 colores definida en `extension/src/utils/common.js`.

---

## 3. Flujo para enviar cambios (Pull Requests)

1. Hacé un fork del repositorio.
2. Creá una rama descriptiva (`git checkout -b feat/edicion-de-notas` o `fix/ajuste-timeline`).
3. Probá tus cambios cargando la carpeta `extension/` en `chrome://extensions/` sobre un video real de YouTube.
4. Ejecutá las pruebas unitarias disponibles antes de hacer commit.
5. Abrí un Pull Request explicando qué problema resuelve y cómo lo verificaste.
