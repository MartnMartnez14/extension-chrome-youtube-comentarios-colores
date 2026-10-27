(() => {
  'use strict';

  const COLORS = [
    { name: 'Coral', value: '#f07159' },
    { name: 'Naranja', value: '#f2a65a' },
    { name: 'Amarillo', value: '#e8ca67' },
    { name: 'Verde', value: '#80c783' },
    { name: 'Menta', value: '#59c5a5' },
    { name: 'Celeste', value: '#65c5d8' },
    { name: 'Azul', value: '#668fe8' },
    { name: 'Violeta', value: '#a58ae8' },
    { name: 'Rosa', value: '#e881b4' },
    { name: 'Blanco', value: '#d9d9de' },
  ];
  const STORAGE_PREFIX = 'yt-temporal-comments:';
  const $ = (selector) => document.querySelector(selector);
  const els = {
    form: $('#video-form'), url: $('#video-url'), urlError: $('#url-error'),
    placeholder: $('#player-placeholder'), playerFrame: $('#player-frame'),
    videoMeta: $('#video-meta'), videoIdLabel: $('#video-id-label'), durationLabel: $('#duration-label'),
    commentForm: $('#comment-form'), commentText: $('#comment-text'), saveButton: $('#save-button'),
    currentTime: $('#current-time'), capture: $('#capture-button'), colorPicker: $('#color-picker'),
    selectedColorName: $('#selected-color-name'), commentError: $('#comment-error'),
    list: $('#comments-list'), empty: $('#empty-state'), timeline: $('#timeline'),
    progress: $('#timeline-progress'), playhead: $('#playhead'), endTime: $('#end-time'),
    timelineCount: $('#timeline-count'), listCount: $('#list-count'), toast: $('#toast'),
  };

  let player = null;
  let playerReady = false;
  let videoId = null;
  let playerVideoId = null;
  let duration = 0;
  let comments = [];
  let selectedColor = COLORS[0];
  let tickHandle = null;
  let toastHandle = null;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const whole = Math.floor(seconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function showError(element, message) {
    element.textContent = message;
    element.hidden = !message;
  }

  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('visible');
    clearTimeout(toastHandle);
    toastHandle = setTimeout(() => els.toast.classList.remove('visible'), 2600);
  }

  function extractVideoId(rawUrl) {
    let parsed;
    try { parsed = new URL(rawUrl.trim()); } catch { return null; }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') id = parsed.pathname.split('/').filter(Boolean)[0];
    else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') id = parsed.searchParams.get('v');
      else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/);
        if (match) id = match[1];
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  function storageKey(id = videoId) { return `${STORAGE_PREFIX}${id}`; }

  function readComments(id) {
    try {
      const stored = localStorage.getItem(storageKey(id));
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed.filter((item) => item && typeof item.id === 'string' && Number.isFinite(item.timestamp) && typeof item.text === 'string' && COLORS.some((color) => color.value === item.color)).sort((a, b) => a.timestamp - b.timestamp) : [];
    } catch {
      showToast('No se pudo leer el almacenamiento local.');
      return [];
    }
  }

  function persistComments() {
    try {
      localStorage.setItem(storageKey(), JSON.stringify(comments));
      return true;
    } catch {
      showToast('No se pudieron guardar los cambios en este navegador.');
      return false;
    }
  }

  function renderColors() {
    els.colorPicker.replaceChildren();
    COLORS.forEach((color, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'color-choice';
      button.style.setProperty('--swatch', color.value);
      button.setAttribute('role', 'radio');
      button.setAttribute('aria-label', color.name);
      button.setAttribute('aria-checked', String(color.value === selectedColor.value));
      button.tabIndex = color.value === selectedColor.value ? 0 : -1;
      button.title = color.name;
      button.addEventListener('click', () => selectColor(color));
      button.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
        event.preventDefault();
        const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + COLORS.length) % COLORS.length;
        els.colorPicker.children[next].focus();
        els.colorPicker.children[next].click();
      });
      els.colorPicker.append(button);
    });
  }

  function selectColor(color) {
    selectedColor = color;
    els.selectedColorName.textContent = color.name;
    renderColors();
  }

  function renderComments() {
    comments.sort((a, b) => a.timestamp - b.timestamp);
    els.list.replaceChildren();
    els.empty.hidden = comments.length > 0;
    if (!comments.length) els.list.append(els.empty);
    comments.forEach((comment) => {
      const item = document.createElement('article');
      item.className = 'comment-item';
      item.style.setProperty('--item-color', comment.color);
      const colorBar = document.createElement('span');
      colorBar.className = 'comment-color';
      colorBar.setAttribute('aria-hidden', 'true');
      const main = document.createElement('div');
      main.className = 'comment-main';
      const timeButton = document.createElement('button');
      timeButton.className = 'comment-time';
      timeButton.type = 'button';
      timeButton.textContent = formatTime(comment.timestamp);
      timeButton.title = 'Volver a este momento';
      timeButton.addEventListener('click', () => seekTo(comment.timestamp));
      const copy = document.createElement('p');
      copy.className = 'comment-copy';
      copy.textContent = comment.text;
      main.append(timeButton, copy);
      const actions = document.createElement('div');
      actions.className = 'comment-actions';
      const remove = document.createElement('button');
      remove.className = 'icon-button';
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = 'Eliminar momento';
      remove.setAttribute('aria-label', `Eliminar comentario de ${formatTime(comment.timestamp)}`);
      remove.addEventListener('click', () => deleteComment(comment.id));
      actions.append(remove);
      item.append(colorBar, main, actions);
      els.list.append(item);
    });
    els.listCount.textContent = String(comments.length);
    els.timelineCount.textContent = `${comments.length} ${comments.length === 1 ? 'momento' : 'momentos'}`;
    renderTimeline();
  }

  function renderTimeline() {
    els.timeline.querySelectorAll('.timeline-marker').forEach((marker) => marker.remove());
    els.timeline.classList.toggle('has-comments', comments.length > 0);
    comments.forEach((comment) => {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'timeline-marker';
      marker.style.left = `${Math.min(100, Math.max(0, (duration > 0 ? comment.timestamp / duration : 0) * 100))}%`;
      marker.style.setProperty('--marker-color', comment.color);
      marker.style.backgroundColor = comment.color;
      marker.dataset.tooltip = `${formatTime(comment.timestamp)} · ${comment.text}`;
      marker.title = `${formatTime(comment.timestamp)} · ${comment.text}`;
      marker.setAttribute('aria-label', `Ir a ${formatTime(comment.timestamp)}: ${comment.text}`);
      marker.addEventListener('click', () => seekTo(comment.timestamp));
      els.timeline.append(marker);
    });
  }

  function updateClock() {
    if (!playerReady || !player) return;
    try {
      const current = player.getCurrentTime() || 0;
      const actualDuration = player.getDuration() || duration;
      if (actualDuration > 0 && Math.abs(actualDuration - duration) > 0.5) {
        duration = actualDuration;
        els.durationLabel.textContent = formatTime(duration);
        els.endTime.textContent = formatTime(duration);
        renderTimeline();
      }
      els.currentTime.textContent = formatTime(current);
      const percent = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
      els.progress.style.width = `${percent}%`;
      els.playhead.hidden = !duration;
      els.playhead.style.left = `${percent}%`;
    } catch { /* Player may be transitioning between videos. */ }
  }

  function seekTo(seconds) {
    if (!playerReady || !player) {
      showToast('Esperá a que el reproductor esté listo.');
      return;
    }
    player.seekTo(seconds, true);
    player.playVideo();
    updateClock();
  }

  function deleteComment(id) {
    const previous = comments;
    comments = comments.filter((comment) => comment.id !== id);
    if (persistComments()) renderComments();
    else comments = previous;
  }

  function addComment(event) {
    event.preventDefault();
    showError(els.commentError, '');
    if (!videoId || !playerReady) {
      showError(els.commentError, 'Primero cargá un video y esperá a que esté listo.');
      return;
    }
    const text = els.commentText.value.trim();
    if (!text) {
      showError(els.commentError, 'Escribí una nota antes de guardarla.');
      els.commentText.focus();
      return;
    }
    const timestamp = Math.max(0, player.getCurrentTime() || 0);
    const comment = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`, videoId, timestamp, text, color: selectedColor.value, createdAt: new Date().toISOString() };
    const previous = comments;
    comments = [...comments, comment].sort((a, b) => a.timestamp - b.timestamp);
    if (!persistComments()) { comments = previous; return; }
    renderComments();
    els.commentText.value = '';
    els.commentText.focus();
    showToast('Momento guardado.');
  }

  function activatePlayerForCurrentVideo(event) {
    playerReady = true;
    playerVideoId = videoId;
    duration = event.target.getDuration() || 0;
    els.placeholder.classList.add('is-hidden');
    els.videoMeta.hidden = false;
    els.videoIdLabel.textContent = `youtube.com/watch?v=${videoId}`;
    els.durationLabel.textContent = duration ? formatTime(duration) : 'Duración pendiente';
    els.endTime.textContent = duration ? formatTime(duration) : '--:--';
    els.commentText.disabled = false;
    els.saveButton.disabled = false;
    renderComments();
    updateClock();
    showToast('Video listo para guardar momentos.');
  }

  function onPlayerReady(event) {
    activatePlayerForCurrentVideo(event);
  }

  function onPlayerStateChange(event) {
    // onReady fires once per player instance. A later loadVideoById is ready
    // when the new video leaves the unstarted state.
    if (videoId && playerVideoId !== videoId && event.data !== YT.PlayerState.UNSTARTED) {
      activatePlayerForCurrentVideo(event);
    }
    if (event.data === YT.PlayerState.PLAYING) updateClock();
  }

  function onPlayerError(event) {
    const messages = { 2: 'El ID del video no es válido.', 5: 'No se pudo reproducir el video en el reproductor HTML5.', 100: 'No encontramos ese video o no está disponible.', 101: 'El propietario no permite insertar este video.', 150: 'El propietario no permite insertar este video.' };
    showToast(messages[event.data] || 'YouTube no pudo cargar este video.');
  }

  function loadVideo(id) {
    if (videoId === id && player) {
      player.loadVideoById(id);
      return;
    }
    videoId = id;
    comments = readComments(id);
    duration = 0;
    playerReady = false;
    els.commentText.disabled = true;
    els.saveButton.disabled = true;
    els.videoMeta.hidden = true;
    els.durationLabel.textContent = 'Duración pendiente';
    els.endTime.textContent = '--:--';
    els.currentTime.textContent = '00:00';
    els.progress.style.width = '0%';
    els.playhead.hidden = true;
    renderComments();
    if (player) {
      player.loadVideoById(id);
    } else if (window.YT && window.YT.Player) {
      createPlayer(id);
    } else {
      window.pendingVideoId = id;
      loadYouTubeApi();
    }
  }

  function createPlayer(id) {
    player = new YT.Player('player', {
      videoId: id,
      playerVars: { playsinline: 1, rel: 0, origin: window.location.origin },
      events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange, onError: onPlayerError },
    });
  }

  function loadYouTubeApi() {
    if (document.querySelector('script[data-youtube-api]')) return;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.dataset.youtubeApi = 'true';
    script.onerror = () => showToast('No se pudo conectar con la API de YouTube.');
    document.head.append(script);
  }

  window.onYouTubeIframeAPIReady = () => {
    if (window.pendingVideoId) createPlayer(window.pendingVideoId);
  };

  els.form.addEventListener('submit', (event) => {
    event.preventDefault();
    showError(els.urlError, '');
    const id = extractVideoId(els.url.value);
    if (!id) {
      showError(els.urlError, 'Ese enlace no parece ser una URL válida de YouTube.');
      els.url.focus();
      return;
    }
    loadVideo(id);
  });
  els.commentForm.addEventListener('submit', addComment);
  els.capture.addEventListener('click', () => {
    if (playerReady) updateClock();
    else showToast('Cargá un video para capturar el momento actual.');
  });
  renderColors();
  tickHandle = setInterval(updateClock, 250);
  void tickHandle;
})();
