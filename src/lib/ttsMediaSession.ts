let handlersBound = false;

export function setTTSSessionActive(title: string, artist: string = 'PRISM'): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: title.slice(0, 80) || '음성 안내',
      artist,
      album: 'PRISM Universe',
      artwork: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
    navigator.mediaSession.playbackState = 'playing';
  } catch {
    // MediaMetadata unsupported on some browsers
  }
}

export function clearTTSSession(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
  } catch {
    // ignore
  }
}

export function initTTSSessionHandlers(onStop: () => void): void {
  if (handlersBound || typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  handlersBound = true;

  const bind = (action: MediaSessionAction, handler: (() => void) | null) => {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // action not supported
    }
  };

  bind('stop', onStop);
  bind('pause', onStop);

  bind('play', () => {
    // resume handled by visibility lifecycle; no-op here
  });
}