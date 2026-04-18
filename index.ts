import { registerRootComponent } from 'expo';
import App from './App';

if (typeof document !== 'undefined') {
  // ── PWA manifest link ──────────────────────────────────────────────────────
  if (!document.querySelector('link[rel="manifest"]')) {
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/manifest.json';
    document.head.appendChild(link);
  }

  // ── iOS PWA meta tags ──────────────────────────────────────────────────────
  const iosMeta: Record<string, string> = {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Motor Insurance',
    'mobile-web-app-capable': 'yes',
  };
  Object.entries(iosMeta).forEach(([name, content]) => {
    if (!document.querySelector(`meta[name="${name}"]`)) {
      const meta = document.createElement('meta');
      meta.name = name;
      meta.content = content;
      document.head.appendChild(meta);
    }
  });

  // ── Apple touch icon ───────────────────────────────────────────────────────
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'apple-touch-icon';
    icon.href = '/assets/icon.png';
    document.head.appendChild(icon);
  }

  // ── Prevent zoom on input focus (iOS) ─────────────────────────────────────
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content',
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
    );
  }

  // ── Service worker ─────────────────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

registerRootComponent(App);
