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
  const SETTINGS_KEY = 'yt-temporal-settings';
  const INDEX_KEY = 'yt-temporal-index';
  const MAX_COMMENT_LENGTH = 500;

  function formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const whole = Math.floor(seconds);
    const hours = Math.floor(whole / 3600);
    const minutes = Math.floor((whole % 3600) / 60);
    const secs = whole % 60;
    return hours
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function extractVideoId(rawUrl) {
    if (typeof rawUrl !== 'string' || !rawUrl.trim()) return null;
    let parsed;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      return null;
    }
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0];
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (parsed.pathname === '/watch') {
        id = parsed.searchParams.get('v');
      } else {
        const match = parsed.pathname.match(/^\/(?:embed|shorts|live)\/([^/?#]+)/);
        if (match) id = match[1];
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  }

  function isValidColor(colorValue) {
    return typeof colorValue === 'string' && COLORS.some((c) => c.value.toLowerCase() === colorValue.toLowerCase());
  }

  function sanitizeComment(raw, fallbackVideoId = null) {
    if (!raw || typeof raw !== 'object') return null;
    const videoId = typeof raw.videoId === 'string' && /^[\w-]{11}$/.test(raw.videoId)
      ? raw.videoId
      : (typeof fallbackVideoId === 'string' && /^[\w-]{11}$/.test(fallbackVideoId) ? fallbackVideoId : null);
    if (!videoId) return null;

    const id = typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim().slice(0, 80)
      : null;
    if (!id) return null;

    const timestamp = Number(raw.timestamp);
    if (!Number.isFinite(timestamp) || timestamp < 0) return null;

    if (typeof raw.text !== 'string') return null;
    const text = raw.text.trim().slice(0, MAX_COMMENT_LENGTH);
    if (!text) return null;

    const color = isValidColor(raw.color)
      ? COLORS.find((c) => c.value.toLowerCase() === raw.color.toLowerCase()).value
      : COLORS[0].value;

    const createdAt = typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
      ? new Date(raw.createdAt).toISOString()
      : new Date().toISOString();

    const sanitized = {
      id,
      videoId,
      timestamp: Math.round(timestamp * 100) / 100,
      text,
      color,
      createdAt,
    };

    if (typeof raw.videoTitle === 'string' && raw.videoTitle.trim()) {
      sanitized.videoTitle = raw.videoTitle.trim().slice(0, 200);
    }

    return sanitized;
  }

  function validateCommentsArray(arr, fallbackVideoId = null) {
    if (!Array.isArray(arr)) return [];
    const seenIds = new Set();
    const valid = [];
    for (const item of arr) {
      const clean = sanitizeComment(item, fallbackVideoId);
      if (clean && !seenIds.has(clean.id)) {
        seenIds.add(clean.id);
        valid.push(clean);
      }
    }
    return valid.sort((a, b) => a.timestamp - b.timestamp);
  }

  function createComment({ videoId, videoTitle = '', timestamp, text, color }) {
    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
    return sanitizeComment({
      id,
      videoId,
      videoTitle,
      timestamp,
      text,
      color: isValidColor(color) ? color : COLORS[0].value,
      createdAt: new Date().toISOString(),
    }, videoId);
  }

  const api = {
    COLORS,
    STORAGE_PREFIX,
    SETTINGS_KEY,
    INDEX_KEY,
    MAX_COMMENT_LENGTH,
    formatTime,
    extractVideoId,
    isValidColor,
    sanitizeComment,
    validateCommentsArray,
    createComment,
  };

  globalThis.YTTemporalCommon = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})();
