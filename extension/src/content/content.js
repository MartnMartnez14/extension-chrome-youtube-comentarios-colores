(() => {
  'use strict';

  const Common = globalThis.YTTemporalCommon;
  const Store = globalThis.YTTemporalStore;
  const HOST_ID = 'yt-temporal-comments-host';

  let currentVideoId = null;
  let comments = [];
  let selectedColor = Common.COLORS[0];
  let isCollapsed = false;
  let hostEl = null;
  let shadowRoot = null;
  let ui = {};
  let lastObservedHref = location.href;

  function getYouTubeVideoElement() {
    return document.querySelector('video.html5-main-video') || document.querySelector('video');
  }

  function getCurrentVideoTitle() {
    const h1 = document.querySelector('ytd-watch-metadata h1 yt-formatted-string')
      || document.querySelector('#title h1')
      || document.querySelector('h1.ytd-video-primary-info-renderer');
    if (h1 && h1.textContent && h1.textContent.trim()) {
      return h1.textContent.trim();
    }
    return document.title.replace(/\s*-\s*YouTube$/i, '').trim();
  }

  function findMountTarget() {
    const secondaryInner = document.querySelector('#secondary-inner');
    if (secondaryInner && secondaryInner.offsetParent !== null) {
      return { parent: secondaryInner, mode: 'prepend' };
    }
    const secondary = document.querySelector('#secondary');
    if (secondary && secondary.offsetParent !== null) {
      return { parent: secondary, mode: 'prepend' };
    }
    const below = document.querySelector('#below');
    if (below) {
      return { parent: below, mode: 'prepend' };
    }
    return null;
  }

  function buildPanelDom(root) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
      ? chrome.runtime.getURL('src/content/content.css')
      : 'src/content/content.css';
    root.append(link);

    const panel = document.createElement('section');
    panel.className = 'ytt-panel';
    panel.setAttribute('aria-label', 'YT Temporal Comments');

    // Header
    const header = document.createElement('header');
    header.className = 'ytt-header';

    const brand = document.createElement('div');
    brand.className = 'ytt-brand';
    const mark = document.createElement('span');
    mark.className = 'ytt-brand-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '▶';
    const brandText = document.createElement('span');
    brandText.textContent = 'YT ';
    const brandStrong = document.createElement('strong');
    brandStrong.textContent = 'Temporal';
    brandText.append(brandStrong);
    brand.append(mark, brandText);

    const headerActions = document.createElement('div');
    headerActions.className = 'ytt-header-actions';
    const countBadge = document.createElement('span');
    countBadge.className = 'ytt-badge';
    countBadge.textContent = '0 momentos';

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'ytt-toggle-btn';
    toggleBtn.title = 'Colapsar o expandir panel';
    toggleBtn.setAttribute('aria-label', 'Colapsar o expandir panel');
    toggleBtn.textContent = '−';

    headerActions.append(countBadge, toggleBtn);
    header.append(brand, headerActions);

    // Body
    const body = document.createElement('div');
    body.className = 'ytt-body';

    // Timeline box
    const timelineBox = document.createElement('div');
    timelineBox.className = 'ytt-timeline-box';

    const timeLabels = document.createElement('div');
    timeLabels.className = 'ytt-time-labels';
    const startLabel = document.createElement('span');
    startLabel.textContent = '00:00';
    const endLabel = document.createElement('span');
    endLabel.textContent = '--:--';
    timeLabels.append(startLabel, endLabel);

    const timeline = document.createElement('div');
    timeline.className = 'ytt-timeline';
    timeline.setAttribute('role', 'group');
    timeline.setAttribute('aria-label', 'Marcadores de comentarios');

    const progress = document.createElement('div');
    progress.className = 'ytt-timeline-progress';
    const playhead = document.createElement('div');
    playhead.className = 'ytt-playhead';
    playhead.hidden = true;
    timeline.append(progress, playhead);
    timelineBox.append(timeLabels, timeline);

    // Form
    const form = document.createElement('form');
    form.className = 'ytt-form';

    const captureRow = document.createElement('div');
    captureRow.className = 'ytt-capture-row';
    const captureTime = document.createElement('div');
    captureTime.className = 'ytt-capture-time';
    const captureDot = document.createElement('span');
    captureDot.className = 'ytt-capture-dot';
    const currentTimeText = document.createElement('span');
    currentTimeText.textContent = '00:00';
    const captureCaption = document.createElement('span');
    captureCaption.className = 'ytt-capture-caption';
    captureCaption.textContent = 'instante actual';
    captureTime.append(captureDot, currentTimeText, captureCaption);

    const captureBtn = document.createElement('button');
    captureBtn.type = 'button';
    captureBtn.className = 'ytt-capture-btn';
    captureBtn.title = 'Actualizar al segundo actual';
    captureBtn.setAttribute('aria-label', 'Actualizar al segundo actual');
    captureBtn.textContent = '⟳';
    captureRow.append(captureTime, captureBtn);

    const textarea = document.createElement('textarea');
    textarea.className = 'ytt-textarea';
    textarea.rows = 2;
    textarea.maxLength = Common.MAX_COMMENT_LENGTH;
    textarea.placeholder = '¿Qué querés recordar de este momento?';
    textarea.setAttribute('aria-label', 'Escribí tu nota temporal');

    // Stop YouTube global shortcuts (like k, j, l, f, m, space) while typing inside our textarea
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    textarea.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    textarea.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    const colorLabel = document.createElement('div');
    colorLabel.className = 'ytt-color-label';
    const colorPrompt = document.createElement('span');
    colorPrompt.textContent = 'Color del marcador';
    const selectedColorName = document.createElement('span');
    selectedColorName.textContent = selectedColor.name;
    colorLabel.append(colorPrompt, selectedColorName);

    const colorPicker = document.createElement('div');
    colorPicker.className = 'ytt-color-picker';
    colorPicker.setAttribute('role', 'radiogroup');
    colorPicker.setAttribute('aria-label', 'Color del comentario');

    const errorMsg = document.createElement('p');
    errorMsg.className = 'ytt-error';
    errorMsg.setAttribute('role', 'alert');
    errorMsg.hidden = true;

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'ytt-save-btn';
    const saveText = document.createElement('span');
    saveText.textContent = 'Guardar momento';
    const savePlus = document.createElement('span');
    savePlus.setAttribute('aria-hidden', 'true');
    savePlus.textContent = '＋';
    saveBtn.append(saveText, savePlus);

    form.append(captureRow, textarea, colorLabel, colorPicker, errorMsg, saveBtn);

    // List
    const list = document.createElement('div');
    list.className = 'ytt-list';
    list.setAttribute('aria-live', 'polite');

    const empty = document.createElement('div');
    empty.className = 'ytt-empty';
    const emptyIcon = document.createElement('span');
    emptyIcon.className = 'ytt-empty-icon';
    emptyIcon.setAttribute('aria-hidden', 'true');
    emptyIcon.textContent = '✳';
    const emptyText = document.createElement('span');
    emptyText.textContent = 'Tus notas temporales de este video aparecerán acá.';
    empty.append(emptyIcon, emptyText);

    const footer = document.createElement('div');
    footer.className = 'ytt-footer';
    const footerNote = document.createElement('span');
    footerNote.textContent = '⌑ Privado en tu navegador';
    const videoIdSpan = document.createElement('span');
    videoIdSpan.textContent = '';
    footer.append(footerNote, videoIdSpan);

    body.append(timelineBox, form, list, empty, footer);
    panel.append(header, body);
    root.append(panel);

    ui = {
      panel,
      body,
      countBadge,
      toggleBtn,
      endLabel,
      timeline,
      progress,
      playhead,
      currentTimeText,
      captureBtn,
      textarea,
      selectedColorName,
      colorPicker,
      errorMsg,
      form,
      list,
      empty,
      videoIdSpan,
    };

    toggleBtn.addEventListener('click', () => {
      isCollapsed = !isCollapsed;
      ui.body.hidden = isCollapsed;
      ui.toggleBtn.textContent = isCollapsed ? '＋' : '−';
    });

    captureBtn.addEventListener('click', () => {
      updateClock();
      ui.textarea.focus();
    });

    form.addEventListener('submit', onAddComment);
    renderColors();
  }

  function renderColors() {
    if (!ui.colorPicker) return;
    ui.colorPicker.replaceChildren();
    Common.COLORS.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ytt-color-choice';
      btn.style.setProperty('--swatch', color.value);
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-label', color.name);
      btn.setAttribute('aria-checked', String(color.value === selectedColor.value));
      btn.tabIndex = color.value === selectedColor.value ? 0 : -1;
      btn.title = color.name;
      btn.addEventListener('click', () => {
        selectedColor = color;
        ui.selectedColorName.textContent = color.name;
        renderColors();
      });
      btn.addEventListener('keydown', (event) => {
        event.stopPropagation();
        if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
        event.preventDefault();
        const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + Common.COLORS.length) % Common.COLORS.length;
        const target = ui.colorPicker.children[next];
        if (target) {
          target.focus();
          target.click();
        }
      });
      ui.colorPicker.append(btn);
    });
  }

  function seekTo(seconds) {
    const video = getYouTubeVideoElement();
    if (!video) return;
    video.currentTime = Math.max(0, seconds);
    if (video.paused) {
      video.play().catch(() => {});
    }
    updateClock();
  }

  async function deleteComment(commentId) {
    if (!currentVideoId) return;
    const next = comments.filter((c) => c.id !== commentId);
    comments = next;
    await Store.saveComments(currentVideoId, comments, { title: getCurrentVideoTitle() });
    renderComments();
  }

  async function onAddComment(event) {
    event.preventDefault();
    ui.errorMsg.hidden = true;
    ui.errorMsg.textContent = '';

    if (!currentVideoId) {
      ui.errorMsg.textContent = 'No se detectó un video activo.';
      ui.errorMsg.hidden = false;
      return;
    }

    const text = ui.textarea.value.trim();
    if (!text) {
      ui.errorMsg.textContent = 'Escribí una nota antes de guardarla.';
      ui.errorMsg.hidden = false;
      ui.textarea.focus();
      return;
    }

    const video = getYouTubeVideoElement();
    const timestamp = video && Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const title = getCurrentVideoTitle();

    const newComment = Common.createComment({
      videoId: currentVideoId,
      videoTitle: title,
      timestamp,
      text,
      color: selectedColor.value,
    });

    if (!newComment) return;
    comments = [...comments, newComment].sort((a, b) => a.timestamp - b.timestamp);
    await Store.saveComments(currentVideoId, comments, { title });
    ui.textarea.value = '';
    renderComments();
  }

  function renderTimeline(duration) {
    if (!ui.timeline) return;
    ui.timeline.querySelectorAll('.ytt-marker').forEach((m) => m.remove());
    comments.forEach((comment) => {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'ytt-marker';
      const pct = duration > 0 ? Math.min(100, Math.max(0, (comment.timestamp / duration) * 100)) : 0;
      marker.style.left = `${pct}%`;
      marker.style.backgroundColor = comment.color;
      marker.title = `${Common.formatTime(comment.timestamp)} · ${comment.text}`;
      marker.setAttribute('aria-label', `Ir a ${Common.formatTime(comment.timestamp)}: ${comment.text}`);
      marker.addEventListener('click', () => seekTo(comment.timestamp));
      ui.timeline.append(marker);
    });
  }

  function renderComments() {
    if (!ui.list) return;
    comments.sort((a, b) => a.timestamp - b.timestamp);
    ui.list.replaceChildren();
    ui.empty.hidden = comments.length > 0;
    ui.countBadge.textContent = `${comments.length} ${comments.length === 1 ? 'momento' : 'momentos'}`;

    comments.forEach((comment) => {
      const item = document.createElement('article');
      item.className = 'ytt-item';
      item.style.setProperty('--item-color', comment.color);

      const bar = document.createElement('span');
      bar.className = 'ytt-item-bar';
      bar.setAttribute('aria-hidden', 'true');

      const main = document.createElement('div');
      main.className = 'ytt-item-main';

      const timeBtn = document.createElement('button');
      timeBtn.type = 'button';
      timeBtn.className = 'ytt-item-time';
      timeBtn.textContent = Common.formatTime(comment.timestamp);
      timeBtn.title = 'Saltar a este momento';
      timeBtn.addEventListener('click', () => seekTo(comment.timestamp));

      const textEl = document.createElement('p');
      textEl.className = 'ytt-item-text';
      textEl.textContent = comment.text;

      main.append(timeBtn, textEl);

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'ytt-delete-btn';
      delBtn.textContent = '×';
      delBtn.title = 'Eliminar momento';
      delBtn.setAttribute('aria-label', `Eliminar nota de ${Common.formatTime(comment.timestamp)}`);
      delBtn.addEventListener('click', () => deleteComment(comment.id));

      item.append(bar, main, delBtn);
      ui.list.append(item);
    });

    const video = getYouTubeVideoElement();
    const duration = video && Number.isFinite(video.duration) ? video.duration : 0;
    renderTimeline(duration);
  }

  function updateClock() {
    if (!ui.currentTimeText) return;
    const video = getYouTubeVideoElement();
    if (!video) return;

    const current = Number.isFinite(video.currentTime) ? video.currentTime : 0;
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;

    ui.currentTimeText.textContent = Common.formatTime(current);
    ui.endLabel.textContent = duration > 0 ? Common.formatTime(duration) : '--:--';

    const pct = duration > 0 ? Math.min(100, Math.max(0, (current / duration) * 100)) : 0;
    ui.progress.style.width = `${pct}%`;
    ui.playhead.hidden = duration <= 0;
    ui.playhead.style.left = `${pct}%`;
  }

  function ensureMounted() {
    const videoId = Common.extractVideoId(location.href);
    if (!videoId) {
      if (hostEl && hostEl.isConnected) {
        hostEl.remove();
      }
      currentVideoId = null;
      return;
    }

    const mount = findMountTarget();
    if (!mount) return;

    if (!hostEl) {
      hostEl = document.createElement('div');
      hostEl.id = HOST_ID;
      shadowRoot = hostEl.attachShadow({ mode: 'open' });
      buildPanelDom(shadowRoot);
    }

    if (hostEl.parentElement !== mount.parent) {
      mount.parent.prepend(hostEl);
    }

    if (currentVideoId !== videoId) {
      currentVideoId = videoId;
      if (ui.videoIdSpan) ui.videoIdSpan.textContent = videoId;
      Store.getComments(videoId).then((loaded) => {
        if (currentVideoId === videoId) {
          comments = loaded;
          renderComments();
          updateClock();
        }
      });
    }
  }

  document.addEventListener('yt-navigate-finish', () => {
    setTimeout(ensureMounted, 150);
  });

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && currentVideoId) {
        const key = `${Common.STORAGE_PREFIX}${currentVideoId}`;
        if (changes[key]) {
          Store.getComments(currentVideoId).then((loaded) => {
            comments = loaded;
            renderComments();
          });
        }
      }
    });
  }

  setInterval(() => {
    if (location.href !== lastObservedHref) {
      lastObservedHref = location.href;
      ensureMounted();
    } else if (!hostEl || !hostEl.isConnected) {
      ensureMounted();
    }
    if (currentVideoId) {
      updateClock();
    }
  }, 500);

  ensureMounted();
})();
